var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "CheckIncomingRequestforRequestAccess",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ShowRedirectURLforRequestAccess",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
    
var NodeOutcome = {
    TRUE: "true",
    ERROR: "error"
};

 /**
     * Logging function
     * @type {Function}
     */
 var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
}

var createEnrolmentContextResponse = "";
var jsonObj = {};
var usrroleID = "";
var requestroleType = nodeState.get("requestroleType") || "APP_LIBRARY";
var roleId = "";
var userID = "";

var usrID = "";
if(nodeState.get("_id")){
    var usrID = nodeState.get("_id");
} else {
    if (existingSession.get("KOGID")) {
    var KOGID = existingSession.get("KOGID")
    var user = queryUserByKOGID(KOGID);
    if (user){
        var usrID = user._id
    }
}
}
// Functions..
function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
        return null;
    }
}

// Main Execution
try {
    if (nodeState.get("requestedRoleId")) {
        nodeLogger.debug("requestedRoleId in nodeState for creating the enrolment context " + nodeState.get("requestedRoleId"));

        var rawRoleIds = nodeState.get("requestedRoleId")
         if(typeof rawRoleIds === 'object'){
            var roleID1 = nodeState.get("requestedRoleId");
            var roleID2 = JSON.stringify(roleID1);
        var usrroleID = JSON.parse(roleID2);
             jsonObj = {
                    roleId: usrroleID,
                    userID: usrID,
                    requestType: requestroleType
                };
             
        } else {
            var usrroleID = nodeState.get("requestedRoleId");
             jsonObj = {
                    roleId: [usrroleID],
                    userID: usrID,
                    requestType: requestroleType
                };
        }

        try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
              jsonObj.createDate= auditData.createdDate
             jsonObj.createDateEpoch= auditData.createdDateEpoch
             jsonObj.createdBy= auditData.createdBy
             jsonObj.createdByID= auditData.createdByID
                logger.debug("auditDetail " + JSON.stringify(auditData))
            } catch (error) {
               logger.error("Error Occured : Couldnot find audit details"+ error)
        
            }


        
        var requestedRoleId = nodeState.get("requestedRoleId"); // single role only
        nodeLogger.debug("roleId is " + requestedRoleId);

        var queryFilter = 'userID eq "' + usrID + '" and roleId eq "' + requestedRoleId + '"';
        var existingContextResult = openidm.query("managed/alpha_kyid_enrolmentcontext", {
            "_queryFilter": queryFilter
        });

        var enrolmentContextID = null;

        if (existingContextResult && existingContextResult.result.length > 0) {
            enrolmentContextID = existingContextResult.result[0]._id;
            nodeLogger.debug("Existing enrolment context found: " + enrolmentContextID);
        } else {
            nodeLogger.debug("ReadJsonObjectBody " + JSON.stringify(jsonObj));
            var createEnrolmentContextResponse = openidm.create("managed/alpha_kyid_enrolmentcontext", null, jsonObj);

            if (createEnrolmentContextResponse) {
                enrolmentContextID = createEnrolmentContextResponse._id;
                nodeLogger.debug("Enrolment request Created Successfully: " + JSON.stringify(createEnrolmentContextResponse));
            } else {
                nodeLogger.error("Enrolment request could not be created");
            }
        }

        if (enrolmentContextID) {
            callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + enrolmentContextID);
            action.goTo("true");
        } else {
            callbacksBuilder.textOutputCallback(0, "Enrolment_context_creation_failed");
            action.goTo("false");
        }
    }
} catch (error) {
    nodeLogger.error("Unexpected error while processing enrolment context: " + error);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo("error");
}



//         //Logic to first check the contextID if it exist for the role , if not found then create a new contextID
//         var enrolmentContextID = null; // Declare outside for use after loop


//     var roleId = nodeState.get("requestedRoleId");
// logger.debug("roleId is  "+ roleId);
//     // Query to check if the context already exists
//     var queryFilter = 'userID eq "' + usrID + '" and roleId/0 eq "' + roleId + '"';
//     var existingContextResult = openidm.query("managed/alpha_kyid_enrolmentcontext", {
//         "_queryFilter": queryFilter
//     });
//     logger.debug("existingContextResult response is "+ existingContextResult);

//     if (existingContextResult && existingContextResult.result.length > 0) {
//         enrolmentContextID = existingContextResult.result[0]._id;
//         nodeLogger.error("Existing enrolment context found: " + enrolmentContextID);
        
//     } else {
    

//         nodeLogger.error("ReadJsonObjectBody " + JSON.stringify(jsonObj));
//         createEnrolmentContextResponse = openidm.create("managed/alpha_kyid_enrolmentcontext", null, jsonObj);

//         if (createEnrolmentContextResponse) {
//             nodeLogger.error("enrolment request Created Successfully: " + JSON.stringify(createEnrolmentContextResponse));

//             var enrolmentContextID = createEnrolmentContextResponse._id;

//             //var redirectto = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID="+enrolmentContextID
//             //callbacksBuilder.textOutputCallback(0, redirectto);
//             //callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + enrolmentContextID);
//         } else {
//             nodeLogger.error("Enrolment request could not be created");
//         }


//     if (enrolmentContextID) {
//     callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + enrolmentContextID);
//     action.goTo("true");
// } else {
//     callbacksBuilder.textOutputCallback(0, "Enrolment_context_creation_failed");
//     action.goTo("false");
// }
//        // action.goTo("true");
    
    
//     } 
//     }
// }
// catch (error) {
//     nodeLogger.error("Unexpected error while fetching widgets: " + error);
//     callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
//     action.goTo("error");
// }



// logger.debug("starting script");
// var createEnrolmentContextResponse = "";
// var jsonObj = {};
// var usrID = nodeState.get("_id") || "";
// var usrroleID = nodeState.get("requestedRoleId") || "";
// var requestroleType = nodeState.get("requestroleType") || "dashboard";
// var roleId = "";
// var userID = "";

// // Main Execution
// try {
//     if(nodeState.get("requestedRoleId")){
//         // var roleID = nodeState.get("requestedRoleId");
//         // var redirectto = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID="+roleID
//         // //callbacksBuilder.textOutputCallback(0, "redirect_to:" +redirectto);
//         // callbacksBuilder.textOutputCallback(0, redirectto);
//         // callbacksBuilder.textOutputCallback(0, "requstedroleId:" +roleID);
//         logger.debug("requestedRoleId in nodeState for creating the enrolment context " + nodeState.get("requestedRoleId"));
//         jsonObj = {
//     roleId: usrroleID,
//     userID: usrID,
//     requestType: requestroleType
// };

// logger.debug("ReadJsonObjectBody " + JSON.stringify(jsonObj));
// createEnrolmentContextResponse = openidm.create("managed/alpha_kyid_enrolmentcontext", null, jsonObj);

// if (createEnrolmentContextResponse) {
// logger.debug("enrolment request Created Successfully: " + JSON.stringify(createEnrolmentContextResponse));

//     var enrolmentContextID = createEnrolmentContextResponse._id;
//     var redirectto = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID="+enrolmentContextID
//     callbacksBuilder.textOutputCallback(0, redirectto);
//     callbacksBuilder.textOutputCallback(0, "requstedroleId:" +enrolmentContextID);
// } else {
//     logger.debug("enrolment request could not be created");
// }
//         action.goTo("true");
//     }

// } catch (error) {
//     logger.error("Unexpected error while fetching widgets: " + error);
//     callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
//     action.goTo("error");
// }
