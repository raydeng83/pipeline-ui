
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

//Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Account Recovery Forgot Email",
    script: "Script",
    scriptName: "kyid.2B1.Journey.ForgotEmail.ShowVerifyIdentityOptions",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"  
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
    }
};




function showMFAOptions() {
    try {
        var headerObj={
            "pageHeader": "1_forgot_email"
        }
        callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Show MFA OPTIONS");
        //callbacksBuilder.textOutputCallback(0, "How would you like to verify identity?");
        callbacksBuilder.choiceCallback("Select", newMFAOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }

    }

    catch(e){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Error in displaying VI options :: " + e);
    }
        

}
       

// Evaluate user's selection and return string indicating next node
function evaluateMFASelection() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; 
        var outcome = callbacks.getChoiceCallbacks().get(0)[0];
        
        if (selectedOutcome === 1) {
            nodeState.putShared("anotherFactor", "anotherFactor");
            return "True";
        }

        var selectedMethod = newMFAOptions[outcome];

        if (selectedMethod === "ALTERNATE_EMAIL") {
            nodeState.putShared("selectedMethod", "email");
        } else if (selectedMethod === "PHONE") {
            logger.debug("user selected Phone");
            nodeState.putShared("selectedMethod", "phone");
        } else if (selectedMethod === "IDENTITY_PROOFING") {
            nodeState.putShared("selectedMethod", "identity_proofing");
        } else if (selectedMethod === "HELPDESK") {
            nodeState.putShared("selectedMethod", "helpdesk");
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "No Method Selected");
        }

        return "True";
    } 
    catch (e) {
        logger.error("Error in evaluateMFASelection: " + e);
        nodeState.putShared("anotherFactor", null);
        return "True";
    }
}

try {

     var lib = require("KYID.2B1.Library.GenericUtilsCopy");
    var obj = "KYID Helpdesk";
    var helpdeskItem = lib.getHelpdeskContactInfo(obj);
    var contacts = JSON.parse(helpdeskItem);

    var helpDeskNumber = contacts.helpDeskNumber;


    var lib = require("KYID.Library.FAQPages");
    var process ="ForgotEmail";
    var pageHeader= "1_forgot_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    
    nodeState.putShared("IsJourneyForgotEmail",true);
    if(nodeState.get("backretrylimit")== "true") {
        nodeState.putShared("gobackcount", null);
        nodeState.putShared("backretrylimit","false");  
    }
    if(nodeState.get("phonegoBackCount"!=null)){
        nodeState.putShared("phonegoBackCount", null);
    }
    if(nodeState.get("resendsmsretryCount")!=null){
        nodeState.putShared("resendsmsretryCount", null);
    }
    if(nodeState.get("telephoneNumber")){
        nodeState.putShared("telephoneNumber", null);
    }
    if(nodeState.get("alternateEmail")){
        nodeState.putShared("alternateEmail", null);
    }

    if(nodeState.get("phoneVerified")){
        nodeState.putShared("phoneVerified",null);
    }
    
   // var newMFAOptions = [ "PHONE", "ALTERNATE_EMAIL","IDENTITY_PROOFING", "HELPDESK ["+ helpDeskNumber +"]"] ;
       var newMFAOptions = [ "PHONE", "ALTERNATE_EMAIL","IDENTITY_PROOFING", "HELPDESK"] ;
    //var newMFAOptions = [ "PHONE", "ALTERNATE_EMAIL", "HELPDESK"] ; // NR: Removed RIDP for 2/6 Release
    
    
    if (callbacks.isEmpty()) {
        showMFAOptions();
    } else {
        var outcome = evaluateMFASelection();
        action.goTo(outcome);
        
    }
} catch (e) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Main script error: " + e);
    action.goTo(NodeOutcome.TRUE);
}
