var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.DisplayFARS",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

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
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = null;
    var transactionRecord = null;
    var referenceId = null;
    var helpDeskContact = null;
    var requiredDocuments = null;
    var displayFARS = {
        referenceId:referenceId,
        submitedUserInfo : userInfoJSON,
        helpDeskContact:helpDeskContact,
        requiredDocuments:requiredDocuments
    }

    var refId= nodeState.get("refId") || nodeState.get("ridpReferenceID");
    
    var userInfo = nodeState.get("userInfoJSON") || {};
    //userInfo["telephoneNumber"] = nodeState.get("telephoneNumber") || nodeState.get("orig_telephoneNumber") || "";

    
    userInfo.hubReferenceNumber = refId;
    nodeState.putShared("userInfoJSON",userInfo)

    
    if(nodeState.get("userInfoJSON")){
        displayFARS.submitedUserInfo = nodeState.get("userInfoJSON")
    }
    if(nodeState.get("helpdeskContact")){
        displayFARS.helpDeskContact = nodeState.get("helpdeskContact")
    }
    if(nodeState.get("documents")){
        displayFARS.requiredDocuments = nodeState.get("documents")
    }
    if(nodeState.get("refId")){
        displayFARS.referenceId = nodeState.get("refId")
    }

    //displayFARS.helpDeskDetails = "b93154a8-a55f-4e4e-8769-bdad375eb852"


    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        var pageHeader= {"pageHeader": "Display_1_FARS"};
        // var pageHeader= "2_add_methods";
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
         

        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
            callbacksBuilder.textOutputCallback(0,JSON.stringify(displayFARS));
        }else {
            callbacksBuilder.textOutputCallback(0,JSON.stringify(displayFARS));
        }
        // callbacksBuilder.textInputCallback("Response")
        // allbacksBuilder.textInputCallback("Last Name");
        callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                nodeState.putShared("LexisNexisattempt2","true")
                nodeState.putShared("LexisNexisFARS","true")
                if(nodeState.get("patchPrereq") === "false"){
                    action.goTo("continue")
                }else{
                    action.goTo("LexisNexis")
                }
                
            }
            else{
                action.goTo("callFARS")
            }
        }
    } catch (error) {
        logger.error(
            (typeof transactionid !== "undefined" ? transactionid : "") + "::" +
            (nodeConfig && nodeConfig.timestamp ? nodeConfig.timestamp : "") + "::" +
            (nodeConfig && nodeConfig.node ? nodeConfig.node : "") + "::" +
            (nodeConfig && nodeConfig.nodeName ? nodeConfig.nodeName : "") + "::" +
            (nodeConfig && nodeConfig.script ? nodeConfig.script : "") + "::" +
            (nodeConfig && nodeConfig.scriptName ? nodeConfig.scriptName : "") + "::" +
            (nodeConfig && nodeConfig.begin ? nodeConfig.begin : "") + "::" +
            "error occurred in handleUserResponses function ::" + error +
            (typeof mail !== "undefined" ? mail : "")
        );
        nodeState.putShared("validationMessage", "invalid_input");
        action.goTo("error");
    }
}

