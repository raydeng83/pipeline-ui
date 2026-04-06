var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Unable To Verify",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Manage.Profile.UnableToVerify",
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


function main(){
    var ridpReferenceID = null;
    var jsonobj = {};
    try {
        
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main function");
        var pageHeader = {"pageHeader":"IdentityVerificationError"};
        ridpReferenceID  = nodeState.get("ridpReferenceID");
        callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
            if(nodeState.get("flowState") && nodeState.get("flowState") === "resumeappenrollment"){
            jsonobj["Flow"]= "resumeappenrollment"
        }else{
            jsonobj["Flow"]= nodeState.get("flowName")
        }
        
        jsonobj["ErrorMsg"] =nodeState.get("errorMessage");
        //sonobj["ErrorMsg"] ="We are unable to verify your identity based on the submitted information. Please contact KYID Help desk with the following reference code for further assistance."
        jsonobj["HelpDeskContactId"] =  getHepdeskContactId() || ""
        jsonobj["TransactionId"] = ridpReferenceID;
        jsonobj["TransactionDateTime"]=dateTime;
        jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress");
        jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
        //jsonobj["Context"] = nodeState.get("Context") || "";
        if(nodeState.get("context") === "loginPrereq" || (nodeState.get("flowState") && nodeState.get("flowState") === "resumeappenrollment")){
            jsonobj["Context"] = "";
        }else{
            jsonobj["Context"] = nodeState.get("context") || "";
        }
        jsonobj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
        jsonobj["userLexID"] = nodeState.get("uuid") || "";
        jsonobj["riskIndicator"] = nodeState.get("riskIndicator") || "";
        jsonobj["riskIndicatorDetails"] = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : "";
        jsonobj["inactiveUserAccounts"] = nodeState.get("inactiveUserAccounts") ? JSON.parse(nodeState.get("inactiveUserAccounts")) : "";
        var refernceObj = {"referenceId": ridpReferenceID}
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main Function" + error.message);
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