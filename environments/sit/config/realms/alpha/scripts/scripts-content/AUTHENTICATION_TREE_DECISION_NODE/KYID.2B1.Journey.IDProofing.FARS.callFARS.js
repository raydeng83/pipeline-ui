var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.MCIApiCall",
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
    var userInfoJSON = nodeState.get("userInfoJSON");
    var transactionRecord = null;
    var helpDeskContact = null;
    var visitInPerosnalInfo = null;

    var userInfoJSON = nodeState.get("userInfoJSON") || {};
    //userInfoJSON["mobileNumber"] = nodeState.get("telephoneNumber") || nodeState.get("orig_telephoneNumber") || "";

    var callFARS = {
            "apiCalls":[
                {
                   	"method" :"FARS",
                	"action" : "verify",
                            
                }
            ],
            "collectedUserInfo": userInfoJSON
    }
    if(nodeState.get("transcationRecord")!== null){
        transactionRecord = nodeState.get("transcationRecord");
        if(transactionRecord.helpDeskContact){
            helpDeskContact = transactionRecord.helpDeskContact;
        }
        if(transactionRecord.visitInPerosnalInfo){
            visitInPerosnalInfo = transactionRecord.visitInPerosnalInfo;
        }
    }
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

        // var pageHeader= "2_add_methods";
         var pageHeader= {"pageHeader": "FARS_VERIFY"};


        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(callFARS));
       
      
        callbacksBuilder.textInputCallback("Response");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);



    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}


function handleUserResponses() {
    try {
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var apiResponse = callbacks.getTextInputCallbacks().get(0);
        logger.debug("validateObject(apiResponse):: " + typeof apiResponse);
        logger.debug("validateObject(apiResponse):: " + validateObject(apiResponse));

        if (typeof apiResponse === "string") {
            try {
                apiResponse = JSON.parse(apiResponse);
            } catch (e) {
                logger.debug("Error parsing apiResponse: " + e);
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }
        }
        logger.debug("KYID.2B1.Journey.IDProofing.APICAllCSM response is --> " + JSON.stringify(apiResponse));
        if (selectedOutcome === 0) {
            nodeState.putShared("validationErrorCode", null);
            logger.debug("KYID.2B1.Journey.IDProofing.API CAllCSM response is --> " + apiResponse.status);
            if (
                apiResponse.status &&
                typeof apiResponse.status === "string" &&
                apiResponse.status.toLowerCase() === "success"
            ) {
                nodeState.putShared("validationMessage", null);
                nodeState.putShared("allFARS", "success");
                nodeState.putShared("prereqStatus","COMPLETED")
                nodeState.putShared("completedAttemp","2")
                action.goTo("success");
            } else if (
                apiResponse.status &&
                typeof apiResponse.status === "string" &&
                apiResponse.status.toLowerCase() === "failed"
            ) {
                if (nodeState.get("context") === "appEnroll") {
                    nodeState.putShared("validationMessage", null);
                    nodeState.putShared("callFARSFailed","true")
                    nodeState.putShared("prereqStatus","PENDING")
                    action.goTo("displayFARS");
                }
            } else {
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
            }
        }  
        
    } catch (error) {
        logger.debug(
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
function validateObject(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return true;
        }
    }

    return true;
}

