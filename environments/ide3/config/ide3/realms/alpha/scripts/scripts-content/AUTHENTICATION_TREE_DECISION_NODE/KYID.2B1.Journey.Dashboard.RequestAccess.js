var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Dashboard Manage Access",
      script: "Script",
      scriptName: "KYID.2B1.Journey.manageAccess",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      ERROR:"error",
      BACK:"back",
      CONTINUE:"continue",
      REFRESH:"refresh"

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


// Main Execution
try {
//Fetch the appId that user selected
    if(nodeState.get("appIDinWidget")){
    var appId = nodeState.get("appIDinWidget");
        }
        else {
            var appId = requestParameters.get("appIDinWidget")[0];
            nodeState.putShared("requestroleType","APP_LIBRARY")
        }

    
   // var appId = nodeState.get("appIDinWidget");
    var userId = nodeState.get("_id");
    // appId = "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6";
    // userId = "2cac8cf7-c334-483c-a6c6-51cf6800a1e8";
    nodeState.putShared("_id",userId);
     if (callbacks.isEmpty()) {
         if(nodeState.get("invalidJSONError") != null){
                callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
            }
            if(nodeState.get("invalidRoleError") != null){
                callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));
            }
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message );
       action.goTo(NodeOutcome.ERROR)
  }


// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {

        callbacksBuilder.textOutputCallback(1, "request_access")
        var response = formatJSON(appId,userId);
        callbacksBuilder.textOutputCallback(0, response )
        callbacksBuilder.textInputCallback("JSON Input");
        
        if(requestParameters.get("appIDinWidget")){
             callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
        } else {
             callbacksBuilder.confirmationCallback(0, ["Continue","Refresh","Back to manage access"], 1);
        }
       
        
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message );
    }
    
}
function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
   
            var userInput = callbacks.getTextInputCallbacks().get(0).trim();
            if(selectedOutcome === 2){
                nodeState.putShared("invalidJSONError", null);
            nodeState.putShared("invalidRoleError", null);
                action.goTo(NodeOutcome.BACK);
            }
            if(selectedOutcome === 1){
                nodeState.putShared("invalidJSONError", null);
            nodeState.putShared("invalidRoleError", null);
               action.goTo(NodeOutcome.REFRESH);
            }
            else if(selectedOutcome === 0){
                // nodeState.putShared(input,"input");
                if(validateJsonFormat(userInput)){
                    if(!isInputValid(userInput)){
                     action.goTo(NodeOutcome.CONTINUE);
                    }
                    else{
                        nodeState.putShared("invalidJSONError", null);
                        nodeState.putShared("invalidRoleError", null);
                        action.goTo("invalidRoles")
                    }
                    
                }
                else{
                    nodeState.putShared("invalidJSONError", null);
                    nodeState.putShared("invalidRoleError", null);
                    action.goTo("invalidJSON")
                }
                // action.goTo(NodeOutcome.REMOVE_ROLE);
            }

                
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in handleUserResponses function ::"+ error);
       nodeState.putShared("invalidJSONError", null);
       nodeState.putShared("invalidRoleError", null);
        action.goTo(NodeOutcome.ERROR);
        
    }
    
}

function getUserRole(userId) {
    try {
        var response = openidm.query("managed/alpha_user/", { "_queryFilter": '/_id/ eq "' + userId + '"' }, [""]);
        var result = response.result[0].effectiveRoles;
        const userRoleIds = [];
        for (var i = 0; i < result.length; i++) {
          userRoleIds.push(result[i]._refResourceId);
        }
        return (userRoleIds);
        
    } catch (error) {
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred ::"+ error);
        return ("error");
    }
    
}

function getAppRole(appId) {
    try {
        // var response = openidm.read("managed/alpha_application/771cb8bf-4c55-4948-b9c9-1621a818e479/roles",[],[]);
        var response = openidm.query("managed/alpha_application/"+appId+"/roles",{"_queryFilter": "true"}, [""]);
        // var result = response.result[0];
        const AppRoleIds = [];
        for (var i = 0; i < response.result.length; i++) {
          AppRoleIds.push(response.result[i]._refResourceId);
        }
        // return(JSON.stringify(response));
        nodeState.putShared("AppRoleIds",AppRoleIds);
        return(AppRoleIds);
    } catch (error) {
        
    }
    
}

function matchingRoles(appId,userId) {
 var userRoleId = getUserRole(userId);
 var appRoleId = getAppRole(appId);
 var missingRoles = appRoleId.filter(id => !userRoleId.includes(id));
 // var matchedRoles = appRoleId.filter(id => userRoleId.includes(id));
 return (missingRoles)
}

function getAppDetails(appId) {
    try {
        // var response = openidm.query("managed/alpha_kyid_businessapplication/", { "_queryFilter": '/application/_refResourceId eq "' + "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6" + '"' }, [""]);
        // var response = openidm.query("managed/alpha_kyid_businessapplication/", { "_queryFilter": '/application/_refResourceId eq "' + "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6" + '"', "_pageSize": 10, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": 0 }, []);
        // var appId = "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6"
        var appObj = ops.crudOps("read", "alpha_application", null, null, null, appId);
        var businessAppId = appObj.businessApplication._refResourceId;
        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
        var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        return {
          "result": [
            {
              "businessAppName": businessAppName,
              "businessAppLogo": businessAppLogo
            }
          ]
        }
        
    } catch (error) {
        
    }
    
}

// function formatJSON(appId,userId) {
//     try {
//         var appDetails =  getAppDetails(appId);
//         var businessAppName = appDetails.result[0].businessAppName;
//         var businessAppLogo = appDetails.result[0].businessAppLogo;
//         var roles = getAppRole(appId);
//         var roleId = roles[0];
//         appResponse = JSON.parse(lib.getBusinessAppInfo(roleId));
//         var roleList = []; 
//         var content = [];
//         var roles = JSON.stringify(matchingRoles(appId,userId));
//         logger.debug("Roles are "+ roles + "Type is::"+ typeof roles)
//         var matchedrole = JSON.parse(roles);
//         logger.debug("matchedrole array length ::"+ matchedrole.length)
//         // logger.debug("JSON.parse(matchedrole)"+JSON.parse(matchedrole))
//         // nodeState.putShared("roles",JSON.parse(matchedrole));
//         for (var i=0; i < matchedrole.length; i++){
//             var currentRoleId = matchedrole[i];
//             logger.debug("currentRoleId is "+ currentRoleId)
//             var response = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id/ eq "' + currentRoleId + '"' }, [""]);
//             logger
//             if(response.result[0].content){
//                  content = response.result[0].content
//             }
    
//             logger.debug("Response is "+response);
//             var roleEntry = {
//                 "roleId": currentRoleId,
//                 "content": content 
                
//             };
//             roleList.push(roleEntry);
            
//         }
//      logger.debug("finalOutput is before "+"finalOutput")
//     var finalOutput = {
//     "businessAppName": businessAppName,
//     "businessAppLogo": businessAppLogo,
//     "roles": roleList,
//     "application":appResponse.application  
//     };
//     logger.debug("finalOutput is "+JSON.stringify(finalOutput))
//     return (JSON.stringify(finalOutput));
        
           
//     } catch (error) {
        
//     }
// }


function formatJSON(appId, userId) {
    try {
        var appDetails = getAppDetails(appId);
        var businessAppName = appDetails.result[0].businessAppName;
        var businessAppLogo = appDetails.result[0].businessAppLogo;
        var roles = getAppRole(appId);
        var roleId = roles[0];
        var appResponse = JSON.parse(lib.getBusinessAppInfo(roleId));
        var roleList = [];
        var matchedRoles = matchingRoles(appId, userId);

        for (var i = 0; i < matchedRoles.length; i++) {
            var currentRoleId = matchedRoles[i];
            logger.debug("Processing currentRoleId: " + currentRoleId);

            // Fetch role content
            var response = openidm.query("managed/alpha_role/", {
                "_queryFilter": '/_id/ eq "' + currentRoleId + '"'
            }, []);
            var content = response.result[0].content || [];

            // Default flags
            var requestedbutinprogress = false;
            var requestedbutinprogressdescription = "";

            // Build query to alpha_kyid_request
            var allowedStatuses = ["TODO", "NOT_STARTED", "IN_PROGRESS", "PENDINGAPPROVAL"];
            var queryFilter = 'requester eq "' + userId + '" and approleid eq "' + currentRoleId + '" and ('
                + allowedStatuses.map(status => 'status eq "' + status + '"').join(" or ")
                + ')';

            var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter }, []);

            if (kyidResponse.result && kyidResponse.result.length > 0) {
                requestedbutinprogress = true;
                requestedbutinprogressdescription = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + currentRoleId;
            }

            // Add to roleList
            roleList.push({
                "roleId": currentRoleId,
                "content": content,
                "requestedbutinprogress": requestedbutinprogress,
                "requestedbutinprogressdescription": requestedbutinprogressdescription
            });
        }

        var finalOutput = {
            "businessAppName": businessAppName,
            "businessAppLogo": businessAppLogo,
            "roles": roleList,
            "application": appResponse.application
        };

        return JSON.stringify(finalOutput);

    } catch (error) {
        logger.error("Error in formatJSON: " + error);
        return JSON.stringify({ error: "Failed to format JSON" });
    }
}
function isInputValid(input) {
    var response = JSON.parse(input);
    var roleIds = response.roleId;
    //nodeState.putShared("requestedRoleId",requestedRoleId)
    nodeState.putShared("requestedRoleId",roleIds)
    var unmatchedRoles = [];
    var roles= matchingRoles(appId,userId);
    logger.debug("User JSON Input Is "+response.roleId)
    // var matchingRoles = nodeState.get("roles");
    logger.debug("matchingRoles is"+ matchingRoles)
    var unmatchedRoles = response.roleId.filter(role => !roles.includes(role));
    logger.debug("unmatchedRoles is----- "+ unmatchedRoles)
    if(unmatchedRoles.length>0){
        logger.debug("unmatchedRoles is "+ unmatchedRoles)
        nodeState.putShared("invalidRoles",unmatchedRoles.toString())
        return true;
    }
    else{
        return false;
    }
}


function validateJsonFormat(json) {
  try {
    logger.debug("Input JSON is: " + json);

    // Parse the JSON string
    var parsedJson = JSON.parse(json);
    logger.debug("Parsed JSON is: " + JSON.stringify(parsedJson));

    // Check if parsed result is an object and not null
    if (typeof parsedJson !== 'object' || parsedJson === null) {
      return false;
    }

    // Check that the object has only one key: 'roleId'
    const keys = Object.keys(parsedJson);
    if (keys.length !== 1 || keys[0] !== 'roleId') {
      return false;
    }

    // Check that roleId is an array with exactly one item
    if (!Array.isArray(parsedJson.roleId) || parsedJson.roleId.length !== 1) {
      return false;
    }

    // Check that the single item is a string
    if (typeof parsedJson.roleId[0] !== 'string') {
      return false;
    }

    // All checks passed
    return true;

  } catch (e) {
    logger.error("Exception during validation: " + e);
    return false;
  }
}


