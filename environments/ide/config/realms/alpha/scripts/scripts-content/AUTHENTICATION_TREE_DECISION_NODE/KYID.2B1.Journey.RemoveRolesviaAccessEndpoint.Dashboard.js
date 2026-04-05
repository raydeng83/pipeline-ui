try {
    var userId = nodeState.get("_id");  
    var targetRoleData = nodeState.get("accessroleid");

    logger.debug("handleRemoveRoles - Retrieved userId: " + userId);
    logger.debug("handleRemoveRoles - Retrieved targetRoleData from nodeState: " + JSON.stringify(targetRoleData));
    logger.debug("handleRemoveRoles - typeof targetRoleData: " + typeof targetRoleData);

    //targetRoleData array
    if (!Array.isArray(targetRoleData)) {
        //  stringified array or object
        if (typeof targetRoleData === "string") {
            try {
                targetRoleData = JSON.parse(targetRoleData);
            } catch (e) {
                logger.error("handleRemoveRoles - Failed to parse targetRoleData JSON: " + e);

            }
        } else if (typeof targetRoleData === "object") {
            // Convert object/array-like to array
            targetRoleData = Array.from(targetRoleData);
        }
    }

    if (!Array.isArray(targetRoleData) || targetRoleData.length === 0) {
        logger.debug("handleRemoveRoles - targetRoleData is empty after conversion. Exiting.");

    }

    logger.debug("handleRemoveRoles - Final targetRoleData array: " + JSON.stringify(targetRoleData));

    // Build query filter
var roleIdsString = JSON.stringify(targetRoleData); 
var queryFilter = `_id in '${roleIdsString}' AND (recordState eq "0" OR recordState eq "ACTIVE")`;

var requestBody = {
    payload: {
        queryFilter: queryFilter,
        id: userId
    },
    action: 3
};

logger.debug("handleRemoveRoles - Request body for openidm.create: " + JSON.stringify(requestBody));

//var response = openidm.create("endpoint/access_v2B", null, requestBody);
    var sessionDetail = null
if(nodeState.get("sessionRefId")){
        sessionDetail = nodeState.get("sessionRefId") 
}else if(typeof existingSession != 'undefined'){
        sessionDetail = existingSession.get("sessionRefId")
    }

    var response;
    if (sessionDetail !== null && sessionDetail !== undefined) {
        response = openidm.create("endpoint/access_v2B", null, requestBody, { sessionDetail: sessionDetail });
    } else {
        response = openidm.create("endpoint/access_v2B", null, requestBody);
    }
logger.debug("handleRemoveRoles - Roles removed successfully for userId: " + userId + " :: Response: " + JSON.stringify(response));
nodeState.putShared("roleremovalstatus","Role Removed Successfully")
action.goTo("true")

} catch (e) {
    logger.error("handleRemoveRoles - Error removing roles for userId " + userId + ": " + e);
    nodeState.putShared("roleremovalstatus","Role Removed Failed")
    action.goTo("true")
}

