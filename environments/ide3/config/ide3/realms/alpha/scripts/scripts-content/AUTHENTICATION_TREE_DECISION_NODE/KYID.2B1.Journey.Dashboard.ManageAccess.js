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
      REQUEST_ROLE: "requestRole",
      REMOVE_ROLE:"removeRole",
      REFRESH:"refresh",
      INVALID_JSON:"invalidJson",
      INVALID_ROLE:"invalidRoleId"

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
    // var appId = nodeState.get("appIDinWidget");
    // var userId = nodeState.get("_id");
    // appId = "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6";
    // userId = "2cac8cf7-c334-483c-a6c6-51cf6800a1e8";

    if(nodeState.get("appIDinWidget")){
    var appId = nodeState.get("appIDinWidget");
} else {
    var appId = requestParameters.get("appIDinWidget")[0];
       // var appId = "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6"
    logger.debug("fetch the appID from query Paramter "+appId)
}

if(nodeState.get("_id")){
    var userId = nodeState.get("_id");
} else {
    if (existingSession.get("KOGID")) {
        
    var KOGID = existingSession.get("KOGID")
    logger.debug("the KOGID from existing session"+KOGID)
    var user = queryUserByKOGID(KOGID);
    if (user){
        var userId = user._id
    }
}
}
    
    nodeState.putShared("_id",userId);
     if (callbacks.isEmpty()) {
         //show role removal status
         if(nodeState.get("roleremovalstatus")){
    var removalSummary = nodeState.get("roleremovalstatus");
    logger.debug("role removal status found in nodestate")

 
var successCount = 0;
var failureCount = 0;

for (var i = 0; i < removalSummary.length; i++) {
if (removalSummary[i].roleremovalstatus === "success") {
    successCount++;
} else if (removalSummary[i].roleremovalstatus === "failure") {
    failureCount++;
}
}

var summaryMessage = "";
if (successCount > 0) {
summaryMessage += successCount + "_role" + (successCount > 1 ? "s" : "") + "_removed_successfully.";
}
if (failureCount > 0) {
if (summaryMessage.length > 0) summaryMessage += " ";
summaryMessage += failureCount + "_role" + (failureCount > 1 ? "s" : "") + "_failed_to_remove.";
}
logger.debug("role removal message" +summaryMessage)
// Output the summary message
callbacksBuilder.textOutputCallback(0, summaryMessage);
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
function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
        return null;
    }
}

function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {

        if(nodeState.get("unexpectederror")){
        var unexpectederror = nodeState.get("unexpectederror")
        callbacksBuilder.textOutputCallback(0, unexpectederror);
         }

        if(nodeState.get("invalidJSONError") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
        }
        if(nodeState.get("invalidRoleError") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));
        }
        if(nodeState.get("internaluser") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("internaluser"));
        }
       if(nodeState.get("rolenotremovable") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("rolenotremovable"));
       }
        callbacksBuilder.textOutputCallback(1, "2_manage_access")
        var response = formatJSON(appId,userId);
        callbacksBuilder.textOutputCallback(0, response )
        callbacksBuilder.textInputCallback("JSON Input");
        callbacksBuilder.confirmationCallback(0, ["Request Access","Remove Roles","refresh","Back to dashboard"], 1);
        
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message );
    }
    
}
function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
   
            var userInput = callbacks.getTextInputCallbacks().get(0).trim();
            if(selectedOutcome === 3){
                nodeState.putShared("invalidJSONError",null);
                nodeState.putShared("invalidRoleError",null);
                nodeState.putShared("internaluser", null);
                nodeState.putShared("rolenotremovable", null); 
                action.goTo(NodeOutcome.BACK);
            }
            if(selectedOutcome === 2){
                nodeState.putShared("invalidJSONError",null);
                nodeState.putShared("invalidRoleError",null);
                nodeState.putShared("internaluser", null);
               nodeState.putShared("rolenotremovable", null);
               action.goTo(NodeOutcome.REFRESH);
            }
            else if(selectedOutcome === 1){
                // nodeState.putShared(input,"input");
                if(validateJsonFormat(userInput)){
                    if(!isInputValid(userInput)){
                     nodeState.putShared("invalidJSONError",null);
                     nodeState.putShared("invalidRoleError",null);
                        nodeState.putShared("internaluser", null);
                      nodeState.putShared("rolenotremovable", null);
                     action.goTo(NodeOutcome.REMOVE_ROLE);
                    }
                    else{
                        nodeState.putShared("invalidRoleError","Invalid_RoleId");
                        nodeState.putShared("invalidJSONError",null);
                        nodeState.putShared("internaluser", null);
                       nodeState.putShared("rolenotremovable", null);
                        action.goTo(NodeOutcome.INVALID_ROLE);
                    }
                    
                }
                else{
                    nodeState.putShared("invalidJSONError","Invalid_JSON");
                    nodeState.putShared("invalidRoleError",null);
                    nodeState.putShared("internaluser", null);
                    nodeState.putShared("rolenotremovable", null);
                    action.goTo(NodeOutcome.INVALID_JSON);
                }
                // action.goTo(NodeOutcome.REMOVE_ROLE);
            }
            else if(selectedOutcome == 0){
                nodeState.putShared("invalidJSONError",null);
                nodeState.putShared("invalidRoleError",null);
                nodeState.putShared("internaluser", null);
                nodeState.putShared("rolenotremovable", null);
                action.goTo(NodeOutcome.REQUEST_ROLE);
        }
                
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in handleUserResponses function ::"+ error);
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
 // var missingRoles = appRoleId.filter(id => !userRoleId.includes(id));
 var matchedRoles = appRoleId.filter(id => userRoleId.includes(id));
 return (matchedRoles)
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
        var emailContact = null;
       
        // if(busApp.applicationHelpdeskContact.emailContact[0].emailAddress != null){
        //     emailContact =  busApp.applicationHelpdeskContact.emailContact[0].emailAddress;
        // }
       
        // var operationHours = null;
        
        // if(busApp.applicationHelpdeskContact.emailContact[0].operationHours != null){
        //     operationHours = busApp.applicationHelpdeskContact.emailContact[0].operationHours;
        // }
        // var phoneContact = null;
        // if(busApp.applicationHelpdeskContact.emailContact[0].phoneContact != null){
        //     phoneContact = busApp.applicationHelpdeskContact.emailContact[0].phoneContact;
        // }
        // var applicationURL = null;
        // if(busApp.applicationHelpdeskContact.applicationURL !=null){
        //      applicationURL = busApp.applicationHelpdeskContact.applicationURL;
        // }
        
        return {
          "result": [
            {
              "businessAppName": businessAppName,
              "businessAppLogo": businessAppLogo
              // "emailContact": emailContact,
              // "phoneContact": phoneContact,
              // "applicationURL":applicationURL,
              // "operationHours":operationHours
              
            }
          ]
        }
        
    } catch (error) {
        
    }
    
}

function formatJSON(appId,userId) {
    try {
        var appDetails =  getAppDetails(appId);
        var roles = getAppRole(appId);
        var roleId = roles[0];
        appResponse = JSON.parse(lib.getBusinessAppInfo(roleId));
        var businessAppName = appDetails.result[0].businessAppName;
        var businessAppLogo = appDetails.result[0].businessAppLogo;
        // var emailContact = appDetails.result[0].emailContact;
        // var phoneContact = appDetails.result[0].phoneContact;
        // var applicationURL = appDetails.result[0].applicationURL;
        // var operationHours = appDetails.result[0].operationHours;
        var roleList = []; 
        var content = [];
        var roles = JSON.stringify(matchingRoles(appId,userId));
        logger.debug("Roles are "+ roles + "Type is::"+ typeof roles)
        var matchedrole = JSON.parse(roles);
        logger.debug("matchedrole array length ::"+ matchedrole.length)
        // logger.debug("JSON.parse(matchedrole)"+JSON.parse(matchedrole))
        // nodeState.putShared("roles",JSON.parse(matchedrole));
        for (var i=0; i < matchedrole.length; i++){
            var currentRoleId = matchedrole[i];
            logger.debug("currentRoleId is "+ currentRoleId)
            var response = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id/ eq "' + currentRoleId + '"' }, [""]);
            logger
            if(response.result[0].content){
                 content = response.result[0].content
            }
    
            logger.debug("Response is "+response);
            var roleEntry = {
                "roleId": currentRoleId,
                "content": content 
                
            };
            roleList.push(roleEntry);
            
        }
     logger.debug("finalOutput is before "+"finalOutput")
    var finalOutput = {
    "businessAppName": businessAppName,
    "businessAppLogo": businessAppLogo,
    "roles": roleList,
    "application":appResponse.application    
    };
    logger.debug("finalOutput is "+"finalOutput")
    return (JSON.stringify(finalOutput));
        
           
    } catch (error) {
        
    }
}

function isInputValid(input) {
    var response = JSON.parse(input);
    var roleIds = response.roleId;
    nodeState.putShared("roleIds",roleIds)
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
  // Check if the input is an object and not null
logger.debug("JSON is "+json)
  var json = JSON.parse(json)
    logger.debug("JSON is "+json)
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  // Check that the object has only one key
  const keys = Object.keys(json);
  if (keys.length !== 1 || keys[0] !== 'roleId') {
    return false;
  }

  // Check that roleId is an array
  if (!Array.isArray(json.roleId)) {
    return false;
  }

  // Check that every item in the roleId array is a string
  for (var i = 0; i < json.roleId.length; i++) {
    if (typeof json.roleId[i] !== 'string') {
      return false;
    }
  }

  // If all checks passed, return true
  return true;
}


