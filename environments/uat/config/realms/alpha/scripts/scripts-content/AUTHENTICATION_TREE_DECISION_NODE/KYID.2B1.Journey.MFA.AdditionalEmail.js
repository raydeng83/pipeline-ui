var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");
var phoneStatus = nodeState.get("phoneStatus");
libError = require("KYID.2B1.Library.Loggers");
  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Alternate Email Collection",
      script: "Script",
      scriptName: "KYID.2B1.Journey.MFA.AdditionalEmail",
      errorId_emailealidation:"errorID:KYID007",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      ERROR: "error",
      BACK:"back",
      DUPLICATE: "duplicate",
      SAME: "same primary email",
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
    var process ="SelfRegistration";
    var pageHeader= "3_additional_alternate_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    var mfaMethod = nodeState.get("MFAValue");
    var usrKOGID = nodeState.get("KOGID");
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
            nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
             nodeState.putShared("errorMessage",null);
             callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
        }
        var headerObj={
            "pageHeader": "3_additional_alternate_email"
            }
        callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
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
        var errMsg = {};
        nodeState.putShared("verification", "mail")
        logger.debug("alternateEmail is :: "+ value)
        nodeState.putShared("alternateEmail", value);
        nodeState.putShared("alternateEmailRIDP", value);
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 1){
            nodeState.putShared("MaxLimitReachedSkipEmail","false");
            nodeState.putShared("errorMessage",null);
            nodeState.putShared("phoneStatus",null);
            nodeState.putShared("backfrommail","true");
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
            
        }
        else if(selectedOutcome === 0){
               var primaryEmail = nodeState.get("mail");
                if(primaryEmail.toLowerCase() === value.toLowerCase()){
                   errMsg["code"] = "WRN-REG-EML-001";
                   errMsg["message"] = libError.readErrorMessage("WRN-REG-EML-001"); 
                    nodeState.putShared("errorMessage", JSON.stringify(errMsg));
                    action.goTo(NodeOutcome.SAME);
            }
            else{
            var checkEmail = isValidEmail(value)
            if(checkEmail == true){
                nodeState.putShared("addtionalEmailFlag","true")
                nodeState.putShared("MaxLimitReachedSkipEmail","true");
                nodeState.putShared("errorMessage",null);
                if(!lookupInMFAObject(usrKOGID, value, mfaMethod)) {
                     nodeState.putShared("updateMFAMethod", "true");
                     nodeState.putShared("MFAMethod", "SECONDARY EMAIL");
                     action.goTo(NodeOutcome.NEXT);
                }
                else{
                    errMsg["code"] = "ERR-INP-EML-000";
                    errMsg["message"] = "This email address is already registered as a recovery method. Please use a different email address."; 
                    nodeState.putShared("errorMessage", JSON.stringify(errMsg));
                    action.goTo(NodeOutcome.DUPLICATE);

                }
            }
            else{
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "email validation failed ::"+value+nodeConfig.errorId_emailealidation);
                 errMsg["code"] = "ERR-INP-EML-000";
                 errMsg["message"] = libError.readErrorMessage("ERR-INP-EML-000"); 
                 nodeState.putShared("errorMessage",JSON.stringify(errMsg));
                action.goTo(NodeOutcome.INVALID_EMAIL);
            }
            }           
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

function lookupInMFAObject(usrKOGID, usrMfaValue,mfaMethod) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});
	if (mfaMethodResponses.result.length>0){
       for(i=0;i<mfaMethodResponses.result.length;i++){
           var mfaMethodResponse = mfaMethodResponses.result[i];
		   if(mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue)===0 && 
				mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE")===0 && mfaMethodResponse["MFAMethod"].localeCompare(mfaMethod)===0) {
			   return true;
		   }
	   }
	}
	return false;
}
