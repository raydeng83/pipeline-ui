var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var phoneStatus = nodeState.get("phoneStatus")
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");
logger.debug("phoneStatus"+phoneStatus);
  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Alternate Email Collection",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Registration_Acceptance_PhoneRegistration.SelfRegistration.AdditionalEmail",
      errorId_emailealidation:"errorID:KYID007",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      ERROR: "error",
      SKIP:"skip",
      BACK:"back",
      INVALID_EMAIL:"invalidEmail",
      MAX_LIMIT:"max limit"
      
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
  

// Main execution
try {
    var lib = require("KYID.Library.FAQPages");
    if(nodeState.get("IsJourneyForgotEmail")){
    var process ="ForgotEmail";
    var pageHeader= "2_forgot_email_alternate_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

    }
    else{
    var process ="SelfRegistration";
    var pageHeader= "3_additional_alternate_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    }
    
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
      }
    
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in main execution :: "+  error );
    action.goTo(NodeOutcome.ERROR);
    
}

function requestCallbacks() {
    try {
         if (nodeState.get("errorMessage") != null) {
             var error = nodeState.get("errorMessage");
             callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
        }

        if(nodeState.get("IsJourneyForgotEmail")){
             var headerObj={
            "pageHeader": "2_forgot_email_alternate_email"
            }
         callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));

        }
        else{
            var headerObj={
            "pageHeader": "3_additional_alternate_email"
            }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
             //callbacksBuilder.textOutputCallback(1, "3_additional_alternate_email");
        }
       
         /*if(nodeState.get("alternateEmail")!= null){
           callbacksBuilder.textInputCallback("alternate_mail",nodeState.get("alternateEmail"));  
         }
         else{
         callbacksBuilder.textInputCallback("alternate_mail");
         }
        //callbacksBuilder.textInputCallback("alternate_mail");
        */
        if(nodeState.get("alternateEmail")){
            var alternateEmail = nodeState.get("alternateEmail")
            callbacksBuilder.textInputCallback("alternate_mail",alternateEmail);
        }else {
            callbacksBuilder.textInputCallback("alternate_mail");
        }
        
        if(phoneStatus ==="true"){
        callbacksBuilder.confirmationCallback(0, ["Next", "Back","Skip"], 1);
        }
        else{
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        }
        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
    } catch (error) {
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in requestCallbacks function :: "+  error );
        action.goTo(NodeOutcome.ERROR);
        
    }
    
}
function handleUserResponses() {
    try {

        var value = callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("alternateEmail", value);
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 1){
            nodeState.putShared("MaxLimitReachedSkipEmail","false");
            nodeState.putShared("errorMessage",null);
            nodeState.putShared("Alternate_Email_Verification","back");
            nodeState.putShared("phoneStatus",null);
            if(nodeState.get("alternateemailbackcount")){
                    var alternateemailbackcount = nodeState.get("alternateemailbackcount")
                } else {
                    var alternateemailbackcount = 1;
                }
            
                if (alternateemailbackcount > retryLimit) {
                    nodeState.putShared("maxlimitforphoneback","true")
                    action.goTo("max limit");
                } else {
                    alternateemailbackcount++
                    nodeState.putShared("alternateemailbackcount", alternateemailbackcount);
                    nodeState.putShared("Back", true);
                    nodeState.putShared("anotherFactor",null)
                    action.goTo(NodeOutcome.BACK);
                }
            // action.goTo("back");
            
        }
        else if(selectedOutcome === 0){
            var checkEmail = isValidEmail(value)
            if(checkEmail == true){
                nodeState.putShared("addtionalEmailFlag","true")
                nodeState.putShared("MaxLimitReachedSkipEmail","true");
                nodeState.putShared("errorMessage",null);
                // action.goTo("next");
                action.goTo(NodeOutcome.NEXT);
                
            }
            else{
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "email validation failed ::"+value+nodeConfig.errorId_emailealidation);
                // action.goTo("invalidEmail");
                action.goTo(NodeOutcome.INVALID_EMAIL);
            }

            
        }
        else if(phoneStatus === "true"){
            nodeState.putShared("addtionalEmailFlag","false")
            nodeState.putShared("MaxLimitReachedSkipEmail","false");
            nodeState.putShared("verifiedAlternateEmail",null);
            nodeState.putShared("errorMessage",null);
            nodeState.putShared("alternateEmail",null);
            nodeState.putShared("Alternate_Email_Verification",null)
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Step to add additional recovery method is skipped ::"+nodeState.get("verifiedPrimaryEmail"));
            // action.goTo("skip");
            action.goTo(NodeOutcome.SKIP);
        }

        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in handleUserResponses function :: "+  error );
        action.goTo(NodeOutcome.ERROR);
        
    }
    
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);    
}
