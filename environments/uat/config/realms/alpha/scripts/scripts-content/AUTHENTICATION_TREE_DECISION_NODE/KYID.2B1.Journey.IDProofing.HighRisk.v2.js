var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: High Risk",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.HighRisk",
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
     var jsonobj = {};
    try {
        ridpReferenceID  = nodeState.get("ridpReferenceID");
        var jsonobjpageHeader = {"pageHeader":"IdentityVerificationError"};
        jsonobj["Flow"]=nodeState.get("flowName");
        //jsonobj["Flow"]="";
        logger.debug("errorMessage " + nodeState.get("errorMessage"))
        jsonobj["ErrorMsg"] =nodeState.get("errorMessage");
        jsonobj["HelpDeskContactId"] = getHepdeskContactId() || ""
        jsonobj["TransactionId"] = ridpReferenceID;
        jsonobj["TransactionDateTime"]=dateTime;
        jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress") || nodeState.get("mail");
        // jsonobj["LexisNexisRequest"] = nodeState.get("userInfoJSON") || "";
        jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
        jsonobj["Context"] = nodeState.get("Context") || "";
        jsonobj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
        jsonobj["userLexID"] = nodeState.get("uuid") || "";
        jsonobj["riskIndicator"] = nodeState.get("riskIndicator") || "";
        jsonobj["riskIndicatorDetails"] = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : "";
        jsonobj["profileAssuranceLevel"] =  nodeState.get("assuranceLevel") || "";
        jsonobj["currentRequestAssuranceLevel"] =  nodeState.get("currentRequestAssuranceLevel") || "";
        var refernceObj = {"referenceId": ridpReferenceID}
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobjpageHeader));
        callbacksBuilder.textOutputCallback(0, JSON.stringify(jsonobj));
        //callbacksBuilder.textOutputCallback(0, JSON.stringify(refernceObj));
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in CreateAccount Script: " + error.message);
        action.goTo("error");
    }
}


main()



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