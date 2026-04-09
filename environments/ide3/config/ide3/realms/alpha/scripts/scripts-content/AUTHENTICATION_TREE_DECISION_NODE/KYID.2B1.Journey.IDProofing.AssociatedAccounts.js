var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Associated Accounts",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AssociatedAccounts",
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
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Executing CreateAccount Script");
    var ridpReferenceID = null;
    var associatedAccounts = null;
    var maskedEmailList = []
    var response = null;
    try {
        ridpReferenceID = nodeState.get("ridpReferenceID");
        associatedAccounts = nodeState.get("associatedAccounts");
        var jsonobj = {"pageHeader":"IdentityVerificationError"};

        if(nodeState.get("searchEmailArray") || nodeState.get("associatedAccounts")){
            associatedAccounts = nodeState.get("searchEmailArray") || nodeState.get("associatedAccounts");
            nodeLogger.debug("emailIds Type is --> "+Array.isArray(associatedAccounts))
            associatedAccounts.forEach(val=>{
                var lastLetter = val.split("@")[0]
                lastLetter = lastLetter.slice(-2)
                var maskedEmail = val[0] + "****" + lastLetter + "@" + val.split("@")[1]
                maskedEmailList.push(maskedEmail)
            })
            nodeLogger.debug("Masked Email IDs are "+ maskedEmailList)
            nodeState.putShared("searchEmailArray",maskedEmailList)
        }

        response = { associatedEmailIds: maskedEmailList }
        // // callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        // // callbacksBuilder.textOutputCallback(0, JSON.stringify(response));
        var jsonobjpageHeader = {"pageHeader":"5_RIDP_Sync_SIH_Display_Email"};
        // jsonobj["Flow"]=nodeState.get("flowName");
        // jsonobj["ErrorMsg"] =nodeState.get("errorMessage");
        // jsonobj["HelpDeskContactId"] ="b93154a8-a55f-4e4e-8769-bdad375eb852";
        // jsonobj["TransactionId:"] = ridpReferenceID;
        // jsonobj["TransactionDateTime"]=dateTime;
        // jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || "";
        // // jsonobj["LexisNexisRequest"] = nodeState.get("userInfoJSON") || "";
        // jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        // jsonobj["associatedAccounts"] = nodeState.get("maskedEmailList") || "";
        var refernceObj = {"referenceId": ridpReferenceID}
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobjpageHeader));
        callbacksBuilder.textOutputCallback(0, JSON.stringify(response));
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in CreateAccount Script: " + error.message);
        action.goTo("error");
    }
}


main()