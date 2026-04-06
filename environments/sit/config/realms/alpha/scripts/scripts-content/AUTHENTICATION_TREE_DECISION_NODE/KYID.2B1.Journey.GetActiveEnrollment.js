var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
begin: "Beginning Node Execution",
node: "Node",
nodeName: "Dashboard getActiveEnrollment",
script: "Script",
scriptName: "KYID.2B1.Journey.GetActiveEnrollment",
timestamp: dateTime,
end: "Node Execution Completed"
};
    
var NodeOutcome = {
TRUE: "true",
FALSE: "false",
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
};

var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var appLib = require("KYID.2B1.Lib.GetAppandBusinessApp");

// Get userId once
var userId = nodeState.get("_id");
logger.debug("user id is "+userId)
function getFullContextRoleAppDetails(userId) {
    try {
        var responseArray = [];

        var params = {
            key: "requester",
            ops: "eq",
            value: userId
        };

        //If the request is coming from LoginAuthorization
        var requestedAppId = null;
        if (requestParameters.get("appIDReq")) {
    requestedAppId = requestParameters.get("appIDReq").get(0);
    logger.debug("Requested appID found in parameters: " + requestedAppId);
}


        var allowedStatuses = "IN_PROGRESS";

   var EnrollmentRequests = openidm.query("managed/alpha_kyid_enrollment_request/", { "_queryFilter": '/requestedUserId/ eq "' + userId + '"' + ' AND status eq "' + allowedStatuses + '"' }, []);

        logger.debug("getActiveEnrollment journey : enrollment requests " +EnrollmentRequests)
        if (!EnrollmentRequests || EnrollmentRequests.result.length === 0) {
            logger.debug("No matching EnrollmentRequests found for user.");
            return []; // early return, avoids continuing on empty
        }

        var contextIdTracker = {}; // to track unique contextIds
        
        for (var i = 0; i < EnrollmentRequests.result.length; i++) {
            var item = EnrollmentRequests.result[i];
            var contextId = item.enrollmentContextId;
            var requestId = item._id;
            var roleIds = item.roleIds;
            //null check for roleId
            if (!roleIds || roleIds.length === 0) {
                logger.debug("Skipping item because no role found in requestId: " + requestId);
                continue; // Skip this iteration
            }

            logger.debug("roleIds from request" +roleIds);
           
            var roleId =roleIds[0]._refResourceId;
            // Get Role Name
            params = {
                key: "_id",
                ops: "eq",
                value: roleId
            };

            var roleNameResponse = ops.crudOps("query", "alpha_role", null, params, null, null);
            // var queryFilters = '_id eq "' + roleId + '"';
            // var roleNameResponse = openidm.query("managed/alpha_role", { "_queryFilter": queryFilters }, []);

              logger.debug("getActiveEnrollment journey roleNameResponse  : " + roleNameResponse)
                       
             //null check for roleId
            if (!roleNameResponse || !roleNameResponse.result || roleNameResponse.result.length === 0) {
                logger.debug("No role found for roleId: " + roleId);
                continue; // Skip if role not found
            }

             logger.debug("getActiveEnrollment journey roleNameResponse  : " + roleNameResponse.result[0].content[0])
            var roleName = roleNameResponse.result[0].content[0].name["en"];
            var roleDescription = roleNameResponse.result[0].content[0].description["en"];

      
            var businessAppResults = openidm.query("managed/alpha_kyid_businessapplication/", { "_queryFilter": 'roleAppId/_refResourceId eq "' + roleId + '"'}, []);
            
              logger.debug("getActiveEnrollment journey businessAppResults  : " + businessAppResults);
             
            // Get Role appResults
            if (!businessAppResults || businessAppResults.result.length === 0) {
                logger.debug("No Business applications found for roleId: " + roleId);
                continue; // Skip if no apps found
            }

             logger.debug("getActiveEnrollment journey Rolename and Desc  : " + roleName +" : "+roleDescription);
            // Mark contextId as processed
             contextIdTracker[contextId] = true;
            

            for (var j = 0; j < businessAppResults.result.length; j++) {
                var appItem = businessAppResults.result[j];                
                responseArray.push({
                    contextId: contextId,
                    requestId: requestId,
                    appId: appItem._id,
                    appName: appItem.content[0].title.en,
                    businessAppName: appItem.content[0].title.en,
                    businessAppLogo: appItem.logoURL,
                    requestedRole: roleName,
                    requestedRoleDescription: roleDescription,
                    enrollmentRequestURL: "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment"
                });
            }
        }

            
/*        var allowedStatuses = ["TODO", "NOT_STARTED", "IN_PROGRESS", "PENDINGAPPROVAL"];

        var queryFilter = 'requester eq "' + userId + '"'
            + ' and (status eq "' + allowedStatuses[0] + '"'
            + ' or status eq "' + allowedStatuses[1] + '"'
            + ' or status eq "' + allowedStatuses[2] + '"'
            + ' or status eq "' + allowedStatuses[3] + '")';

        var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter }, []);

        if (!kyidResponse || kyidResponse.result.length === 0) {
            logger.debug("No matching alpha_kyid_request found for requester.");
            return []; // early return, avoids continuing on empty
        }

        var contextIdTracker = {}; // to track unique contextIds
        
        for (var i = 0; i < kyidResponse.result.length; i++) {
            var item = kyidResponse.result[i];
            var contextId = item.contextid;
            var requestId = item._id;
            //var roleId = item.role._refResourceId;
            var roleId = item.approleid;
            //null check for roleId
            if (!roleId) {
                logger.debug("Skipping item because approleid is missing for requestId: " + requestId);
                continue; // Skip this iteration
            }

            logger.debug("roleId from request" +roleId)
            // Get Role Name
            params = {
                key: "_id",
                ops: "eq",
                value: roleId
            };

            var roleNameResponse = ops.crudOps("query", "alpha_role", null, params, null, null);
            // var queryFilters = '_id eq "' + roleId + '"';
            // var roleNameResponse = openidm.query("managed/alpha_role", { "_queryFilter": queryFilters }, []);

            // Skip if contextId is already processed
            if (contextIdTracker[contextId]) {
                logger.debug("Skipping duplicate contextId: " + contextId);
                continue;
            }
          
             //null check for roleId
            if (!roleNameResponse || !roleNameResponse.result || roleNameResponse.result.length === 0) {
                logger.debug("No role found for roleId: " + roleId);
                continue; // Skip if role not found
            }
            
            var roleName = roleNameResponse.result[0].name;
            var roleDescription = roleNameResponse.result[0].description;

            // Get all application + business application pairs
            var appResults = appLib.getAppAndBusinessAppFromRole(roleId);
            // Get Role appResults
            if (!appResults || appResults.length === 0) {
                logger.debug("No applications found for roleId: " + roleId);
                continue; // Skip if no apps found
            }

            // Mark contextId as processed
             contextIdTracker[contextId] = true;
            

            for (var j = 0; j < appResults.length; j++) {
                var appItem = appResults[j];
                responseArray.push({
                    contextId: contextId,
                    requestId: requestId,
                    appId: appItem.appId,
                    appName: appItem.appName,
                    businessAppName: appItem.businessAppName,
                    businessAppLogo: appItem.businessAppLogo,
                    requestedRole: roleName,
                    requestedRoleDescription: roleDescription,
                    enrollmentRequestURL: "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment"
                });
            }
        }
*/

        //LoginAuthzFlow: If requestedAppId exists, filter here
        // if (requestedAppId) {
        //     responseArray = responseArray.filter(function (entry) {
        //         return entry.appId === requestedAppId;
        //     });
        // }

        if (requestedAppId) {
    // Filter only entries matching requestedAppId
    responseArray = responseArray.filter(function(entry) {
        return entry.appId === requestedAppId;
    });

    if (responseArray.length > 0) {
        // Pick one requestedRole (role name) from filtered entries
        var requestedRole = responseArray[0].requestedRole;

        //Query OpenIDM to get roleId by role name
        var roleQueryFilter = 'name eq "' + requestedRole + '"';
        var roleResponse = openidm.query("managed/alpha_role", { "_queryFilter": roleQueryFilter }, []);

        if (roleResponse && roleResponse.result && roleResponse.result.length > 0) {
            var roleId = roleResponse.result[0]._id;

            //Get application json from roleId
            var lib = require("KYID.2B1.Library.GenericUtils");
            var appResponse = JSON.parse(lib.getBusinessAppInfo(roleId));

            if (appResponse && appResponse.application) {
                //Add application json once into responseArray
                responseArray.push({ application: appResponse.application });

                logger.debug("Added application info for roleId " + roleId + ": " + JSON.stringify(appResponse.application));
            } else {
                logger.debug("No application info found for roleId " + roleId);
            }
        } else {
            logger.debug("No role found with name: " + requestedRole);
        }
    }
}
        return responseArray;

    } catch (error) {
        logger.error("Error inside getFullContextRoleAppDetails: " + error);
        throw error; // Rethrow so outer catch can handle
    }
}

// Main Execution
try {
    var responseArray = getFullContextRoleAppDetails(userId);
    logger.debug("starting script");
    if (!responseArray || responseArray.length === 0) {
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        logger.debug("No result found");
        action.goTo("false");
    } else {
        callbacksBuilder.textOutputCallback(0, JSON.stringify(responseArray));
        logger.debug("result found");

        // FAQ topic
        try {
            var faqLib = require("KYID.Library.FAQPages");
            var pageHeader = "activeEnrollment";
            var process = "activeEnrollmentSummary";
            var getFaqTopicId = faqLib.getFaqTopidId(pageHeader, process);

            if (getFaqTopicId != null) {
                callbacksBuilder.textOutputCallback(1, getFaqTopicId);
                logger.debug("getFaqTopicId: " + getFaqTopicId);
            } else {
                logger.debug("getFaqTopicId not found for pageHeader: " + pageHeader + ", process: " + process);
            }
        } catch (faqError) {
            logger.error("Error getting FAQ topic: " + faqError);
        }

        action.goTo("true");
    }

} catch (e) {
    logger.error("Error during main execution: " + e);
    callbacksBuilder.textOutputCallback(0, "Some_unexpected_error_occurred.");
    action.goTo("error");
}

// var ops = require("KYID.Library.IDMobjCRUDops");
// var appLib = require("KYID.2B1.Lib.GetAppandBusinessApp");

// function getFullContextRoleAppDetails() {
//     try {
//        var responseArray = [];

//         // var params = {
//         //     key: "requester",
//         //     ops: "eq",
//         //     value: userId
//         //    // value: "43740120-94f9-4380-a6ad-da1648f5b5dd"
//         // };

//         // var kyidResponse = ops.crudOps("query", "alpha_kyid_request", null, params, null, null);
//         var params = {
//     key: "requester",
//     ops: "eq",
//     value: userId
// };

// var allowedStatuses = ["TODO", "NOT_STARTED", "IN_PROGRESS", "PENDINGAPPROVAL"];

// var queryFilter = 'requester eq "' + userId + '"'
//                 + ' and (status eq "' + allowedStatuses[0] + '"'
//                 + ' or status eq "' + allowedStatuses[1] + '"'
//                 + ' or status eq "' + allowedStatuses[2] + '"'
//                 + ' or status eq "' + allowedStatuses[3] + '")';

// var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter }, []);
// //var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter });
//         if (!kyidResponse || kyidResponse.result.length === 0) {
//             logger.debug("No matching alpha_kyid_request found for requester.");
//         }

//         for (var i = 0; i < kyidResponse.result.length; i++) {
//             var item = kyidResponse.result[i];
//             var contextId = item.contextid;
//             var requestId = item._id;

//             params = {
//                 key: "contextID",
//                 ops: "eq",
//                 value: contextId
//             };

//             var contextResponse = ops.crudOps("query", "alpha_kyid_enrolmentcontext", null, params, null, null);
//             if (contextResponse && contextResponse.result.length > 0) {
//                 var contextItem = contextResponse.result[0];
//                 var roleId = contextItem.role._refResourceId;

//                 //Get Role Name
//                 params = {
//                 key: "_id",
//                 ops: "eq",
//                 value: roleId
//                 };
    
//                     var roleNameResponse = ops.crudOps("query", "alpha_role", null, params, null, null);
//                 if (roleNameResponse && roleNameResponse.result.length > 0) {
//                     var roleNameResponseResult = roleNameResponse.result[0];
//                     var roleName = roleNameResponseResult.name;
//                 }
                
//                 //Get all application + business application pairs for this role
//                 var appResults = appLib.getAppAndBusinessAppFromRole(roleId);

//                 for (var j = 0; j < appResults.length; j++) {
//                     var appItem = appResults[j];
//                     responseArray.push({
//                         contextId: contextId,
//                         requestId: requestId,
//                         appId: appItem.appId,
//                         appName: appItem.appName,
//                         businessAppName: appItem.businessAppName,
//                         businessAppLogo: appItem.businessAppLogo,
//                         requestedRole: roleName
//                     });
//                 }
//             }
//         }

//         return responseArray;

//     } catch (error) {
//         logger.debug("Some error" + error);
//         // callbacksBuilder.textOutputCallback(0, "Some unexpected error occured");
//         // action.goTo("error")
//     }
// }

// //Main execution
// var userId = nodeState.get("_id")
// //var responseArray = getFullContextRoleAppDetails(); 


// // if (responseArray.length === 0) {
// //     callbacksBuilder.textOutputCallback(0, "No results found.");
// //     //outcome = "false";
// //      action.goTo("false")
// // } else {
// //     callbacksBuilder.textOutputCallback(0, JSON.stringify(responseArray)); 
// //     //outcome = "true";
// //     action.goTo("true")
// // }

// try {
//     responseArray = getFullContextRoleAppDetails();

//     if (responseArray.length === 0) {
//         callbacksBuilder.textOutputCallback(0, "No results found.");
//         action.goTo("false")
//     } else if (responseArray) {
//         callbacksBuilder.textOutputCallback(0, JSON.stringify(responseArray));
//         action.goTo("true")
//     }

// } catch (e) {
//     logger.error("Error during main execution: " + e);
//     callbacksBuilder.textOutputCallback(0, "Some unexpected error occurred.");
//     action.goTo("error") // or action.goTo("error") if supported
// }

// getFullContextRoleAppDetails();
// if (callbacks.isEmpty()) {
//         callbacksBuilder.textOutputCallback(0, responseArray);
//         outcome = "true"   
//     }
//     else {
//         callbacksBuilder.textOutputCallback(0, responseArray);
//         outcome = "true"   
//     }