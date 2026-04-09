var content = execution.getVariables();
var requestId = content.get('id');
var currentLevel = parseInt(content.get('currentLevel'), 10);

logger.error('aaronPOC-v7-Router: checking from level=' + currentLevel);

function resolveApproverEmail(approver, requesteeId, orgId) {
    if (!approver) return '';

    if (approver.approverType == 'User') {
        return approver.value;
    }

    if (approver.approverType == 'Relationship') {
        if (approver.value == 'Requestee_Manager') {
            try {
                var requesteeObj = openidm.read('managed/alpha_user/' + requesteeId, null, ['manager/*']);
                if (requesteeObj && requesteeObj.manager && requesteeObj.manager.mail) {
                    logger.error('aaronPOC-v7-Router: resolved Requestee_Manager=' + requesteeObj.manager.mail);
                    return requesteeObj.manager.mail;
                } else {
                    logger.error('aaronPOC-v7-Router: requestee has no manager, skipping');
                    return '';
                }
            } catch (e) {
                logger.error('aaronPOC-v7-Router: failed to read requestee manager: ' + e);
                return '';
            }
        }

        if (approver.value == 'Requestee_Organization_Admin') {
            try {
                var orgObj = openidm.read('managed/alpha_organization/' + orgId, null, ['admins/*']);
                if (orgObj && orgObj.admins && orgObj.admins.length > 0 && orgObj.admins[0].mail) {
                    logger.error('aaronPOC-v7-Router: resolved Org_Admin=' + orgObj.admins[0].mail + ' from org=' + orgId);
                    return orgObj.admins[0].mail;
                } else {
                    logger.error('aaronPOC-v7-Router: org ' + orgId + ' has no admins, skipping');
                    return '';
                }
            } catch (e) {
                logger.error('aaronPOC-v7-Router: failed to read org admins: ' + e);
                return '';
            }
        }

        // future: other relationship values here
        logger.error('aaronPOC-v7-Router: unknown Relationship value=' + approver.value);
        return '';
    }

    // future: other approver types here
    logger.error('aaronPOC-v7-Router: unknown approverType=' + approver.approverType);
    return '';
}

try {
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    var custom = requestObj.request.custom;
    var orgLevels = custom.orgLevels;
    var requesteeId = custom.requestee._id;

    var found = false;
    while (currentLevel <= 3 && !found) {
        var levelKey = 'level' + currentLevel;
        var levelObj = orgLevels[levelKey];
        if (levelObj && levelObj.approvers) {
            var orgId = levelObj._id || '';
            var step1Approver = (levelObj.approvers.step1 && levelObj.approvers.step1.length > 0) ? levelObj.approvers.step1[0] : null;
            var step2Approver = (levelObj.approvers.step2 && levelObj.approvers.step2.length > 0) ? levelObj.approvers.step2[0] : null;

            var step1Email = resolveApproverEmail(step1Approver, requesteeId, orgId);
            var step2Email = resolveApproverEmail(step2Approver, requesteeId, orgId);

            if (step1Email || step2Email) {
                var firstEmail = step1Email ? step1Email : step2Email;
                var remainingEmail = step1Email ? step2Email : '';

                execution.setVariable('nextLevel', 'level' + currentLevel);
                execution.setVariable('currentApproverEmail', firstEmail);
                execution.setVariable('step2Email', remainingEmail);
                execution.setVariable('currentLevel', currentLevel);

                logger.error('aaronPOC-v7-Router: found ' + levelKey + ', first=' + firstEmail + ', remaining=' + remainingEmail + ', routing to level' + currentLevel);
                found = true;
            } else {
                logger.error('aaronPOC-v7-Router: ' + levelKey + ' has no resolvable approvers, skipping');
                currentLevel = currentLevel + 1;
            }
        } else {
            logger.error('aaronPOC-v7-Router: no ' + levelKey + ', skipping');
            currentLevel = currentLevel + 1;
        }
    }

    if (!found) {
        execution.setVariable('nextLevel', 'done');
        logger.error('aaronPOC-v7-Router: all levels done');
    }
} catch (e) {
    logger.error('aaronPOC-v7-Router: failed: ' + e);
    execution.setVariable('nextLevel', 'done');
}
