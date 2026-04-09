/*
 * AIC Scheduler Script: Approver Status Report Job
 *
 * Scans both:
 *   1. All in-progress (pending) governance requests — checks active approvers
 *   2. All published workflow definitions — checks configured approvers
 *      (both static actor lists and expression-based/scripted actor lists)
 *
 * Sends a combined HTML email report with two sections:
 *   Part 1: Inactive approvers found on pending requests
 *           (approver email, request ID, requestType ID, approval node type)
 *   Part 2: Inactive approvers found on workflow definitions
 *           (approver email, approval node name, workflow ID, workflow name)
 *
 * Uses openidm.action('/external/rest', ...) with a service account Bearer token
 * to call the workflow definition API (/auto/orchestration/definition).
 * Uses openidm.action('/iga/governance/requests', ...) internally for pending requests.
 *
 * Triggered by: AIC scheduler (configure to run on desired interval, e.g. daily)
 */

// ============================================================
// CONFIGURATION
// ============================================================

var REQUEST_PAGE_SIZE       = 50;
var WORKFLOW_PAGE_SIZE      = 100;
var REPORT_FROM             = '<kyid_donotreply@ky.gov>';
var REPORT_RECIPIENTS_GROUP = 'mgmt-email-receiver';
var REPORT_SUBJECT          = 'KYID – Approver Status Report';

// Service account credentials — read from Environment Secret Variables (ESVs)

var ssoBaseUrl       = identityServer.getProperty("esv.kyid.tenant.hostname");
var saClientId       = identityServer.getProperty("esv.kyid.workflow.job.client.id");
var saPrivateKeyJson = identityServer.getProperty('esv.kyid.workflow.job.private.key.json');


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Returns true if a value is absent or represents an empty/null string.
 * Handles legacy "null" / "NULL" string values present in migrated data.
 */
function isNullOrEmpty(val) {
    return val === null || val === undefined || val === '' || val === 'null' || val === 'NULL';
}

/** Returns the current timestamp as an ISO 8601 string. */
function getCurrentISODateTime() {
    return new Date().toISOString();
}

/**
 * Queries members of an alpha_group and returns a list of their email addresses.
 * Returns an empty array if the group is not found or has no members with email.
 *
 * @param {string} groupName - The _id of the alpha_group (e.g. 'mgmt-email-receiver')
 */
function getGroupRecipients(groupName) {
    var path = 'managed/alpha_group/' + groupName + '/members';
    try {
        var result = openidm.query(path, { _queryFilter: 'true', _fields: 'mail' });
        if (!result || !result.result || result.result.length === 0) {
            logger.error('[getGroupRecipients] No members found in group: {}', groupName);
            return [];
        }
        var emails = [];
        for (var i = 0; i < result.result.length; i++) {
            var mail = result.result[i].mail;
            if (!isNullOrEmpty(mail)) {
                emails.push(mail);
            }
        }
        logger.error('[getGroupRecipients] Group "{}" — {} member(s), {} with email: {}',
            groupName, result.result.length, emails.length, emails.join(', '));
        return emails;
    } catch (e) {
        logger.error('[getGroupRecipients] EXCEPTION querying group "{}": {}', groupName, e.message || String(e));
        return [];
    }
}

/**
 * Reads an alpha_user record by _id and returns the relevant fields.
 * Returns null on failure.
 *
 * @param {string} userId - The alpha_user _id (UUID)
 */
function getApproverUserRecord(userId) {
    var path = 'managed/alpha_user/' + userId;
    try {
        var record = openidm.read(path, null, ['_id', 'userName', 'givenName', 'sn', 'mail', 'accountStatus']);
        if (!record) {
            logger.error('[getApproverUserRecord] No alpha_user record found for userId={}', userId);
        }
        return record || null;
    } catch (e) {
        logger.error('[getApproverUserRecord] EXCEPTION reading userId={}: {}', userId, e.message || String(e));
        return null;
    }
}

/**
 * Extracts the ForgeRock user UUID from an actor id of the form "managed/user/{uuid}".
 * Returns null if the id is not in that format.
 *
 * @param {string} actorId - e.g. "managed/user/e4662d79-f615-49f6-aff3-00ab9ef052b7"
 */
function extractUserIdFromActorId(actorId) {
    if (isNullOrEmpty(actorId)) {
        return null;
    }
    var parts = actorId.split('/');
    if (parts.length === 3 && parts[0] === 'managed' && parts[1] === 'user') {
        return parts[2];
    }
    logger.error('[extractUserIdFromActorId] Unrecognised actor id format: {}', actorId);
    return null;
}

/**
 * Returns a human-readable label for an approval phase node ID.
 *
 * @param {string} phaseName - e.g. "approvalTask-95a73e18cff6"
 */
function phaseLabel(phaseName) {
    var labels = {
        'approvalTask-95a73e18cff6': 'Level 1 Primary Approval',
        'approvalTask-ca89c676a630': 'Level 1 Backup Approval',
        'approvalTask-27b7f3b9d10e': 'Level 2 Primary Approval',
        'approvalTask-36de7246f5e0': 'Level 2 Backup Approval'
    };
    return labels[phaseName] || (phaseName || 'Unknown Phase');
}

/**
 * Fetches one page of in-progress governance requests via the internal IGA action.
 * Returns the parsed response object, or null on error.
 *
 * @param {number} offset - _pagedResultsOffset for the query
 */
function fetchRequestPage(offset) {
    var payloadObj = {
        targetFilter: {
            operator: 'AND',
            operand: [
                {
                    operator: 'EQUALS',
                    operand: {
                        targetName:  'decision.status',
                        targetValue: 'in-progress'
                    }
                }
            ]
        }
    };
    var queryParams = {
        _action:             'search',
        _pagedResultsOffset: offset,
        _pageSize:           REQUEST_PAGE_SIZE,
        _sortKeys:           'decision.startDate',
        _sortDir:            'desc',
        _sortType:           'date'
    };
    try {
        return openidm.action('/iga/governance/requests', 'POST', payloadObj, queryParams);
    } catch (e) {
        logger.error('[fetchRequestPage] EXCEPTION fetching requests (offset={}): {}', offset, e.message || String(e));
        return null;
    }
}

/**
 * Obtains an OAuth2 access token from AM using the JWT bearer grant (service account).
 * Signs a short-lived JWT assertion with RS256, then exchanges it for an access token.
 * Returns the access_token string, or null on failure.
 */
function getAccessToken() {
    logger.error('[getAccessToken] Fetching service account access token from AM...');

    if (isNullOrEmpty(ssoBaseUrl) || isNullOrEmpty(saClientId) || isNullOrEmpty(saPrivateKeyJson)) {
        logger.error('[getAccessToken] ERROR — Missing credential value(s): ssoBaseUrl={}, saClientId={}, saPrivateKeyJson={}',
            ssoBaseUrl,
            isNullOrEmpty(saClientId)       ? '(empty)' : '(set)',
            isNullOrEmpty(saPrivateKeyJson) ? '(empty)' : '(set)');
        return null;
    }

    var tokenUrl = ssoBaseUrl + '/am/oauth2/access_token';
    logger.error('[getAccessToken] Token URL: {}', tokenUrl);

    try {
        var jwk = JSON.parse(saPrivateKeyJson);

        function b64urlToBigInt(s) {
            var b64 = s.replace(/-/g, '+').replace(/_/g, '/');
            var bytes = java.util.Base64.getDecoder().decode(b64);
            return new java.math.BigInteger(1, bytes);
        }

        var keySpec = new java.security.spec.RSAPrivateCrtKeySpec(
            b64urlToBigInt(jwk.n),
            b64urlToBigInt(jwk.e),
            b64urlToBigInt(jwk.d),
            b64urlToBigInt(jwk.p),
            b64urlToBigInt(jwk.q),
            b64urlToBigInt(jwk.dp),
            b64urlToBigInt(jwk.dq),
            b64urlToBigInt(jwk.qi)
        );
        var privateKey = java.security.KeyFactory.getInstance('RSA').generatePrivate(keySpec);
        logger.error('[getAccessToken] RSA private key reconstructed from JWK.');

        function b64urlEncode(bytes) {
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        }
        function strToUtf8Bytes(s) {
            return new java.lang.String(s).getBytes('UTF-8');
        }

        var now = Math.floor(new Date().getTime() / 1000);
        var jwtHeader  = { alg: 'RS256', typ: 'JWT' };
        var jwtPayload = {
            iss: saClientId,
            sub: saClientId,
            aud: tokenUrl,
            iat: now,
            exp: now + 180,
            jti: java.util.UUID.randomUUID().toString()
        };

        var headerB64    = b64urlEncode(strToUtf8Bytes(JSON.stringify(jwtHeader)));
        var payloadB64   = b64urlEncode(strToUtf8Bytes(JSON.stringify(jwtPayload)));
        var signingInput = headerB64 + '.' + payloadB64;

        var sig = java.security.Signature.getInstance('SHA256withRSA');
        sig.initSign(privateKey);
        sig.update(strToUtf8Bytes(signingInput));
        var assertion = signingInput + '.' + b64urlEncode(sig.sign());
        logger.error('[getAccessToken] JWT assertion signed successfully.');

        var formBody = 'client_id=service-account'
            + '&grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')
            + '&assertion='  + encodeURIComponent(assertion)
            + '&scope='      + encodeURIComponent('fr:am:* fr:idm:*');

        var result;
        try {
            result = openidm.action('/external/rest', 'call', {
                url:     tokenUrl,
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    formBody
            });
        } catch (httpErr) {
            logger.error('[getAccessToken] HTTP call failed: {}', httpErr.message || String(httpErr));
            return null;
        }

        logger.error('[getAccessToken] Raw token response: {}', JSON.stringify(result));
        var tokenData = (typeof result === 'string') ? JSON.parse(result) : result;
        if (tokenData && tokenData.access_token) {
            logger.error('[getAccessToken] Access token retrieved successfully.');
            return tokenData.access_token;
        }
        logger.error('[getAccessToken] ERROR — access_token not found in response.');
        return null;
    } catch (e) {
        logger.error('[getAccessToken] Unexpected exception: {}', e.message || String(e));
        return null;
    }
}

/**
 * Fetches one page of published workflow definitions via external HTTP (Bearer token).
 * Returns the parsed response object, or null on error.
 *
 * @param {string} accessToken - Bearer token for Authorization header
 * @param {number} offset      - _pagedResultsOffset for the query
 */
function fetchWorkflowPage(accessToken, offset) {
    var url = ssoBaseUrl + '/auto/orchestration/definition'
        + '?_pageSize='            + WORKFLOW_PAGE_SIZE
        + '&_pagedResultsOffset='  + offset
        + '&status=published'
        + '&_namePrefix=';
    try {
        var result = openidm.action('/external/rest', 'call', {
            url:     url,
            method:  'GET',
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        return (typeof result === 'string') ? JSON.parse(result) : result;
    } catch (e) {
        logger.error('[fetchWorkflowPage] EXCEPTION (offset={}): {}', offset, e.message || String(e));
        return null;
    }
}

/**
 * Extracts email addresses from a JS script string using a quoted-string regex.
 * Used for expression-based actor lists where approver emails are hardcoded in the script.
 *
 * @param {string} scriptText - The expression script value
 * @returns {string[]} Array of unique email addresses found
 */
function extractEmailsFromScript(scriptText) {
    var emails  = [];
    var seen    = {};
    if (isNullOrEmpty(scriptText)) {
        return emails;
    }
    var pattern = /["']([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})["']/g;
    var match;
    while ((match = pattern.exec(scriptText)) !== null) {
        var addr = match[1];
        if (!seen[addr]) {
            seen[addr] = true;
            emails.push(addr);
        }
    }
    return emails;
}

/**
 * Looks up an alpha_user record by email address.
 * Returns the user record (with accountStatus), or null if not found.
 *
 * @param {string} email - The user's mail address
 */
function getUserByEmail(email) {
    if (isNullOrEmpty(email)) {
        return null;
    }
    try {
        var result = openidm.query(
            'managed/alpha_user',
            { '_queryFilter': 'mail eq "' + email + '"', '_fields': '_id,userName,givenName,sn,mail,accountStatus' }
        );
        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        }
        logger.error('[getUserByEmail] No alpha_user found for email: {}', email);
        return null;
    } catch (e) {
        logger.error('[getUserByEmail] EXCEPTION for email "{}": {}', email, e.message || String(e));
        return null;
    }
}

/**
 * Builds the combined HTML email body with two sections:
 *   Part 1 — inactive approvers on pending requests
 *   Part 2 — inactive approvers on workflow definitions
 *
 * Part 1 row shape: { email, userId, status, requestId, requestTypeId, approvalNodeType }
 * Part 2 row shape: { email, userId, status, approvalNodeName, workflowId, workflowDisplayName }
 *
 * @param {Array}  part1Rows      - Rows for the pending-requests section
 * @param {Array}  part2Rows      - Rows for the workflow-definitions section
 * @param {number} totalRequests  - Total in-progress requests checked
 * @param {number} totalWorkflows - Total published workflows checked
 */
function buildEmailBody(part1Rows, part2Rows, totalRequests, totalWorkflows) {

    // ── Part 1 table ─────────────────────────────────────────────────────────
    var part1TableRows = '';
    if (part1Rows.length === 0) {
        part1TableRows =
            '<tr><td colspan="6" style="padding:10px 12px;border:1px solid #ddd;color:#006600;font-style:italic;">' +
            'No issues found on pending requests.' +
            '</td></tr>';
    } else {
        for (var i = 0; i < part1Rows.length; i++) {
            var r   = part1Rows[i];
            var rbg = (r.status === 'User Not Found') ? '#ffd6d6' : '#fff3cd';
            part1TableRows +=
                '<tr style="background:' + rbg + ';">' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.email           || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.userId          || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.status          || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.requestId       || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.requestTypeId   || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (r.approvalNodeType || '—') + '</td>' +
                '</tr>';
        }
    }

    var part1Section =
        '<h3 style="color:#c00;margin-top:24px;">Part 1: Pending Requests with Approver Issues</h3>' +
        '<p>Checked <strong>' + totalRequests + '</strong> in-progress request(s). ' +
        'Found <strong>' + part1Rows.length + '</strong> approver issue(s).</p>' +
        '<table style="border-collapse:collapse;width:100%;">' +
          '<thead>' +
            '<tr style="background:#003366;color:#fff;">' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Approver Email</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">User ID</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Status</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Request ID</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">RequestType ID</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Approval Node</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + part1TableRows + '</tbody>' +
        '</table>';

    // ── Part 2 table ─────────────────────────────────────────────────────────
    var part2TableRows = '';
    if (part2Rows.length === 0) {
        part2TableRows =
            '<tr><td colspan="6" style="padding:10px 12px;border:1px solid #ddd;color:#006600;font-style:italic;">' +
            'No issues found on workflow definitions.' +
            '</td></tr>';
    } else {
        for (var j = 0; j < part2Rows.length; j++) {
            var w   = part2Rows[j];
            var wbg = (w.status === 'User Not Found') ? '#ffd6d6' : '#fff3cd';
            part2TableRows +=
                '<tr style="background:' + wbg + ';">' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.email               || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.userId              || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.status              || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.approvalNodeName    || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.workflowId          || '—') + '</td>' +
                  '<td style="padding:6px 12px;border:1px solid #ddd;">' + (w.workflowDisplayName || '—') + '</td>' +
                '</tr>';
        }
    }

    var part2Section =
        '<h3 style="color:#c00;margin-top:32px;">Part 2: Workflow Definitions with Approver Issues</h3>' +
        '<p>Checked <strong>' + totalWorkflows + '</strong> published workflow(s). ' +
        'Found <strong>' + part2Rows.length + '</strong> approver issue(s).</p>' +
        '<table style="border-collapse:collapse;width:100%;">' +
          '<thead>' +
            '<tr style="background:#003366;color:#fff;">' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Approver Email</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">User ID</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Status</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Approval Node</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Workflow ID</th>' +
              '<th style="padding:8px 12px;border:1px solid #ccc;text-align:left;">Workflow Name</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + part2TableRows + '</tbody>' +
        '</table>';

    return '' +
        '<html><body style="font-family:Arial,sans-serif;font-size:13px;color:#222;">' +
        '<h2 style="color:#c00;">KYID – Approver Status Report</h2>' +
        '<p>Report generated: ' + getCurrentISODateTime() + '</p>' +
        part1Section +
        part2Section +
        '<br><p style="color:#888;font-size:11px;">This is an automated message from the KYID Approver Status Scheduler.</p>' +
        '</body></html>';
}

/**
 * Builds a simple "all clear" HTML email body when no inactive approvers are found
 * in either scan.
 *
 * @param {number} totalRequests  - Total in-progress requests checked
 * @param {number} totalWorkflows - Total published workflows checked
 */
function buildAllClearEmailBody(totalRequests, totalWorkflows) {
    return '' +
        '<html><body style="font-family:Arial,sans-serif;font-size:13px;color:#222;">' +
        '<h2 style="color:#006600;">KYID – Approver Status Report: All Clear</h2>' +
        '<p>Report generated: ' + getCurrentISODateTime() + '</p>' +
        '<p>Checked <strong>' + totalRequests  + '</strong> in-progress request(s) and ' +
                '<strong>' + totalWorkflows + '</strong> published workflow(s).</p>' +
        '<p style="color:#006600;font-weight:bold;">All approvers are active. No action required.</p>' +
        '<br><p style="color:#888;font-size:11px;">This is an automated message from the KYID Approver Status Scheduler.</p>' +
        '</body></html>';
}

/**
 * Sends the HTML report via the ForgeRock external email service.
 *
 * @param {string}   htmlBody   - HTML content of the email
 * @param {string[]} recipients - List of recipient email addresses
 */
function sendReportEmail(htmlBody, recipients) {
    if (!recipients || recipients.length === 0) {
        logger.error('No recipients — email not sent.');
        return;
    }

    var emailObj = {
        from:    REPORT_FROM,
        to:      recipients.join(','),
        subject: REPORT_SUBJECT,
        type:    'text/html',
        body:    htmlBody
    };

    try {
        openidm.action('external/email', 'send', emailObj);
        logger.error('Report email sent successfully to: {}', recipients.join(', '));
    } catch (e) {
        logger.error('EXCEPTION sending email: {}', e.message || String(e));
    }
}

// ============================================================
// MAIN SCRIPT
// ============================================================

logger.error('======================================================================');
logger.error('Approver Status Scheduler: START — {}', getCurrentISODateTime());
logger.error('======================================================================');
logger.error('Config — requestPageSize={}, workflowPageSize={}, reportFrom={}, recipientsGroup={}',
    REQUEST_PAGE_SIZE, WORKFLOW_PAGE_SIZE, REPORT_FROM, REPORT_RECIPIENTS_GROUP);

// ── Resolve report recipients from group ──────────────────────────────
var reportRecipients = getGroupRecipients(REPORT_RECIPIENTS_GROUP);
if (reportRecipients.length === 0) {
    logger.error('ERROR — No recipients resolved from group "{}". Aborting.', REPORT_RECIPIENTS_GROUP);
    throw { code: 500, message: 'Approver Status Scheduler: No report recipients found — aborting.' };
}
logger.error('Resolved {} recipient(s): {}', reportRecipients.length, reportRecipients.join(', '));

// ── Obtain service account access token (needed for workflow scan) ────
logger.error('Obtaining service account access token...');
var accessToken = getAccessToken();
if (!accessToken) {
    logger.error('ERROR — Failed to retrieve access token. Aborting.');
    throw { code: 500, message: 'Approver Status Scheduler: Unable to obtain access token — aborting.' };
}
logger.error('Access token retrieved successfully.');

// ── Scan pending requests for inactive approvers ─────────────────────
logger.error('Fetching in-progress governance requests (pageSize={})...', REQUEST_PAGE_SIZE);

var allRequests  = [];
var reqOffset    = 0;
var reqPaging    = true;
var reqPageNum   = 0;

while (reqPaging) {
    reqPageNum++;
    var reqPage = fetchRequestPage(reqOffset);

    if (!reqPage || !reqPage.result) {
        logger.error('Failed to retrieve page {} (offset={}). Stopping pagination.', reqPageNum, reqOffset);
        reqPaging = false;
    } else if (reqPage.result.length === 0) {
        reqPaging = false;
    } else {
        for (var rp = 0; rp < reqPage.result.length; rp++) {
            allRequests.push(reqPage.result[rp]);
        }
        logger.error('Page {} — fetched {} request(s), total so far: {}',
            reqPageNum, reqPage.result.length, allRequests.length);
        if (reqPage.result.length < REQUEST_PAGE_SIZE) {
            reqPaging = false;
        } else {
            reqOffset += REQUEST_PAGE_SIZE;
        }
    }
}

logger.error('Fetched {} in-progress request(s) in total.', allRequests.length);

var part1Rows    = [];
var userCacheById = {};

for (var r = 0; r < allRequests.length; r++) {
    var req   = allRequests[r];
    var reqId = req.id || '(unknown)';

    var requestTypeId = req.requestType
        || (req.request && req.request.common && req.request.common.requestType)
        || 'N/A';

    var actors = (req.decision && req.decision.actors && req.decision.actors.active)
                 ? req.decision.actors.active
                 : [];

    for (var ra = 0; ra < actors.length; ra++) {
        var actor = actors[ra];

        // Skip SYSTEM actor and actors without approve permission
        if (actor.id === 'SYSTEM' || !actor.permissions || actor.permissions.approve !== true) {
            continue;
        }

        var userId = extractUserIdFromActorId(actor.id);
        if (userId === null) {
            continue;
        }

        if (!userCacheById.hasOwnProperty(userId)) {
            userCacheById[userId] = getApproverUserRecord(userId);
        }

        var userRec  = userCacheById[userId];
        var nodeType = phaseLabel(actor.phase || '');
        if (!userRec) {
            logger.error('USER NOT FOUND — requestId="{}", requestTypeId="{}", node="{}", userId="{}"',
                reqId, requestTypeId, nodeType, userId);
            part1Rows.push({
                email:            'N/A',
                userId:           userId,
                status:           'User Not Found',
                requestId:        reqId,
                requestTypeId:    requestTypeId,
                approvalNodeType: nodeType
            });
        } else if (userRec.accountStatus.toLowerCase() !== 'active') {
            logger.error('NON-ACTIVE — requestId="{}", requestTypeId="{}", node="{}", userId="{}", email="{}", accountStatus="{}"',
                reqId, requestTypeId, nodeType, userId, userRec.mail || '', userRec.accountStatus);
            part1Rows.push({
                email:            userRec.mail || userId,
                userId:           userId,
                status:           userRec.accountStatus,
                requestId:        reqId,
                requestTypeId:    requestTypeId,
                approvalNodeType: nodeType
            });
        }
    }
}

logger.error('Pending request scan complete — {} non-active approver instance(s) found.', part1Rows.length);

// ── Scan published workflow definitions for inactive approvers ────────
logger.error('Fetching published workflow definitions (pageSize={})...', WORKFLOW_PAGE_SIZE);

var allWorkflows  = [];
var wfOffset      = 0;
var wfPaging      = true;
var wfPageNum     = 0;

while (wfPaging) {
    wfPageNum++;
    var wfPage = fetchWorkflowPage(accessToken, wfOffset);

    if (!wfPage || !wfPage.result) {
        logger.error('Failed to retrieve page {} (offset={}). Stopping pagination.', wfPageNum, wfOffset);
        wfPaging = false;
    } else if (wfPage.result.length === 0) {
        wfPaging = false;
    } else {
        for (var wp = 0; wp < wfPage.result.length; wp++) {
            allWorkflows.push(wfPage.result[wp]);
        }
        logger.error('Page {} — fetched {} workflow(s), total so far: {}',
            wfPageNum, wfPage.result.length, allWorkflows.length);
        if (wfPage.result.length < WORKFLOW_PAGE_SIZE) {
            wfPaging = false;
        } else {
            wfOffset += WORKFLOW_PAGE_SIZE;
        }
    }
}

logger.error('Fetched {} published workflow(s) in total.', allWorkflows.length);

var part2Rows        = [];
var userCacheByEmail = {};

for (var w = 0; w < allWorkflows.length; w++) {
    var wf            = allWorkflows[w];
    var wfId          = wf.id          || '(unknown)';
    var wfDisplayName = wf.displayName || wf.name || wfId;
    var steps         = wf.steps       || [];

    for (var s = 0; s < steps.length; s++) {
        var step = steps[s];
        if (step.type !== 'approvalTask' || !step.approvalTask) {
            continue;
        }

        var nodeDisplayName = step.displayName || step.name || '(unknown node)';
        var actors          = step.approvalTask.actors;

        if (!actors) {
            logger.error('Workflow "{}" node "{}" — actors is null/undefined, skipping.',
                wfId, nodeDisplayName);
            continue;
        }

        // ── Case A: Whole actors list is an expression (scripted approvers) ──
        if (!Array.isArray(actors) && actors.isExpression === true) {
            var scriptText = actors.value || '';
            var emails     = extractEmailsFromScript(scriptText);
            logger.error('Workflow "{}" node "{}" — expression actors, found {} email(s): {}',
                wfId, nodeDisplayName, emails.length, emails.join(', '));

            for (var e = 0; e < emails.length; e++) {
                var email = emails[e];
                if (!userCacheByEmail.hasOwnProperty(email)) {
                    userCacheByEmail[email] = getUserByEmail(email);
                }
                var userRecE = userCacheByEmail[email];
                if (!userRecE) {
                    logger.error('USER NOT FOUND — workflow="{}", node="{}", email="{}"',
                        wfId, nodeDisplayName, email);
                    part2Rows.push({
                        email:               email,
                        userId:              '',
                        status:              'User Not Found',
                        approvalNodeName:    nodeDisplayName,
                        workflowId:          wfId,
                        workflowDisplayName: wfDisplayName
                    });
                } else if (userRecE.accountStatus.toLowerCase() !== 'active') {
                    logger.error('NON-ACTIVE — workflow="{}", node="{}", email="{}", accountStatus="{}"',
                        wfId, nodeDisplayName, email, userRecE.accountStatus);
                    part2Rows.push({
                        email:               email,
                        userId:              userRecE._id || '',
                        status:              userRecE.accountStatus,
                        approvalNodeName:    nodeDisplayName,
                        workflowId:          wfId,
                        workflowDisplayName: wfDisplayName
                    });
                }
            }

        // ── Case B: Static actor list ──────────────────────────────────────
        } else if (Array.isArray(actors)) {
            logger.error('Workflow "{}" node "{}" — static actors, count={}.',
                wfId, nodeDisplayName, actors.length);

            for (var a = 0; a < actors.length; a++) {
                var wfActor   = actors[a];
                var actorId   = wfActor.id;

                // Skip actors whose id is itself an expression object
                if (actorId && typeof actorId === 'object') {
                    logger.error('Workflow "{}" node "{}" actor[{}] — id is an expression object, skipping.',
                        wfId, nodeDisplayName, a);
                    continue;
                }

                var wfUserId = extractUserIdFromActorId(actorId);
                if (!wfUserId) {
                    continue;
                }

                if (!userCacheById.hasOwnProperty(wfUserId)) {
                    userCacheById[wfUserId] = getApproverUserRecord(wfUserId);
                }
                var userRecS = userCacheById[wfUserId];
                if (!userRecS) {
                    logger.error('USER NOT FOUND — workflow="{}", node="{}", userId="{}"',
                        wfId, nodeDisplayName, wfUserId);
                    part2Rows.push({
                        email:               'N/A',
                        userId:              wfUserId,
                        status:              'User Not Found',
                        approvalNodeName:    nodeDisplayName,
                        workflowId:          wfId,
                        workflowDisplayName: wfDisplayName
                    });
                } else if (userRecS.accountStatus.toLowerCase() !== 'active') {
                    logger.error('NON-ACTIVE — workflow="{}", node="{}", userId="{}", email="{}", accountStatus="{}"',
                        wfId, nodeDisplayName, wfUserId, userRecS.mail || '', userRecS.accountStatus);
                    part2Rows.push({
                        email:               userRecS.mail || wfUserId,
                        userId:              userRecS._id  || wfUserId,
                        status:              userRecS.accountStatus,
                        approvalNodeName:    nodeDisplayName,
                        workflowId:          wfId,
                        workflowDisplayName: wfDisplayName
                    });
                }
            }

        } else {
            logger.error('Workflow "{}" node "{}" — unrecognised actors format, skipping.',
                wfId, nodeDisplayName);
        }
    }
}

logger.error('Workflow definition scan complete — {} non-active approver instance(s) found.', part2Rows.length);

// ── Summary log ───────────────────────────────────────────────────────
logger.error('Summary — part1 (requests): {} non-active instance(s), part2 (workflows): {} non-active instance(s).',
    part1Rows.length, part2Rows.length);

// ── Build and send combined email ─────────────────────────────────────
var htmlBody;
if (part1Rows.length === 0 && part2Rows.length === 0) {
    logger.error('All approvers active in both scans. Sending all-clear email.');
    htmlBody = buildAllClearEmailBody(allRequests.length, allWorkflows.length);
} else {
    logger.error('Sending combined report — part1={} row(s), part2={} row(s).',
        part1Rows.length, part2Rows.length);
    htmlBody = buildEmailBody(part1Rows, part2Rows, allRequests.length, allWorkflows.length);
}
sendReportEmail(htmlBody, reportRecipients);

logger.error('======================================================================');
logger.error('Approver Status Scheduler: END — {}', getCurrentISODateTime());
logger.error('======================================================================');
