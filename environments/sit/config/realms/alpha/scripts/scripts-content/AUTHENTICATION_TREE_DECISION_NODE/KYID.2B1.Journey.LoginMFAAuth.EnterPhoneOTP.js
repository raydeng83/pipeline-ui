var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var autoTesting = systemEnv.getProperty("esv.automation.testing").toLowerCase();
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCheck",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginMFAAuth.EnterPhoneOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another Method",
    EXPIRED: "expired",
    RESEND_SMS: "Via SMS",
    RESEND_VOICE: "Via voice",
    errorId_InvalidPhoneOTP:"errorID::KYID017",
    FAILED: "false",
    EMPTY_OTP: "BlankOTP",
    MAX_LIMIT: "MaxLimit",
    ERROR:"error",
    BACK_LIMIT:"backLimit"
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
};


function getDisplayMessage() {
    var nodeStateNumber = nodeState.get("telephoneNumber");
    var boldoutput = nodeStateNumber.substring(0, nodeStateNumber.length-10) + " XXX-XXX-" + nodeStateNumber.slice(-4)
    var displayMessage = "A_six-digit_verification_code_sent_to " + boldoutput.bold() + ". Enter_the_verification_code_provided_to_verify _your_mobile_number."
    return displayMessage
}


// Function to handle callback requests
function requestCallbacks() {
    try {    
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }

            if (nodeState.get("resendSMS") != null) {
                var resendSMS = nodeState.get("resendSMS");
                callbacksBuilder.textOutputCallback(1,resendSMS)
            }

            if (nodeState.get("resendVoice") != null) {
                var resendVoice = nodeState.get("resendVoice");
                callbacksBuilder.textOutputCallback(1,resendVoice)
            }

            if (nodeState.get("errorMessage_BlankOTP") != null) {
                var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
            }
         if (nodeState.get("errorMessage_ExpiredOTP") != null) {
                var errorMessage_ExpiredOTP = nodeState.get("errorMessage_ExpiredOTP");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_ExpiredOTP+`</div>`)
            }
            callbacksBuilder.textOutputCallback(0,"verify_your_mobile_number")
            callbacksBuilder.textOutputCallback(0,getDisplayMessage())
            callbacksBuilder.textOutputCallback(0,"*_indicates_a_required_field")
            callbacksBuilder.textInputCallback("enter_verification_code*");
            callbacksBuilder.confirmationCallback(0, ["Verify", "Resend Via SMS", "Resend Via voice", "Back"], 0);
    } catch (error) {
        nodeLogger.error(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);

    }
}


// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getTextInputCallbacks().get(0).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the handle user response callback ::");
        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);

        var expiredPassword = nodeState.get("oneTimePasswordTimestamp")

        if (selectedOutcome === 3) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("resendSMS", null)
            nodeState.putShared("resendVoice", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("resendVoice", null)
            nodeState.putShared("resendSMS", null)   
            nodeState.putShared("MFAMethod", null)
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("MFAMethod",null)
            nodeState.putShared("resendvoiceretryCount", null);
            nodeState.putShared("anotherFactor",null)
            action.goTo(NodeOutcome.RESEND_SMS);
         } else if (selectedOutcome === 2) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("MFAMethod",null)
            nodeState.putShared("anotherFactor",null)
            action.goTo(NodeOutcome.RESEND_VOICE);
        }else if (selectedOutcome === 0) {
            logger.error("Inside the selected outcome is verify ***********");
             nodeState.putShared("chooseanothermethod", "false")
            if(autoTesting === "true" && password === "000000")
            {
                nodeLogger.error(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("invalidPhoneNumber", null);
                nodeState.putShared("errorMessage_ExpiredOtp", null)
                var telephoneNumber = nodeState.get("telephoneNumber");
                nodeState.putShared("phoneStatus","true");
                nodeState.putShared("MFAMethod","sms")
                nodeState.putShared("sms",telephoneNumber)
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Phone OTP Validation completed successfully for :: "+nodeState.get("telephoneNumber"));
                nodeState.putShared("anotherFactor",null)
                action.goTo(NodeOutcome.VERIFY);
                
            }
            else{

            if (!password || password == null) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("resendSMS", null)
            nodeState.putShared("resendVoice", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("anotherFactor",null)
            logger.error("OTP is Empty")
            action.goTo(NodeOutcome.EMPTY_OTP);
            }
                else {
                var timediff = new Date(dateTime) - new Date(nodeState.get("sendOTPTimestamp")) 
                if(timediff >=298800){
                    logger.debug("entered expired password block"+timediff)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("anotherFactor",null)
                    action.goTo(NodeOutcome.EXPIRED);
                }                  
                
            
          else if (verifyOTP(password)) {
                nodeLogger.debug(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
              nodeState.putShared("errorMessage_ExpiredOtp", null)
                nodeState.putShared("invalidPhoneNumber", null);
                nodeState.putShared("anotherFactor",null)
                var telephoneNumber = nodeState.get("telephoneNumber");
              nodeState.putShared("phoneStatus","true");
                nodeState.putShared("MFAMethod","sms")
                nodeState.putShared("sms",telephoneNumber)
                nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Phone OTP Validation completed successfully for :: "+nodeState.get("telephoneNumber"));
                action.goTo(NodeOutcome.VERIFY);

            } else {
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
              nodeState.putShared("errorMessage_ExpiredOtp", null)
              
              nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invalid OTP for  :: "+nodeState.get("telephoneNumber")+"::"+nodeConfig.errorId_InvalidPhoneOTP);
              
              action.goTo(NodeOutcome.FAILED);
            }
                }
            }
        }
        else{
             nodeLogger.error(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: ");
            action.goTo(NodeOutcome.ERROR);
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
        nodeState.putShared("errorMessage", null)
        nodeState.putShared("resendcodeMessage", null)
        nodeState.putShared("resendSMS", null)
        nodeState.putShared("resendVoice", null)
        nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        nodeState.putShared("anotherFactor",null)
        action.goTo(NodeOutcome.ERROR);
    }
}

function readFromNodeState() {
    nodeLogger.debug(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " *** Twilio OTP verification *** ");
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "nodeState " + nodeState);
    sid = nodeState.get("sid")
    if (!sid) {
     nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio sid is null. Routing to FAILED outcome.");
     nodeState.putShared("anotherFactor",null)
     action.goTo(NodeOutcome.FAILED);
     }
    nodeLogger.debug(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the sid from node state :" + sid);
    return sid
}

function verifyOTP(otp){
 var sid = nodeState.get("sid")
 nodeLogger.debug(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin+"Printing the sid value inside the verify OTP function :::: " + sid)
 var cleanedNumber = nodeState.get("cleanedNumber")
 var postData = "To=%2B"+cleanedNumber+"&Code=";
     var otpValue = "";
     otpValue = postData + otp;
   
  
      nodeState.putShared("Twilio_otp", otpValue);
      var twilio_otp =  nodeState.get("Twilio_otp") 
      nodeState.putShared("twilio_otp",twilio_otp);
      var authCode = "Basic "+systemEnv.getProperty("esv.twilio.authorizationcode");
      nodeState.putShared("authCode",authCode.toString());
      var options = {                             
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
         "Authorization": nodeState.get("authCode")
      },
       body: nodeState.get("twilio_otp")
}

    var requestURL = "https://verify.twilio.com/v2/Services/"+ sid +"/VerificationCheck";
  nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Request URL ::" + requestURL)
  var response = httpClient.send(requestURL, options).get();      

 nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing response Status "+ response.status)

 nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio verification response status "+ JSON.parse(response.text()).status);
var status = JSON.parse(response.text()).status
logger.debug("Printing the status :::: " + status + "type of " + typeof(status))
 if(status === "approved"){
        return true
    }else{
        return false
    }    
}

// Main execution
try {
    var sid;
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage_BlankOTP", null)
    action.goTo(NodeOutcome.ERROR);
}


