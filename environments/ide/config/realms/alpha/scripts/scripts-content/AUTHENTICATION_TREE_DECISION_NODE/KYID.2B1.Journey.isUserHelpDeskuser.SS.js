//var id = nodeState.get("_id");
/*var id = nodeState.get("sessionID");
// var id = "8c447e12-0a44-425e-87d0-f441e960032b";
// var id = "e5052712-1834-4093-873c-cab324386d8e";
logger.error("id of the helpdesk user: " + id);

// Query user roles
var vInternalRole = openidm.query("managed/alpha_user/" + id + "/authzRoles", {
    "_queryFilter": "true"
}, ["_refResourceId"]);

logger.error("vInternalRole of the helpdesk user: " + JSON.stringify(vInternalRole.result));

var found = false; // Track if a match is found

// Query the helpdesk role ID
// var helpdeskInternalRole = openidm.query("managed/alpha_role", {
//     "_queryFilter": 'name eq "kyid_helpdeskrole"'
// }, []);

var helpdeskInternalRole = openidm.query("internal/role", {
    "_queryFilter": 'name eq "kyid_helpdeskrole"'
}, []);

if (helpdeskInternalRole.resultCount > 0)
{
    var roleid = helpdeskInternalRole.result[0]._id;
}
else
{
    logger.error("No Roles found in the IDM Environment");
}
for (var i = 0; i < vInternalRole.resultCount; i++) {
    var roleId = vInternalRole.result[i]._refResourceId;
    logger.error("roleId of the helpdesk user: " + roleId);

    if (roleId === roleid) {
        logger.error("user is a helpdesk user with helpdesk authorization");
        logger.error("roleId :" + roleId);
        nodeState.putShared("isHelpDeskUser", "true");
        logger.error("Value set: " + nodeState.get("isHelpDeskUser"));
        nodeState.putShared("journeyName","helpdeskChangeEmail")
        action.goTo("true");
        found = true;
        break; // Exit loop once match is found
    }
}

if (!found) {
    var userIdParam = requestParameters.get("_id");
    if (!userIdParam) {
        nodeState.putShared("journeyName","helpdeskChangeEmail")
        action.goTo("true");
    }else{
        nodeState.putShared("journeyName","helpdeskChangeEmail")
         action.goTo("false"); // Perform action when no match is found
    }
   
}

// var id = nodeState.get("_id");
// //var id = "e5052712-1834-4093-873c-cab324386d8e";
// var vInternalRole = openidm.query("managed/alpha_user/"+ id + "/authzRoles", {
//     "_queryFilter": "true",
// }, ["_refResourceId"]);


// var found = false; // Track if a match is found

// for (var i = 0; i < vInternalRole.resultCount; i++) {
//     var roleId = vInternalRole.result[i]._refResourceId;
//     if (roleId == "kyid_helpdeskrole") {
//         action.goTo("true"); // Perform action when match is found
//         found = true;
//         break; // Exit loop once match is found
//     }
// }

// if (!found) {
//     action.goTo("false"); // Perform action when no match is found
// }
*/

 nodeState.putShared("isHelpDeskUser", "true");
        logger.error("Value set: " + nodeState.get("isHelpDeskUser"));
        nodeState.putShared("journeyName","helpdeskChangeEmail")
        action.goTo("true");

