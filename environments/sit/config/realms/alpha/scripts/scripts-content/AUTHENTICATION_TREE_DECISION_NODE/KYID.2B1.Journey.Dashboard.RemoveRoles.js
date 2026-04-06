/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// var userId = "2cac8cf7-c334-483c-a6c6-51cf6800a1e8";
// var roleID = ["e3d13783-f9c7-431c-be22-f4454491c801"];
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger")

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "RemoveRolesfromDashboardorAppLibrary",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Dashboard.RemoveRoles",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    },
    info: function(message) {
        logger.info(message);
    }
};

var userId = nodeState.get("userId") || null
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var browser = requestHeaders.get("user-agent"); 
var os = requestHeaders.get("sec-ch-ua-platform"); 

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

  var sessionDetails = {}
        var sessionDetail = null
        if(nodeState.get("sessionRefId")){
            sessionDetail = nodeState.get("sessionRefId") 
            sessionDetails["sessionRefId"] = sessionDetail
        }else if(typeof existingSession != 'undefined'){
            sessionDetail = existingSession.get("UserId")
            sessionDetails["sessionRefId"] = sessionDetail
        }else{
             sessionDetails = {"sessionRefId": ""}
        }
        var requesterUserId = null;
 if(typeof existingSession != 'undefined'){
            requesterUserId = existingSession.get("UserId")
            }else if(nodeState.get("_id")){
        requesterUserId = nodeState.get("_id")
                       }
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

//Function to soft delete the pre req object
function queryPrerequisiteRequest(userId, roleID, value) {
    logger.debug("Inside queryPrerequisiteRequestContexID");
    var recordRequest = null;
    var recordRequestJSONObj = {};
    var contextID = null;
    var type = [];

    try {
        recordRequest = openidm.query("managed/alpha_kyid_request", {
            _queryFilter: 'requester eq "' + userId + '" AND approleid eq "' + roleID + '"',
        }, ["contextid", "type"]);
        logger.debug("Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));
        recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
        logger.debug("recordRequestJSONObj" + JSON.stringify(recordRequest.result));

        contextID = recordRequest.result[0].contextid;
        logger.debug("contextID is in " + contextID)

        recordRequestJSONObj.forEach(element => {
            type.push(element.type);
        });
        //     nodeState.putShared("contextID", contextID);
        //     nodeState.putShared("type", type)
        if (value === "contextID") {
            return contextID;
        } else if (value === "type") {
            logger.debug("type in queryPrerequisiteRequest " + type)
            return type
        }
    } catch (error) {
        logger.error("failure in " + error);
    }
}


function queryPrerequisiteType(uuid, type, roleID, contextID) {
    logger.debug("Inside queryPrerequisiteRequestContexID");
    var recordRequest = null;
    var recordRequestJSONObj = {};
    var prereqRemove = [];
    //var type = [];
    var prerequisiteAction = require("KYID.2B1.Library.Actions");
    try {
        if (Array.isArray(type)) {
            type.forEach(value => {
                recordRequest = openidm.query("managed/alpha_kyid_prerequisite", {
                    _queryFilter: 'prereqtypename eq "' + value + '"',
                }, ["disenrollmentactions"]);
                logger.debug("recordRequest is in " + JSON.stringify(recordRequest))
                if (recordRequest !== null && recordRequest) {
                    if (recordRequest.result[0].disenrollmentactions !== null && recordRequest.result[0].disenrollmentactions.removeprereq === true) {
                        prereqRemove.push(value);
                    }
                }
            })
        }
        logger.debug("prereqRemove is " + prereqRemove)
        prerequisiteAction.softDeletePrereq(uuid, contextID, prereqRemove);

    } catch (error) {
        logger.error("failure in " + error);
    }
}


var statusList = [];
var userId = nodeState.get("_id");
var rawRoleIds = nodeState.get("roleIds")
if (typeof rawRoleIds === 'object') {
    var roleID1 = nodeState.get("roleIds");
    var roleID2 = JSON.stringify(roleID1);
    var roleID = JSON.parse(roleID2);
} else {
    var roleID = nodeState.get("roleIds");
}

logger.debug("RoleID type is " + typeof roleID)
var deleteRolesjson = [];
logger.debug("Fetched userId: " + userId);
logger.debug("Fetched roleIDs: " + JSON.stringify(roleID));

if (!userId || !roleID) {
    logger.debug("Missing or invalid userId or roleIDs. Aborting.");
    outcome = "false";
} else {
    var userRoleList = openidm.query("managed/alpha_user/" + userId + "/roles", {
        "_queryFilter": "true"
    }, ["_refResourceId"]);

    if (!userRoleList) {
        logger.debug("No roles found for user or invalid response structure.");
        outcome = "false";
    } else {
        logger.debug("Total roles found for user: " + userRoleList.result.length);
        var deletedCount = 0;

        for (var i = 0; i < userRoleList.result.length; i++) {
            var roleEntry = userRoleList.result[i];
            var refId = roleEntry._refResourceId;
            var membershipId = roleEntry._id;


            if (roleID.includes(refId)) {
                logger.debug("Matching role found. Membership ID to delete: " + membershipId);
                try {
                    var roleName = openidm.read("managed/alpha_role/" + refId)
                    var roleNameResult = roleName.name
                    openidm.delete("managed/alpha_user01/" + userId + "/roles/" + membershipId, null);
                    deletedCount++;
                     logger.debug("Successfully deleted membership: " + membershipId);
                    auditLib.auditLogger("ROM005", sessionDetails, "Removed All Roles Success", eventDetails, requesterUserId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
                    //deleteRolesjson.push({ status: 0, membershipId: membershipId });
                    deleteRolesjson.push({
                        status: 0,
                        roleName: roleNameResult
                    });

                    statusList.push({
                        roleName: roleNameResult,
                        roleremovalstatus: "success"
                    });
                    //Soft delete the request object for that role
                    var contextID = queryPrerequisiteRequest(userId, roleID, "contextID")
                    var type = queryPrerequisiteRequest(userId, roleID, "type")

                    var queryPrerequisiteType1 = queryPrerequisiteType(userId, type, roleID, contextID);
                    //Hard delete the extended idenity for that role
                    var prerequisiteAction = require("KYID.2B1.Library.Actions");
                    type.forEach(value => {
                        try {
                            var extIdsList = prerequisiteAction.getExtIds(userId, value, null, false);
                            if (Array.isArray(extIdsList) && extIdsList.length > 0) {
                                prerequisiteAction.deleteExistingFormDataFromIDNObj(extIdsList);
                                logger.debug("Deleted form data for type: " + value + ", extIds: " + JSON.stringify(extIdsList));
                            } else {
                                logger.debug("No extIds found for deletion for type: " + value);
                            }
                        } catch (err) {
                            logger.error("Error while deleting form data for type: " + value + " - " + err.message);
                        }
                        //Hard delete the enrolment context for that role
                        try {
                            var contextIdsList = prerequisiteAction.getContextIds(userId, roleID);
                            if (Array.isArray(contextIdsList) && contextIdsList.length > 0) {
                                prerequisiteAction.deleteExistingContextIdsObj(contextIdsList);
                                logger.debug("Deleted form data for type: " + value + ", contextIdsList: " + JSON.stringify(contextIdsList));
                            } else {
                                logger.debug("No contextIdsList found for deletion for type: " + value);
                            }
                        } catch (err) {
                            logger.error("Error while deleting enrolment context data for type: " + value + " - " + err.message);
                        }
                    });
                    // })

                } catch (delErr) {

                    logger.debug("Error deleting membership " + membershipId + ": " + delErr.message);
                    deleteRolesjson.push({
                        status: 1,
                        membershipId: membershipId,
                        error: delErr.message
                    });
                    statusList.push({
                        roleName: roleNameResult || "Unknown",
                        roleremovalstatus: "failure",
                        error: delErr.message
                    });
                    
                   
                    auditLib.auditLogger("ROM006", sessionDetails, "Remove All Roles Failure", eventDetails, requesterUserId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
                }
            }
        }

        // Save status list in nodeState
        nodeState.putShared("roleremovalstatus", statusList);

        if (deleteRolesjson.length === 0) {
            callbacksBuilder.textOutputCallback(0, "No results found.");
            logger.debug("No widgets found for user.");
            outcome = "false";
        } else {
            logger.debug("Delete operations summary: " + JSON.stringify(deleteRolesjson));
            //callbacksBuilder.textOutputCallback(0, JSON.stringify(deleteRolesjson));
            outcome = "true";
        }
    }
}




//  var userId = nodeState.get("_id");
// var roleID = nodeState.get("roleIDs")
//   var userRoleList = openidm.query("managed/alpha_user/" + userId + "/roles", {
//       "_queryFilter": "true"
//   }, ["_refResourceId"]);



//   if (userRoleList) {
//       for (var i = 0; i < userRoleList.result.length; i++) {
//           var refId = userRoleList.result[i]._refResourceId;
//           if (roleID.includes(refId)) {
//               var membershipId = userRoleList.result[i]._id;
//               openidm.delete("managed/alpha_user/" + userId + "/roles/" + membershipId, null);
//           }
//       }
//   }
// outcome = "true";