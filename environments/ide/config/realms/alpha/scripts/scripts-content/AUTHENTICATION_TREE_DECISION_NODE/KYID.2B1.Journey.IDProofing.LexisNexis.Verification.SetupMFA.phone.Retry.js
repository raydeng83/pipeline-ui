var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: LexisNexis Email Verification Retry",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexis.Verification.Email.Retry",
    timestamp: dateTime,
    end: "Node Execution Completed"
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

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");  
    try {
        if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ error);
    }
}

main();

// Function to request Callbacks
function requestCallbacks() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    var risk = nodeState.get("mailRisk");
    var jsonobj = {};
    try {
        var pageHeader= {"pageHeader": "IdentityVerificationError"};
        jsonobj["Flow"]=nodeState.get("flowName") || "" ;
        jsonobj["ErrorMsg"] =nodeState.get("errorMessage") || "" ;
        jsonobj["Context"] = nodeState.get("flowContext") || "" ; 
        jsonobj["referenceNumber"] = nodeState.get("ridpReferenceID") || "" ;
        jsonobj["HelpDeskContactId"] = getHepdeskContactId() || ""
        
         if(risk && risk.toLowerCase() === "high") {
             callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
             callbacksBuilder.textOutputCallback(0, JSON.stringify(jsonobj));
             if(nodeState.get("verification") === "phone"){
                 var mfaOptions = ["Use a different number"];
             }else{
                 var mfaOptions = ["Use a different email"];
             }
             
            nodeState.putShared("verifiedTelephoneNumber", null);
            var promptMessage = "how_would_you_like_to_retry";
            callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}

// Function to handle User Responses
function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var response = null;
    var selectedOutcome = null;
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.error("Selected Outcome: " + selectedOutcome);
        if(selectedOutcome === 0){
            response = callbacks.getChoiceCallbacks().get(0)[0];
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Response: " + response);
                if(response === 0) {
                    nodeState.putShared("lexRetry", true);
                    nodeState.putShared("differentemailretrylimit","true");
                    nodeState.putShared("emailretrylimit",null);
                    nodeState.putShared("changeEmailCount",null);
                    nodeState.putShared("errorMessage", null)
                    action.goTo("retry");
                }else{
                    action.goTo("error")
                }

        }else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "back button clicked");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error handleUserResponses Function " + error.message);
        action.goTo("error");
    }  
} 

function getHepdeskContactId (){
    try {
        var appName = systemEnv.getProperty("esv.ridp.helpdesk.name") || "KYID Helpdesk"
        var userQueryById = openidm.query("managed/alpha_kyid_helpdeskcontact", {
                "_queryFilter": 'name eq "' + appName + '"'
            }, []);
        if(userQueryById && userQueryById.resultCount>0){
            return userQueryById.result[0]._id
        }
        else{
            return ""
        }
        
    } catch (error) {
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in KYID.2B1.Journey.IDProofing.HighRisk getHepdeskContactId " + error);
         return ""
    }

}