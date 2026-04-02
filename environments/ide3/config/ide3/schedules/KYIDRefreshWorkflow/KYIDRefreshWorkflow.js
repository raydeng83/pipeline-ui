/*
 * AIC Scheduler Script: Workflow Creation Job
 *
 * Scans alpha_kyid_workflow_creation_data for records with recordState=0
 * and triggers workflow creation/update for each active record.
 *
 * Managed object: alpha_kyid_workflow_creation_data
 * Triggered by:   AIC scheduler (run on configured interval)
 */

// ============================================================
// CONFIGURATION — Fetched from Environment Secret Variables
// ============================================================

var governanceRoleId    = "";
var defaultL1ApproverId = "3773b2a8-dd86-4933-98ee-7468c1b4c1e1";
var defaultL2ApproverId = "0dfc4dfa-cfdd-4f3f-afb8-15b2800233c3";

// Service account credentials (TODO: replace with ESV reads before production)
var ssoBaseUrl       = 'https://openam-commkentsb3-use1-sandbox.id.forgerock.io';
var saClientId       = 'f0ad73a3-8c1e-40fb-8ea9-e87fbc9af820';
var saPrivateKeyJson = JSON.stringify({
    "d":   "BXPvQ_yoGMisuVIeBD4jgnfhHdbBdbtqyhny7Y1PWwxV_TxiuqN2jRZYXwng16i4MVnSUYa7ceXWcRuI3OZTAP61ae7OLO6PePI5JluYmhmdQUbM_2dWJgLzkZzQoO-gX2-LJ-ubpeG8ZuQ26e9WmnDmV1ulk4mcGgEqGz1s3av5aftfiJeY_DRmWLm1XliUtmpZ-lHtHHoAhjit1ItABqpJGqnexNOQRHokHZCzrAWunvDXT4g2ief_wrDIr0xFqwjVjb_5T1AiWAgWDBQK6KgT7o9CSVIb733zHExNksGkPYKc7Hve5SPukPbZJ1-63Ub8orOYm3lm26yfHXx2zBwDJAfllvJNM5K6RjyhHpzWa_QKlBFYtcNm1L8De4m8cic2lBxk36Q8n-dhLkL_Anp-N2x8pzKaQ0DyHQ2INqPOqyyLdxXEJzxae7y8r6rrpO2Z6zpMf7wTaRMgj1bPMGXMRdcwuNP7IfO_CRhQ7w7DNs4bdVVNaEag0GmCzRNe26tz8LdNDhalKQu2lAevvvtGthk0bWeFGhGABAorPkmf1EWc0f257IhhVZjrwl44GanKZyL1XT77E7k01H6aYjxBGaNBC-sr86XJOB33in9pYqUwP5msrNcGt0eZck25NbvReoG2jlwrm82jbTmj_AnAv2F1OV28SOQ-5_NW9Zs",
    "dp":  "iIYgVQox0QsaW_Uf9tylOBvhGlguLacQPmrXDc-BSZd8sP2Bu7T1lg3F-GdyWq8wWxdAomSJGPl1sSupuR2op0XUK1T3Lyl3ERdCs-4HcwAkyQHH6ZLFwfm8kPbWiKy50oeMzIh67QdkL14XGVtD1KN6Ty7q3D2NFfVjn5YvoyNvbF4-eQWdCrIe5fmgYuwnobiXvYh0OeRlo9oyDyY47BFeujYKJtaxkaXnDdObVLLdTfHmML_rh7eBUorw3jew0HgtPN_wOxBQthMkNdCKKWRBG4ZMmogCXy7Rguf-F8HngV7NQhgst7jvKqeJGy-AIGtOf2BVljI9W1mqTgCcvw",
    "dq":  "Xpw6SbLSTjqri_3tRdQfZi-Lr-qSXLAEUzrBwZOTYsm3_fRbT_0rHh6C0BQ3atfcM6HCkU7naGI5bdZAkopIflzBJGkfEu0tR1VsLQjMq6Yqfd8kggb-fdL5qVAJDQ6TCVv9nQ6hZb-UXv78_OmdyfjDRqpwuCJt-ZexrU4x2hmsN5-gy_ZyFOVH_2j3eLaIB2xkWU4DKs4b0wVrXspuPwDZY8Ywx6VYtL2J38uGJRpLKBDfQnWyyDTWPrUMM04C-usMDVmZDPUOIr9xoqbFBjvNtemn4OP7cQ0Z0xBjILpVs9n47VbJORshWVqTCG3IkZwDs157umjP5HUVmED7jQ",
    "e":   "AQAB",
    "kty": "RSA",
    "n":   "vr9C4DhO5ysLIsD8SqDLaD5Al-3eCuoj3wiLTqucTMBC5Xlm9qqOUfivF3fjPehXMAgnQ5OjcT8-XrCsxpE86vxvUJSul-kZapumKyT00nWPqjIvcWQHkBpzikQ3t1dJ3SUK7S3r2AQjVuuulNaaPUjefUy3Q1JqHl77V1Goj9zlAdDKxeBgt0pXMfNOGUWgn3iBFRkiAr-St2b3oH9tx-HoN5wsXg45QkJaR9lcz5vKy2MrKWftKNx-5gtBiAWZA2qX48l83L0RCN9I69uDwC-hzb3YCvxG_-p-J67REkVp_LNVnq6uW4bk_7cMiH14c5RQTaUJx5FdZ9h7RDIMyvpSsOxuvdJqo_-pG3HqVqWu2igEmuONcfxOZ0BAiys_7isXcVie8vCUZHKriFFpxkl4mrEMhKs2omPc9Otlz7_K0srl-IcOS89K2jdrTQ3wIfeZSeTGeDcDbWmGmc8lnC1OOotxXHx4Zde6OUR3odfczHlFbKKgd1CzDFZwG-pmIvtCJPm3vc0zKH8nZEfQeY5DBkd5zd8detr20imA9vaQSYE_1iOZNs4zKU5i9kjYZFsjEQM3BWmwBmv8DsZwuho-CDzVn_uou9qLE3BZmR1KwnV_zZ2oStrH49G1anlzxFOzKyhued75PbPmOEzNgCzRI3mPf0EWCmN-K_1VJO0",
    "p":   "6gKJXxJwMm-pmIZ4ekNDTQZjjJsmb_gqZ8lZKt_nGa6jkpx9lnUxMroesWzW4lsy5NWAkfEJ-sgCsh7-EfrUX0CkBOidxakKjI2Da1blWjRzW084SMHXf2QDa1t59EBR1wvoHHpBSmUmPiKve9I2Du0a6dOEDGcXgR_qEoFBw8Zo3NOfICHJHOYKAO1vnCJugCpg5a55ibIhApp5_IidOWN3TZyn0f6fm6wLPxvhf2U3BZXZ-WmVC2-gZyNlE0sVNJzYZ04YpVqpURnQFJmljr4nWrL4SSUh2nktvBQDPSmslVm3YyYfX8agRcjXZaJThLFr-1vjTpHdIJ7Mz6iMmw",
    "q":   "0Kv487B_GrvMS7Di7eb9wzwQ4bXSvsRWhvqvI1oksBNA8MnALfntUMaCJnxMtDq2_PeO_dMIjsFP71FVYtgRTjAASSXIcqgkJ6eIO1E5XZsLj_GvMm4_fF5IgqAG3gjbhYOeRnExpUUzUZU8q1UXp47w_KeeAztpx-kTmaWrDdUUmiWIWEjniys0pX6EYexlyGHV1VJ0PzbMv2l06eiBhSK5Rbrfz6sWx7EAX5Mm06JVuhyQJfNlzK7Yn5Y6I-TUSwp8GcHZ-eJJOtKiXjASTtJJLWXm5jQ_PxZN63IAY4EHaTEqpABmsgh23PgGgTRfl40UuTeHC-lGZjjqCsY5Fw",
    "qi":  "kf6mNByQvrD8tAfGLDy6n4oSVcCxliQuySJtYYYHQDzX-KLyp269Ydx7B_wrWeuXxUAzUYwunBQZLU2-Ju1EF62mLrvci9qxx1VrmEvvITyNBNvM8YZzuDgquvcJlDqSkrxqa_eeeeumUJ8WDO6kQWcP816oQLOaNKU-5vcGRZ0fp-dogJAD4E0ynBOhzdmb_iFLR4UAxjcKgWh-MPxvH_7Un_YyPYsC--6BsWFKjV_8XlodBUHNjOvz2Sis7c5EG69m4x5NfIUMd4SbWjSF76REVTGlPKD5OQJ5yOosovCSbTLOZU2BV8L49p7q-8sxOFlFJBvHqKDJvkuwyaHblA"
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Returns true if a value is absent or represents an empty/null string.
 * Handles the legacy "null" / "NULL" string values present in migrated data.
 */
function isNullOrEmpty(val) {
    return val === null || val === undefined || val === '' || val === 'null' || val === 'NULL';
}

/** Returns the current timestamp as an ISO 8601 string. */
function getCurrentISODateTime() {
    return new Date().toISOString();
}

/** Strips all non-alphanumeric, non-space characters from a string. */
function removeSpecialCharacters(text) {
    if (isNullOrEmpty(text)) { return ''; }
    return text.replace(/[^A-Za-z0-9 ]+/g, '');
}

/**
 * Queries alpha_kyid_enrollment_prerequisite_type by prerequisiteTypeIdentifier.
 * Returns { moId, onSubmitServiceEndpointName } — either field may be null if not found.
 */
function getPrerequisiteTypeInfo(identifier) {
    logger.error('[getPrerequisiteTypeInfo] Querying alpha_kyid_enrollment_prerequisite_type for identifier: "{}"', identifier);
    if (isNullOrEmpty(identifier)) {
        logger.error('[getPrerequisiteTypeInfo] identifier is null or empty — skipping query, returning nulls.');
        return { moId: null, onSubmitServiceEndpointName: null };
    }
    try {
        var queryFilter = 'stgPrerequisiteTypeIdentifier eq "' + identifier + '"';
        logger.error('[getPrerequisiteTypeInfo] queryFilter: {}', queryFilter);
        var result = openidm.query(
            'managed/alpha_kyid_enrollment_prerequisite_type',
            { '_queryFilter': queryFilter },
            null
        );
        var resultCount = (result && result.result) ? result.result.length : 0;
        logger.error('[getPrerequisiteTypeInfo] Query returned {} result(s).', resultCount);
        if (resultCount > 0) {
            var mo = result.result[0];
            logger.error('[getPrerequisiteTypeInfo] MO _id: {}', mo._id);
            var endpointName = null;
            try {
                var pages = (mo.body && mo.body.pages) ? mo.body.pages : [];
                logger.error('[getPrerequisiteTypeInfo] body.pages count: {}', pages.length);
                if (pages.length > 0 && pages[0].onSubmitServiceEndpoint) {
                    endpointName = pages[0].onSubmitServiceEndpoint.endpointName || null;
                    logger.error('[getPrerequisiteTypeInfo] Extracted endpointName: {}', endpointName);
                } else {
                    logger.error('[getPrerequisiteTypeInfo] No onSubmitServiceEndpoint found in pages[0].');
                }
            } catch (inner) {
                logger.error('[getPrerequisiteTypeInfo] Error extracting endpointName: {}', inner.message);
            }
            logger.error('[getPrerequisiteTypeInfo] Returning moId={}, onSubmitServiceEndpointName={}', mo._id, endpointName);
            return { moId: mo._id, onSubmitServiceEndpointName: endpointName };
        } else {
            logger.error('[getPrerequisiteTypeInfo] No MO found for identifier "{}".', identifier);
        }
    } catch (e) {
        logger.error('[getPrerequisiteTypeInfo] Exception querying alpha_kyid_enrollment_prerequisite_type for "{}": {}', identifier, e.message);
    }
    return { moId: null, onSubmitServiceEndpointName: null };
}

/**
 * Resolves a ForgeRock user _id by querying alpha_user by email address.
 * Returns the user _id string, or null if not found.
 */
function getAlphaUserIdByEmail(email) {
    logger.error('[getAlphaUserIdByEmail] Querying alpha_user for email: {}', email);
    if (isNullOrEmpty(email)) {
        logger.error('[getAlphaUserIdByEmail] Email is null or empty — skipping query.');
        return null;
    }
    try {
        var result = openidm.query(
            'managed/alpha_user',
            { '_queryFilter': 'mail eq "' + email + '"' },
            null
        );
        var resultCount = (result && result.result) ? result.result.length : 0;
        logger.error('[getAlphaUserIdByEmail] Query returned {} result(s) for email: {}', resultCount, email);
        if (resultCount > 0) {
            var userId = result.result[0]._id;
            logger.error('[getAlphaUserIdByEmail] Resolved user _id: {} for email: {}', userId, email);
            return userId;
        } else {
            logger.error('[getAlphaUserIdByEmail] No alpha_user found for email: {}', email);
        }
    } catch (e) {
        logger.error('[getAlphaUserIdByEmail] Exception querying alpha_user for email "{}": {}', email, e.message);
    }
    return null;
}

/**
 * Looks up an alpha_kyid_enrollment_service_endpoint _id by its name field.
 * Returns the _id string, or null if not found.
 */
function getServiceEndpointIdByName(name) {
    logger.error('[getServiceEndpointIdByName] Querying alpha_kyid_enrollment_service_endpoint for name: "{}"', name);
    if (isNullOrEmpty(name)) {
        logger.error('[getServiceEndpointIdByName] Name is null or empty — skipping query.');
        return null;
    }
    try {
        var result = openidm.query(
            'managed/alpha_kyid_enrollment_service_endpoint',
            { '_queryFilter': 'name eq "' + name + '"' },
            null
        );
        var resultCount = (result && result.result) ? result.result.length : 0;
        logger.error('[getServiceEndpointIdByName] Query returned {} result(s) for name: "{}"', resultCount, name);
        if (resultCount > 0) {
            var endpointId = result.result[0]._id;
            logger.error('[getServiceEndpointIdByName] Found service endpoint _id: {} for name: "{}"', endpointId, name);
            return endpointId;
        } else {
            logger.error('[getServiceEndpointIdByName] No service endpoint found for name: "{}"', name);
        }
    } catch (e) {
        logger.error('[getServiceEndpointIdByName] Exception querying service endpoint for name "{}": {}', name, e.message);
    }
    return null;
}

/**
 * PATCHes a service endpoint's url field with the provided workflow URL.
 * Returns true on success, false on failure.
 */
function patchServiceEndpointUrl(endpointId, workflowUrl) {
    logger.error('[patchServiceEndpointUrl] Patching service endpoint id={} with workflowUrl={}', endpointId, workflowUrl);
    if (isNullOrEmpty(endpointId)) {
        logger.error('[patchServiceEndpointUrl] endpointId is null or empty — cannot patch.');
        return false;
    }
    if (isNullOrEmpty(workflowUrl)) {
        logger.error('[patchServiceEndpointUrl] workflowUrl is null or empty — cannot patch.');
        return false;
    }
    try {
        openidm.patch(
            'managed/alpha_kyid_enrollment_service_endpoint/' + endpointId,
            null,
            [{ operation: 'replace', field: '/url', value: workflowUrl }],
            null,
            null
        );
        logger.error('[patchServiceEndpointUrl] Successfully patched service endpoint {} with URL: {}', endpointId, workflowUrl);
        return true;
    } catch (e) {
        logger.error('[patchServiceEndpointUrl] Exception patching service endpoint {}: {}', endpointId, e.message);
        return false;
    }
}

/**
 * Checks whether a user already holds the specified governance role.
 * Returns true if the role is present in effectiveRoles, false otherwise.
 */
function userHasRole(userId, roleId) {
    logger.error('[userHasRole] Checking if user {} has role {}', userId, roleId);
    if (isNullOrEmpty(userId) || isNullOrEmpty(roleId)) {
        logger.error('[userHasRole] userId or roleId is null/empty — returning false.');
        return false;
    }
    try {
        var user = openidm.read('managed/alpha_user/' + userId, null, ['effectiveRoles']);
        if (user && user.effectiveRoles) {
            logger.error('[userHasRole] User {} has {} effectiveRole(s).', userId, user.effectiveRoles.length);
            for (var i = 0; i < user.effectiveRoles.length; i++) {
                if (user.effectiveRoles[i]._refResourceId === roleId) {
                    logger.error('[userHasRole] User {} already has role {}.', userId, roleId);
                    return true;
                }
            }
            logger.error('[userHasRole] User {} does NOT have role {}.', userId, roleId);
        } else {
            logger.error('[userHasRole] User {} not found or has no effectiveRoles.', userId);
        }
    } catch (e) {
        logger.error('[userHasRole] Exception checking effectiveRoles for user {}: {}', userId, e.message);
    }
    return false;
}

/**
 * Assigns a governance role to a user by PATCHing /roles/-.
 * Returns { success: true } or { success: false, error: '...' }.
 */
function assignRoleToUser(userId, roleId) {
    logger.error('[assignRoleToUser] Assigning role {} to user {}', roleId, userId);
    if (isNullOrEmpty(userId) || isNullOrEmpty(roleId)) {
        logger.error('[assignRoleToUser] userId or roleId is null/empty — skipping assignment.');
        return { success: false, error: 'userId or roleId is null/empty' };
    }
    try {
        openidm.patch(
            'managed/alpha_user/' + userId,
            null,
            [{ operation: 'add', field: '/roles/-', value: { _ref: 'managed/alpha_role/' + roleId } }],
            null,
            null
        );
        logger.error('[assignRoleToUser] Successfully assigned role {} to user {}.', roleId, userId);
        return { success: true };
    } catch (e) {
        logger.error('[assignRoleToUser] Exception assigning role {} to user {}: {}', roleId, userId, e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Returns a deduplicated flat list of approver IDs from multiple approver group arrays.
 * Accepts any number of group arrays as arguments.
 */
function getAllDistinctApproverIds() {
    var groups = Array.prototype.slice.call(arguments);
    var seen = {};
    var ids = [];
    for (var g = 0; g < groups.length; g++) {
        for (var i = 0; i < groups[g].length; i++) {
            var id = groups[g][i].id;
            if (id && !seen[id]) {
                seen[id] = true;
                ids.push(id);
            }
        }
    }
    logger.error('[getAllDistinctApproverIds] Distinct approver IDs across all groups: {}', JSON.stringify(ids));
    return ids;
}

/**
 * Filters an approverList array into a single approver group, resolving missing
 * ForgeRock IDs via email lookup where needed.
 *
 * @param {Array}  approverList    The mutable approver list for the current record.
 * @param {number} sequence        approverSequence value to match (1 or 2).
 * @param {string} primaryOrBackup 'primary' or 'backup'.
 * @param {Object} state           Shared state object; sets state.approverListNeedsWriteBack=true
 *                                 when an ID is resolved and written back.
 * @returns {{ group: Array, rawCount: number }}
 *   group    — approvers eligible for the workflow payload (approverType='user' with resolved IDs)
 *   rawCount — total entries matching sequence+primaryOrBackup (all types), used for default fallback
 */
function buildApproverGroup(approverList, sequence, primaryOrBackup, state) {
    logger.error('[buildApproverGroup] Building group: sequence={}, primaryOrBackup={}, approverList.length={}',
        sequence, primaryOrBackup, approverList.length);

    var group = [];
    var rawCount = 0;

    for (var i = 0; i < approverList.length; i++) {
        var a = approverList[i];
        logger.error('[buildApproverGroup]   Entry[{}]: approverListID={}, sequence={}, primaryOrBackup={}, type={}, forgeRockID={}, email={}, isDelete={}',
            i,
            a.approverListID,
            a.approverSequence,
            a.primaryOrBackup,
            a.approverType,
            a.approverForgeRockID,
            a.approverEmailAddress,
            a.isDelete
        );

        if (a.isDelete == 1) {
            logger.error('[buildApproverGroup]   Entry[{}] SKIPPED: isDelete=1', i);
            continue;
        }

        if (a.approverSequence != sequence) {
            logger.error('[buildApproverGroup]   Entry[{}] SKIPPED: approverSequence={} does not match expected={}', i, a.approverSequence, sequence);
            continue;
        }

        if ((a.primaryOrBackup || '').toLowerCase() !== primaryOrBackup) {
            logger.error('[buildApproverGroup]   Entry[{}] SKIPPED: primaryOrBackup="{}" does not match expected="{}"', i, a.primaryOrBackup, primaryOrBackup);
            continue;
        }

        rawCount++;
        logger.error('[buildApproverGroup]   Entry[{}] matched filter (rawCount now {})', i, rawCount);

        if ((a.approverType || '').toLowerCase() !== 'user') {
            logger.error('[buildApproverGroup]   Entry[{}] SKIPPED from payload group: approverType="{}" is not "user"', i, a.approverType);
            continue;
        }

        var approverId = isNullOrEmpty(a.approverForgeRockID) ? null : a.approverForgeRockID;
        logger.error('[buildApproverGroup]   Entry[{}] approverForgeRockID resolved to: {}', i, approverId);

        if (!approverId && !isNullOrEmpty(a.approverEmailAddress)) {
            logger.error('[buildApproverGroup]   Entry[{}] No ForgeRock ID — attempting email lookup for: {}', i, a.approverEmailAddress);
            approverId = getAlphaUserIdByEmail(a.approverEmailAddress);
            if (approverId) {
                approverList[i].approverForgeRockID = approverId;
                state.approverListNeedsWriteBack = true;
                logger.error('[buildApproverGroup]   Entry[{}] Resolved and wrote back approverForgeRockID={} for email={}', i, approverId, a.approverEmailAddress);
            } else {
                logger.error('[buildApproverGroup]   Entry[{}] Could not resolve ForgeRock ID for email: {}', i, a.approverEmailAddress);
            }
        } else if (!approverId) {
            logger.error('[buildApproverGroup]   Entry[{}] No ForgeRock ID and no email — cannot resolve approver. Skipping.', i);
        }

        if (approverId) {
            group.push({ id: approverId, type: a.approverType });
            logger.error('[buildApproverGroup]   Entry[{}] ADDED to group: id={}, type={}', i, approverId, a.approverType);
        } else {
            logger.error('[buildApproverGroup]   Entry[{}] NOT added to group: no valid approver ID.', i);
        }
    }

    logger.error('[buildApproverGroup] Result for sequence={} {}: group.length={}, rawCount={}',
        sequence, primaryOrBackup, group.length, rawCount);
    return { group: group, rawCount: rawCount };
}

/**
 * Obtains an OAuth2 access token from AM using the JWT bearer grant (service account).
 * Reads the SSO base URL, client ID, and RSA private key JWK from ESVs.
 * Signs a short-lived JWT assertion with RS256, then exchanges it for an access token.
 * Returns the access_token string, or null on failure.
 */
function getAccessToken() {
    logger.error('[getAccessToken] Fetching service account access token from AM...');

    if (isNullOrEmpty(ssoBaseUrl) || isNullOrEmpty(saClientId) || isNullOrEmpty(saPrivateKeyJson)) {
        logger.error('[getAccessToken] ERROR — Missing ESV value(s): ssoBaseUrl={}, saClientId={}, saPrivateKeyJson={}',
            ssoBaseUrl,
            isNullOrEmpty(saClientId)         ? '(empty)' : '(set)',
            isNullOrEmpty(saPrivateKeyJson)   ? '(empty)' : '(set)');
        return null;
    }

    var tokenUrl = ssoBaseUrl + '/am/oauth2/access_token';
    logger.error('[getAccessToken] Token URL: {}', tokenUrl);

    try {
        // --- Parse JWK and reconstruct RSA private key ---
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

        // --- Build JWT header and payload ---
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

        var headerB64  = b64urlEncode(strToUtf8Bytes(JSON.stringify(jwtHeader)));
        var payloadB64 = b64urlEncode(strToUtf8Bytes(JSON.stringify(jwtPayload)));
        var signingInput = headerB64 + '.' + payloadB64;

        // --- Sign with RS256 ---
        var sig = java.security.Signature.getInstance('SHA256withRSA');
        sig.initSign(privateKey);
        sig.update(strToUtf8Bytes(signingInput));
        var assertion = signingInput + '.' + b64urlEncode(sig.sign());
        logger.error('[getAccessToken] JWT assertion signed successfully.');

        // --- Exchange JWT assertion for access token ---
        // client_id must be the literal string "service-account" (not the UUID — that goes in the JWT).
        var formBody = 'client_id=service-account'
            + '&grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')
            + '&assertion='  + encodeURIComponent(assertion)
            + '&scope=' + encodeURIComponent('fr:am:* fr:idm:* fr:idc:esv:*');

        logger.error('[getAccessToken] Sending token request to: {}', tokenUrl);
        logger.error('[getAccessToken] Form body (assertion omitted): client_id=service-account&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JWT>&scope=fr:am:* fr:idm:* fr:idc:esv:*');

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
            try {
                var jEx = httpErr.javaException;
                if (jEx) {
                    logger.error('[getAccessToken] Java exception class: {}', jEx.getClass().getName());
                    logger.error('[getAccessToken] Java exception detail: {}', jEx.getDetail());
                    var cause1 = jEx.getCause();
                    if (cause1) {
                        logger.error('[getAccessToken] Caused by: {} — {}', cause1.getClass().getName(), cause1.getMessage());
                        var cause2 = cause1.getCause();
                        if (cause2) {
                            logger.error('[getAccessToken] Caused by (2): {} — {}', cause2.getClass().getName(), cause2.getMessage());
                        }
                    }
                }
            } catch (logErr) { /* best-effort */ }
            return null;
        }

        logger.error('[getAccessToken] Raw token response: {}', JSON.stringify(result));

        var tokenData = (typeof result === 'string') ? JSON.parse(result) : result;
        if (tokenData && tokenData.access_token) {
            logger.error('[getAccessToken] Access token retrieved successfully.');
            return tokenData.access_token;
        } else {
            logger.error('[getAccessToken] ERROR — access_token not found in response.');
            return null;
        }
    } catch (e) {
        logger.error('[getAccessToken] Unexpected exception: {}', e.message || String(e));
        return null;
    }
}

// ============================================================
// MAIN SCRIPT
// ============================================================

logger.error('Workflow Creation Scheduler: Starting run at {}', getCurrentISODateTime());
logger.error('Workflow Creation Scheduler: Config — governanceRoleId={}, defaultL1ApproverId={}, defaultL2ApproverId={}',
    governanceRoleId, defaultL1ApproverId, defaultL2ApproverId);

// Step 0: Obtain access token via service account JWT bearer grant
var accessToken = getAccessToken();
if (!accessToken) {
    logger.error('Step 0: ERROR — Failed to retrieve access token. Aborting scheduler run.');
    throw { code: 500, message: 'Workflow Creation Scheduler: Unable to obtain access token — aborting.' };
}
logger.error('Step 0: Access token retrieved successfully.');

// Step A: Query all active records (recordState = 0)
logger.error('Step A: Querying managed/alpha_kyid_workflow_creation_data for recordState=0 (pageSize=500)...');
var queryResult = openidm.query(
    'managed/alpha_kyid_workflow_creation_data',
    { '_queryFilter': 'recordState eq 0', '_pageSize': 500 },
    null
);

var records = (queryResult && queryResult.result) ? queryResult.result : [];
logger.error('Step A: Query complete. Total records returned: {}', records.length);

if (records.length === 0) {
    logger.error('Workflow Creation Scheduler: No active records (recordState=0) found. Exiting.');
} else {
    if (records.length >= 500) {
        logger.error('Workflow Creation Scheduler: Result set hit page limit of 500. Additional records will be deferred to the next run.');
    }
    logger.error('Workflow Creation Scheduler: Found {} active record(s) to process.', records.length);

    for (var recIdx = 0; recIdx < records.length; recIdx++) {
        var record       = records[recIdx];
        var recordId     = record._id;
        var prereq       = record.prerequisitesForWorkflowCreation || {};
        var approverList = record.approverList || [];

        logger.error('------------------------------------------------------------');
        logger.error('Processing record {}/{}: MO _id={}', recIdx + 1, records.length, recordId);

        // Step B: Extract prerequisite fields
        var prereqRecordID       = prereq.prerequisiteRecordID;
        var prereqName           = prereq.prerequisiteName || '';
        var prereqTypeIdentifier = prereq.prerequisiteTypeIdentifier;
        var workflowType         = prereq.workflowType;
        var createWorkflow       = prereq.createWorkflow || 0;
        var forgeRockPrereqId    = isNullOrEmpty(prereq.forgeRockPrerequisiteID)     ? null : prereq.forgeRockPrerequisiteID;
        var onSubmitEndpointName = isNullOrEmpty(prereq.onSubmitServiceEndpointName) ? null : prereq.onSubmitServiceEndpointName;

        logger.error('Step B: Extracted fields:');
        logger.error('  prerequisiteRecordID    = {}', prereqRecordID);
        logger.error('  prerequisiteName        = "{}"', prereqName);
        logger.error('  prerequisiteTypeIdentifier = "{}"', prereqTypeIdentifier);
        logger.error('  workflowType            = "{}"', workflowType);
        logger.error('  createWorkflow          = {}', createWorkflow);
        logger.error('  forgeRockPrerequisiteID = {} (raw="{}")', forgeRockPrereqId, prereq.forgeRockPrerequisiteID);
        logger.error('  onSubmitServiceEndpointName = {} (raw="{}")', onSubmitEndpointName, prereq.onSubmitServiceEndpointName);
        logger.error('  approverList.length     = {}', approverList.length);

        var cleanName = removeSpecialCharacters(prereqName);
        logger.error('Step B: Clean name (special chars removed): "{}"', cleanName);

        // Step C: Resolve missing prerequisite type data from alpha_kyid_enrollment_prerequisite_type
        var needsEndpointNameLookup   = isNullOrEmpty(onSubmitEndpointName);
        var needsForgeRockIdLookup    = (workflowType === 'credential' && isNullOrEmpty(forgeRockPrereqId));
        var needsPrereqTypeLookup     = needsEndpointNameLookup || needsForgeRockIdLookup;

        logger.error('Step C: MO lookup needed? {} (needsEndpointNameLookup={}, needsForgeRockIdLookup={})',
            needsPrereqTypeLookup, needsEndpointNameLookup, needsForgeRockIdLookup);

        if (needsPrereqTypeLookup) {
            var prereqTypeInfo = getPrerequisiteTypeInfo(prereqTypeIdentifier);
            logger.error('Step C: MO lookup result — moId={}, onSubmitServiceEndpointName={}',
                prereqTypeInfo.moId, prereqTypeInfo.onSubmitServiceEndpointName);

            if (needsEndpointNameLookup) {
                if (!prereqTypeInfo.onSubmitServiceEndpointName) {
                    logger.error('Step C: ERROR — onSubmitServiceEndpointName not found for identifier "{}". Skipping record.', prereqTypeIdentifier);
                    continue;
                }
                onSubmitEndpointName = prereqTypeInfo.onSubmitServiceEndpointName;
                logger.error('Step C: Resolved onSubmitEndpointName from MO lookup: {}', onSubmitEndpointName);
            }

            if (needsForgeRockIdLookup) {
                if (!prereqTypeInfo.moId) {
                    logger.error('Step C: ERROR — forgeRockPrerequisiteID (moId) not found for identifier "{}". Skipping record.', prereqTypeIdentifier);
                    continue;
                }
                forgeRockPrereqId = prereqTypeInfo.moId;
                logger.error('Step C: Resolved forgeRockPrereqId from MO lookup: {}', forgeRockPrereqId);
            }
        } else {
            logger.error('Step C: Skipping MO lookup — onSubmitEndpointName and forgeRockPrereqId already resolved.');
        }

        logger.error('Step C: Final values — onSubmitEndpointName="{}", forgeRockPrereqId="{}"',
            onSubmitEndpointName, forgeRockPrereqId);

        // Step D & E: Build approver groups from approverList, resolving missing ForgeRock IDs
        // NOTE: JSON.parse(JSON.stringify()) does not produce a proper JS array in Rhino —
        // the resulting object has no .length, causing the for loop in buildApproverGroup to
        // never execute. Pass the original array directly so mutations (ForgeRock ID write-back)
        // happen in-place on the same reference used for the patch operation.
        logger.error('Step D: Building approver groups from approverList (length={})...', approverList.length);
        var updatedApproverList = approverList;
        var state = { approverListNeedsWriteBack: false };

        var l1PrimaryResult = buildApproverGroup(updatedApproverList, 1, 'primary', state);
        var l1BackupResult  = buildApproverGroup(updatedApproverList, 1, 'backup',  state);
        var l2PrimaryResult = buildApproverGroup(updatedApproverList, 2, 'primary', state);
        var l2BackupResult  = buildApproverGroup(updatedApproverList, 2, 'backup',  state);

        var levelOneApprovers       = l1PrimaryResult.group;
        var levelOneBackupApprovers = l1BackupResult.group;
        var levelTwoApprovers       = l2PrimaryResult.group;
        var levelTwoBackupApprovers = l2BackupResult.group;

        logger.error('Step D: approverListNeedsWriteBack={}', state.approverListNeedsWriteBack);

        // Step F: Default approver fallback
        logger.error('Step F: Applying default approver fallback where needed...');
        if (l1PrimaryResult.rawCount > 0 && levelOneApprovers.length === 0) {
            levelOneApprovers.push({ id: defaultL1ApproverId, type: 'user' });
            logger.error('Step F: L1 Primary — rawCount={}, no valid approvers resolved. Added default: {}', l1PrimaryResult.rawCount, defaultL1ApproverId);
        } else {
            logger.error('Step F: L1 Primary — rawCount={}, resolved={}, no default needed.', l1PrimaryResult.rawCount, levelOneApprovers.length);
        }

        if (l1BackupResult.rawCount > 0 && levelOneBackupApprovers.length === 0) {
            levelOneBackupApprovers.push({ id: defaultL1ApproverId, type: 'user' });
            logger.error('Step F: L1 Backup — rawCount={}, no valid approvers resolved. Added default: {}', l1BackupResult.rawCount, defaultL1ApproverId);
        } else {
            logger.error('Step F: L1 Backup — rawCount={}, resolved={}, no default needed.', l1BackupResult.rawCount, levelOneBackupApprovers.length);
        }

        if (l2PrimaryResult.rawCount > 0 && levelTwoApprovers.length === 0) {
            levelTwoApprovers.push({ id: defaultL2ApproverId, type: 'user' });
            logger.error('Step F: L2 Primary — rawCount={}, no valid approvers resolved. Added default: {}', l2PrimaryResult.rawCount, defaultL2ApproverId);
        } else {
            logger.error('Step F: L2 Primary — rawCount={}, resolved={}, no default needed.', l2PrimaryResult.rawCount, levelTwoApprovers.length);
        }

        if (l2BackupResult.rawCount > 0 && levelTwoBackupApprovers.length === 0) {
            levelTwoBackupApprovers.push({ id: defaultL2ApproverId, type: 'user' });
            logger.error('Step F: L2 Backup — rawCount={}, no valid approvers resolved. Added default: {}', l2BackupResult.rawCount, defaultL2ApproverId);
        } else {
            logger.error('Step F: L2 Backup — rawCount={}, resolved={}, no default needed.', l2BackupResult.rawCount, levelTwoBackupApprovers.length);
        }

        logger.error('Step F: Final approver groups:');
        logger.error('  L1 Primary : {}', JSON.stringify(levelOneApprovers));
        logger.error('  L1 Backup  : {}', JSON.stringify(levelOneBackupApprovers));
        logger.error('  L2 Primary : {}', JSON.stringify(levelTwoApprovers));
        logger.error('  L2 Backup  : {}', JSON.stringify(levelTwoBackupApprovers));

        // Step G: Build workflow endpoint payload
        logger.error('Step G: Building workflow payload...');
        var payloadData = {
            accessToken:       accessToken,
            levelOneApprovers: levelOneApprovers,
            publishWorkflow:   true,
            verbose:           true,
            name:              cleanName
        };
        logger.error('Step G: Base payloadData — name="{}", levelOneApprovers={}', cleanName, JSON.stringify(levelOneApprovers));

        if (workflowType === 'credential' && forgeRockPrereqId) {
            payloadData.prerequisiteTypeId = forgeRockPrereqId;
            logger.error('Step G: Added prerequisiteTypeId={} (workflowType=credential)', forgeRockPrereqId);
        } else {
            logger.error('Step G: prerequisiteTypeId NOT added — workflowType="{}", forgeRockPrereqId={}', workflowType, forgeRockPrereqId);
        }

        if (levelOneBackupApprovers.length > 0) {
            payloadData.levelOneBackupApprovers = levelOneBackupApprovers;
            logger.error('Step G: Added levelOneBackupApprovers (count={})', levelOneBackupApprovers.length);
        } else {
            logger.error('Step G: levelOneBackupApprovers NOT added — empty.');
        }

        if (levelTwoApprovers.length > 0) {
            payloadData.levelTwoApprovers = levelTwoApprovers;
            logger.error('Step G: Added levelTwoApprovers (count={})', levelTwoApprovers.length);
        } else {
            logger.error('Step G: levelTwoApprovers NOT added — empty.');
        }

        if (levelTwoBackupApprovers.length > 0) {
            payloadData.levelTwoBackupApprovers = levelTwoBackupApprovers;
            logger.error('Step G: Added levelTwoBackupApprovers (count={})', levelTwoBackupApprovers.length);
        } else {
            logger.error('Step G: levelTwoBackupApprovers NOT added — empty.');
        }

        var workflowPayload = {
            payload: payloadData,
            action:  1
        };
        logger.error('Step G: Final workflowPayload: {}', JSON.stringify(workflowPayload));

        // Step H: Call the workflow endpoint natively via openidm.create()
        logger.error('Step H: Calling openidm.create("endpoint/workflow") ...');
        var workflowResponse  = null;
        var responseError     = null;
        var callSuccess       = false;

        try {
            workflowResponse = openidm.create('endpoint/workflow', null, workflowPayload);
            callSuccess = true;
            logger.error('Step H: endpoint/workflow call succeeded. Response: {}', JSON.stringify(workflowResponse));
        } catch (e) {
            responseError = e.message || String(e);
            logger.error('Step H: Exception calling endpoint/workflow: {}', responseError);
        }

        var now = getCurrentISODateTime();
        logger.error('Step H: callSuccess={}, timestamp={}', callSuccess, now);

        if (callSuccess) {
            // Step I: Handle success — update managed object and patch service endpoint

            var workflowUrl = (workflowResponse && workflowResponse['Workflow invoke URL'])
                ? workflowResponse['Workflow invoke URL']
                : null;
            logger.error('Step I: Workflow invoke URL from response: {}', workflowUrl);

            if (!workflowUrl) {
                logger.error('Step I: WARNING — "Workflow invoke URL" key not present in response. Full response: {}', JSON.stringify(workflowResponse));
            }

            var successPatchOps = [
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/isWorkflowCreated',        value: 1 },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/createWorkflow',           value: createWorkflow + 1 },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/workflowURL',              value: workflowUrl },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/statusCode',               value: 201 },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/workflowCreationDateTime', value: now },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/updateDate',               value: now },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/errorMessage',             value: '' }
            ];

            if (state.approverListNeedsWriteBack) {
                successPatchOps.push({ operation: 'replace', field: '/approverList', value: updatedApproverList });
                logger.error('Step I: approverList write-back included in patch (resolved IDs updated).');
            }

            logger.error('Step I: Patching MO {} with success ops (count={})...', recordId, successPatchOps.length);
            logger.error('Step I: Success patch payload: {}', JSON.stringify(successPatchOps));
            try {
                openidm.patch(
                    'managed/alpha_kyid_workflow_creation_data/' + recordId,
                    null, successPatchOps, null, null
                );
                logger.error('Step I: Successfully patched MO {} — isWorkflowCreated=1, statusCode=201, workflowURL={}.', recordId, workflowUrl);
            } catch (e) {
                logger.error('Step I: Exception patching MO {} after success: {}', recordId, e.message);
            }

            // Patch the service endpoint with the workflow URL
            if (workflowUrl && !isNullOrEmpty(onSubmitEndpointName)) {
                logger.error('Step I: Looking up service endpoint for name: "{}"', onSubmitEndpointName);
                var serviceEndpointId = getServiceEndpointIdByName(onSubmitEndpointName);
                if (serviceEndpointId) {
                    logger.error('Step I: Found service endpoint id={}. Patching URL...', serviceEndpointId);
                    patchServiceEndpointUrl(serviceEndpointId, workflowUrl);
                } else {
                    logger.error('Step I: Service endpoint not found for name: "{}". URL patch skipped.', onSubmitEndpointName);
                }
            } else {
                logger.error('Step I: Service endpoint patch skipped — workflowUrl={}, onSubmitEndpointName={}', workflowUrl, onSubmitEndpointName);
            }

            // Assign governance role to all distinct approvers across all groups
            var allApproverIds = getAllDistinctApproverIds(
                levelOneApprovers,
                levelOneBackupApprovers,
                levelTwoApprovers,
                levelTwoBackupApprovers
            );
            logger.error('Step I: Processing governance role assignment for {} distinct approver(s)...', allApproverIds.length);

            for (var ai = 0; ai < allApproverIds.length; ai++) {
                var appId = allApproverIds[ai];
                logger.error('Step I: Checking governance role for approver {} ({}/{})...', appId, ai + 1, allApproverIds.length);
                try {
                    if (userHasRole(appId, governanceRoleId)) {
                        logger.error('Step I: Approver {} already has governance role {}. No action needed.', appId, governanceRoleId);
                    } else {
                        var assignResult = assignRoleToUser(appId, governanceRoleId);
                        if (assignResult.success) {
                            logger.error('Step I: Successfully assigned governance role {} to approver {}.', governanceRoleId, appId);
                        } else {
                            logger.error('Step I: Failed to assign governance role {} to approver {}: {}', governanceRoleId, appId, assignResult.error);
                        }
                    }
                } catch (e) {
                    logger.error('Step I: Exception processing governance role for approver {}: {}', appId, e.message);
                }
            }

        } else {
            // Step J: Handle error — record status and error message only
            // createWorkflow is NOT incremented; workflowCreationDateTime is NOT set.
            logger.error('Step J: Recording error for MO {} — statusCode=500, errorMessage={}', recordId, responseError);

            var errorPatchOps = [
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/statusCode',   value: 500 },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/errorMessage', value: responseError },
                { operation: 'replace', field: '/prerequisitesForWorkflowCreation/updateDate',   value: now }
            ];

            if (state.approverListNeedsWriteBack) {
                errorPatchOps.push({ operation: 'replace', field: '/approverList', value: updatedApproverList });
                logger.error('Step J: approverList write-back included in error patch.');
            }

            logger.error('Step J: Patching MO {} with error ops (count={})...', recordId, errorPatchOps.length);
            try {
                openidm.patch(
                    'managed/alpha_kyid_workflow_creation_data/' + recordId,
                    null, errorPatchOps, null, null
                );
                logger.error('Step J: Successfully patched MO {} with error details.', recordId);
            } catch (e) {
                logger.error('Step J: Exception patching MO {} after error: {}', recordId, e.message);
            }
        }

        logger.error('Record {}/{} complete.', recIdx + 1, records.length);
    }

    logger.error('------------------------------------------------------------');
    logger.error('Workflow Creation Scheduler: Run complete at {}. Processed {} record(s).', getCurrentISODateTime(), records.length);
}
