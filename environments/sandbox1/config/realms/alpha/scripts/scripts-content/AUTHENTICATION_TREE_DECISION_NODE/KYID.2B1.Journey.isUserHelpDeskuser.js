var id = nodeState.get("_id");
//var id = "e5052712-1834-4093-873c-cab324386d8e";
logger.error("id of the helpdesk user" +id)
var vInternalRole = openidm.query("managed/alpha_user/"+ id + "/authzRoles", {
    "_queryFilter": "true",
}, ["_refResourceId"]);

logger.error("vInternalRole of the helpdesk user" +vInternalRole.result)

var found = false; // Track if a match is found

for (var i = 0; i < vInternalRole.resultCount; i++) {
    var roleId = vInternalRole.result[i]._refResourceId;
    logger.error("roleId of the helpdesk user" +roleId)
    if (roleId == "kyid_helpdeskrole1") {
        action.goTo("true"); // Perform action when match is found
        found = true;
        break; // Exit loop once match is found
    }
}

if (!found) {
    action.goTo("false"); // Perform action when no match is found
}