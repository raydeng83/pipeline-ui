/**
 * Script: KYID.2B1.Journey.ListVerifiedPrerequisites
 * Description: This script is used to obtain list of verified prerequisites.
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
  timestamp: dateTime,
  serviceType: "Journey",
  serviceName: "kyid_2b1_VerifiedPrerequisites",
  node: "Node",
  nodeName: "List Prerequisites",
  script: "Script",
  scriptName: "KYID.2B1.Journey.ListVerifiedPrerequisites",
  begin: "Begin Function Execution",
  function: "Function",
  functionName: "",
  end: "Function Execution Completed",
};

// Node outcomes
var nodeOutcome = {
  ERROR: "error",
  RETRY: "retry",
  REVERIFY: "reverify",
  VIEWPREQUISITEDATA: "viewpreqdata"  
};

function getIdFromUsername(username) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: 'userName eq "' + username + '"',
      },
      ["_id"]
    );
    logger.debug("userQueryResult is" + JSON.stringify(userQueryResult));
    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var id = userQueryResult.result[0]._id || null;
      logger.debug("id found - " + id);
      nodeState.putShared("userId",id);
      nodeState.putShared("userIDinSession",id);
      return id;
    } else {
      logger.error("userName not found");
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}

function queryPrerequisiteRequestStatus(userId, status) {
  logger.debug("Inside queryPrerequisiteRequestStatus");

  var recordRequest = null;
  var recordRequestJSONObj = {};

  try {
    recordRequest = openidm.query(
      "managed/alpha_kyid_request",
      {
        _queryFilter:
          'requester eq "' + userId + '" AND status eq "' + status + '"',
      },
      ["type", "status", "contextid"]
    );
    logger.debug(
      "Successfully queried record in alpha_kyid_request managed object :: " +
        JSON.stringify(recordRequest)
    );
    recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
    return recordRequestJSONObj;
  } catch (error) {
    logger.error("failure in " + error);
  }
}

// To get list of all the form pages data which are completed and submitted by the user.
function getSubmittedPrereqPagesDetails(uuid, type) {
  var source = "Portal";
  var recordSubmittedPreqreqPage = null;
  var recordSubmittedPreqreqPageArray = null;
  var extIDNResponse = null;
  var selectedOutcome= null;

  logger.debug("uuid is "+uuid +" type is "+ type);
  try {
    if (uuid != null) {
      recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity",{_queryFilter: 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'source eq "' + source + '"'},["attributeName", "attributeValue", "prereqType", "pageNumber"]);
    } else {
      recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity",{_queryFilter: 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"'});
    }
    logger.debug("recordSubmittedPreqreqPage is " + JSON.stringify(recordSubmittedPreqreqPage.result));
    return recordSubmittedPreqreqPage.result;     
  } catch (error) {
    logger.error("getSubmittedPrereqPagesDetails error is " + error);
  }
}

// MAIN
function main() {
  var userId = null;
  var txid = null;
  var verifiedRequests = null;
  var username = null;
  var verifiedRequestsJSONOutput = null;
  var entry = null;
  var enteredForm = null;
  var entryHasValidKeys = false;
  var entryHasValidName = false;
  var enteredFormName = null;
  var userDetailsFromExtIdenitity = null;
  var selectedOutcome = null;
  var viewPage = Number(1);

  try {
  nodeLogger = require("KYID.2B1.Library.Loggers");
  nodeLogger.log("error", nodeConfig, "begin", txid)
  username = nodeState.get("username");
  txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
  logger.debug("username in session is - " + username);
  nodeLogger.log("error", nodeConfig, "mid", txid, "username in session is - "+username);
      
    if (username) {
        userId = getIdFromUsername(username);
        nodeLogger.log("error", nodeConfig, "mid", txid, "userID in session is -" + userId);
        verifiedRequests = queryPrerequisiteRequestStatus(userId, "COMPLETED");
        nodeState.putShared("ContextId", verifiedRequests[0].contextid)
        nodeState.putShared("prereqContextID", verifiedRequests[0].contextid)
        nodeLogger.log("error", nodeConfig, "mid", txid, "verifiedRequests is - " + JSON.stringify(verifiedRequests));
    } else {
        nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid username");
    }

        if (callbacks.isEmpty()) {
            logger.debug("inside isEmpty")
            const itemsArray = verifiedRequests.map((item) => ({
              Name: item.type,
              Type: "",
              Status: item.status,
            }));
        
            verifiedRequestsJSONOutput = {result: itemsArray};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(verifiedRequestsJSONOutput));
            callbacksBuilder.textInputCallback("Enter the form type to view");
            callbacksBuilder.confirmationCallback(0, ["Submit"], 0);
          }else {
            selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if(selectedOutcome === 0){
                enteredForm = JSON.parse(callbacks.getTextInputCallbacks().get(0));
                nodeLogger.log("error", nodeConfig, "mid", txid, "enteredForm is - "+JSON.stringify(enteredForm));
                entry = Array.isArray(enteredForm) && enteredForm.length === 1 ? enteredForm[0] : nodeLogger.log("error", nodeConfig, "mid", txid, "enteredForm is not a valid Array");
                logger.debug("entry is - " + JSON.stringify(entry));
                entryHasValidKeys =Object.keys(entry).length === 2 &&  entry.hasOwnProperty("Name") && entry.hasOwnProperty("action");
                entryHasValidName = verifiedRequests.some((item) => item.type === entry.Name);
                nodeLogger.log("error", nodeConfig, "mid", txid, "hasValidKeys is - " + entryHasValidKeys+"nameExists is - " + entryHasValidName);
                if (entryHasValidKeys && entryHasValidName && entry.action.toLowerCase() === "view") {
                  enteredFormName = entry["Name"];
                  if (enteredFormName!= null && enteredFormName) {
                      userDetailsFromExtIdenitity = getSubmittedPrereqPagesDetails(userId,enteredFormName);
                      nodeState.putShared("viewPreqData",JSON.stringify(userDetailsFromExtIdenitity));
                      action.goTo(nodeOutcome.VIEWPREQUISITEDATA);
                  } else {
                    nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid form Name entered");
                    nodeState.putShared("retry",true);
                    action.goTo(nodeOutcome.RETRY);
                  }
                 } else if(entryHasValidKeys && entryHasValidName && entry.action.toLowerCase() === "reverify"){
                    enteredFormName = entry["Name"];
                    nodeState.putShared("prereqtype",enteredFormName)
                  if (enteredFormName!= null && enteredFormName) {
                      userDetailsFromExtIdenitity = getSubmittedPrereqPagesDetails(userId,enteredFormName);
                      nodeState.putShared("viewPreqData",JSON.stringify(userDetailsFromExtIdenitity));
                      nodeState.putShared("viewPage",viewPage);
                      action.goTo(nodeOutcome.REVERIFY)
                  } else {
                    nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid form Name entered");
                    nodeState.putShared("retry",true);
                    action.goTo(nodeOutcome.RETRY);
                  }
                 } else {
                  nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid entry ");
                  nodeState.putShared("retry",true);
                  action.goTo(nodeOutcome.RETRY);
                 }
             }   
          }
    } catch (error) {
      nodeLogger.log("error", nodeConfig, "end", txid, "Error in try is "+error);
      action.goTo(nodeOutcome.ERROR);
    }
}

// Invoke Main Function
main();