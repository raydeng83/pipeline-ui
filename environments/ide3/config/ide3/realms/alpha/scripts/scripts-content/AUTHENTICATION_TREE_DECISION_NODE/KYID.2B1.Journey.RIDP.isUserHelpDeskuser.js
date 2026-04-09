var id = nodeState.get("userId") || nodeState.get("_id");
logger.debug("id of the helpdesk user: " + id);

// Query user roles
var vInternalRole = openidm.query("managed/alpha_user/" + id + "/authzRoles", {
    "_queryFilter": "true"
}, ["_refResourceId"]);

logger.debug("vInternalRole of the helpdesk user: " + JSON.stringify(vInternalRole.result));

var found = false; // Track if a match is found

var helpdeskInternalRole = openidm.query("internal/role", {
    "_queryFilter": 'name eq "kyid_helpdeskrole"'
}, []);

if (helpdeskInternalRole.resultCount > 0){
    var roleid = helpdeskInternalRole.result[0]._id;
}else{
    logger.debug("No Roles found in the IDM Environment");
}

for (var i = 0; i < vInternalRole.resultCount; i++) {
    var roleId = vInternalRole.result[i]._refResourceId;
    logger.debug("roleId of the helpdesk user: " + roleId);

    if (roleId === roleid) {
        logger.debug("user is a helpdesk user with helpdesk authorization");
        logger.debug("roleId :" + roleId);
        nodeState.putShared("isHelpDeskUser", "true");
        logger.debug("Value set: " + nodeState.get("isHelpDeskUser"));
        action.goTo("true");
        found = true;
        break; // Exit loop once match is found
    }
}

if (!found) {
    var userIdParam = requestParameters.get("_id");
    if (!userIdParam) {
        action.goTo("true");
    }else{
         action.goTo("false"); // Perform action when no match is found
    }
   
}