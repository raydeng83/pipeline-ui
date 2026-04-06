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
    scriptName: "KYID.2B1.Journey.Registration_Acceptance_PhoneRegistration.TwilioVerificationCheck.SMS",
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


// function getDisplayMessage() {
//     var nodeStateNumber = nodeState.get("telephoneNumber");
//     var boldoutput = nodeStateNumber.substring(0, nodeStateNumber.length-10) + " XXX-XXX-" + nodeStateNumber.slice(-4)
//     var displayMessage = "A six digit verification code was sent to " + boldoutput.bold() + ". Enter the verification code provided to verify your mobile number."
//     return displayMessage
// }

function getDisplayMessage() {
    var nodeStateNumber = nodeState.get("telephoneNumber");
    // Mask first 6 digits
    var maskedNumber = "XXX-XXX-" + nodeStateNumber.slice(-4);
    var displayMessage = "A six digit verification code was sent to " + maskedNumber.bold() + ". Enter the verification code provided to verify your mobile number.";
    logger.debug("the display message" +displayMessage)
    return displayMessage;
}

// Function to handle callback requests
function requestCallbacks() {
    var lib = require("KYID.Library.FAQPages");
    var process ="MasterLogin";
    //var pageHeader= "2_Select an authenticator app";
    var pageHeader= "2_verify_phone_number";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    try {    
            

            if(pageHeader==="3_verify_phone_number"){
                var jsonobj = {"pageHeader": "3_verify_phone_number"};
                logger.debug("jsonobj is in : "+jsonobj);
                callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
            }else if(!(nodeState.get("IsJourneyForgotEmail") || nodeState.get("isForgotPasswordJourney"))){
                var jsonobj = {"pageHeader": "2_verify_phone_number"};
                callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
                //callbacksBuilder.textOutputCallback(1, "2_verify_phone_number")
            }else if(nodeState.get("isForgotPasswordJourney") == true || nodeState.get("isMasterLogin")){
               var jsonobj = {"pageHeader": "2_Verify phone number"};
                logger.debug("jsonobj : "+jsonobj);
                callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
            }
           /* if(nodeState.get("phoneOTPFailed")!=null && nodeState.get("phoneOTPFailed")=="true"){
                 nodeState.putShared("phoneOTPFailed",null);
                 callbacksBuilder.textOutputCallback(1,"OTP was not sent successfully. Please click on resend otp below to try again.");
            }*/
             if (nodeState.get("resendSMS") != null) {
                var resendSMS = nodeState.get("resendSMS");
                 nodeState.putShared("resendSMS",null);
                 callbacksBuilder.textOutputCallback(1,resendSMS)
             }


             if (nodeState.get("resendVoice") != null) {
                var resendVoice = nodeState.get("resendVoice");
                 nodeState.putShared("resendVoice",null);
                callbacksBuilder.textOutputCallback(1,resendVoice)
             }
         if (nodeState.get("errorMessage_ExpiredOTP") != null) {
                var errorMessage_ExpiredOTP = nodeState.get("errorMessage_ExpiredOTP");
                nodeState.putShared("errorMessage_ExpiredOTP",null);
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_ExpiredOTP+`</div>`)
            }
else if (nodeState.get("validationErrorCode") != null) {
                var error = nodeState.get("validationErrorCode");
                nodeState.putShared("validationErrorCode",null);
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
    nodeState.putShared("validationErrorCode",null);
            }
            else if (nodeState.get("errorMessage_BlankOTP") != null) {
                var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
                nodeState.putShared("errorMessage_BlankOTP",null);
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
            }
        
            
            callbacksBuilder.textOutputCallback(0, `<div class='page-element'>${getDisplayMessage()}</div>`)
            callbacksBuilder.textInputCallback("Enter verification code*");
            callbacksBuilder.confirmationCallback(0, ["Verify","Resend via SMS", "Resend via Voice","Back"], 0);
        // if (getFaqTopicId != null) {
                
        //         callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
        //     }

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
            nodeState.putShared("validationErrorCode", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOTP", null)
            nodeState.putShared("chooseAnotherMethod", "true")
            nodeState.putShared("resendVoice", null)
            nodeState.putShared("resendSMS", null)   
            nodeState.putShared("MFAMethod", null)
             if(nodeState.get("phonegoBackCount")){
                    var phonegoBackCount = nodeState.get("phonegoBackCount")
                } else {
                    var phonegoBackCount = 1;
                }
            
                if (phonegoBackCount > retryLimit) {
                    logger.debug("the back retry limit is hit")
                   action.goTo(NodeOutcome.BACK_LIMIT);
                } else {
                     logger.debug("the back retry limit is not hit")
                    phonegoBackCount++
                    logger.debug("phonegoBackCount::" +phonegoBackCount);
                    nodeState.putShared("phonegoBackCount", phonegoBackCount);
                    nodeState.putShared("chooseanothermethod","true");
                    action.goTo(NodeOutcome.ANOTHER_FACTOR);
                }
            
        } else if (selectedOutcome === 1) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("validationErrorCode", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOTP", null)
            nodeState.putShared("MFAMethod",null)
             nodeState.putShared("resendvoiceretryCount", null);
            if(nodeState.get("resendsmsretryCount")){
                var resendsmsretryCount = nodeState.get("resendsmsretryCount")
            } else {
                var resendsmsretryCount = 1;
            }
        
            if (resendsmsretryCount > 2) {
 nodeState.putShared("validationErrorCode", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOTP", null)
            //nodeState.putShared("chooseAnotherMethod", "true")
            nodeState.putShared("resendVoice", null)
            nodeState.putShared("resendSMS", null)   
            nodeState.putShared("MFAMethod", null)
            nodeState.putShared("resendsmsretryCount", 1);
                action.goTo(NodeOutcome.MAX_LIMIT);
            } else {
                resendsmsretryCount++
                nodeState.putShared("resendsmsretryCount", resendsmsretryCount);
                nodeState.putShared("errorMessage_ExpiredOTP", null)
                nodeState.putShared("validationErrorCode", null)
                
                action.goTo(NodeOutcome.RESEND_SMS);
            }
            
         } else if (selectedOutcome === 2) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("validationErrorCode", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("errorMessage_ExpiredOTP", null)
            nodeState.putShared("MFAMethod","voice")
            nodeState.putShared("MFAMethod",null)
            if(nodeState.get("resendsmsretryCount")){
                var resendsmsretryCount = nodeState.get("resendsmsretryCount")
            } else {
                var resendsmsretryCount = 1;
            }
        
            if (resendsmsretryCount > 2) {
nodeState.putShared("resendsmsretryCount", 1);
                action.goTo(NodeOutcome.MAX_LIMIT);
            } else {
                 resendsmsretryCount++
                
                nodeState.putShared("resendsmsretryCount", resendsmsretryCount);
               nodeState.putShared("errorMessage_ExpiredOTP", null)
                nodeState.putShared("validationErrorCode", null)
                action.goTo(NodeOutcome.RESEND_VOICE);
            }
        }else if (selectedOutcome === 0) {
            logger.debug("Inside the selected outcome is verify ***********");
             nodeState.putShared("chooseanothermethod", "false")
            if(autoTesting === "true" && password === "000000")
            {
                nodeLogger.debug(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                nodeState.putShared("validationErrorCode", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("invalidPhoneNumber", null);
                nodeState.putShared("errorMessage_ExpiredOTP", null);
                var telephoneNumber = nodeState.get("telephoneNumber");
                nodeState.putShared("phoneStatus","true");
                nodeState.putShared("MFAMethod","sms")
                nodeState.putShared("sms",telephoneNumber)
                nodeState.putShared("verifiedTelephoneNumber",telephoneNumber)
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Phone OTP Validation completed successfully for :: "+nodeState.get("telephoneNumber"));
                action.goTo(NodeOutcome.VERIFY);
                
            }
            else{

            if (!password || password == null) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
            nodeState.putShared("validationErrorCode", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("resendSMS", null)
            nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_ExpiredOTP", null)
            logger.debug("OTP is Empty")

            if(nodeState.get("blanksmsvoiceotpCount")){
                var blanksmsvoiceotpCount = nodeState.get("blanksmsvoiceotpCount")
            } else {
                var blanksmsvoiceotpCount = 1;
            }
        
            if (blanksmsvoiceotpCount > 2) {
nodeState.putShared("blanksmsvoiceotpCount", 1);
                action.goTo(NodeOutcome.MAX_LIMIT);
            } else {
                blanksmsvoiceotpCount++
                nodeState.putShared("blanksmsvoiceotpCount", blanksmsvoiceotpCount);
                action.goTo(NodeOutcome.EMPTY_OTP);
            }
            }
                else {
                var timediff = new Date(dateTime) - new Date(nodeState.get("sendOTPTimestamp")) 
                if(timediff >=298800){
                    logger.debug("entered expired password block"+timediff)
                    nodeState.putShared("errorMessage_ExpiredOTP", null)
                    nodeState.putShared("validationErrorCode", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    logger.debug("InsideExpiredOTP");
                    action.goTo(NodeOutcome.EXPIRED);
                }                  
                
            
          else if (verifyOTP(password)) {
               logger.debug("Insdie Verify SMS condition");

                nodeLogger.debug(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                nodeState.putShared("validationErrorCode", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
              nodeState.putShared("errorMessage_ExpiredOTP", null)
                nodeState.putShared("invalidPhoneNumber", null);
                var telephoneNumber = nodeState.get("telephoneNumber");
              nodeState.putShared("phoneStatus","true");
              //  nodeState.putShared("MFAMethod","sms")
              logger.debug("MFA Method testing issss" +nodeState.get("MFAMethod"));
                nodeState.putShared("sms",telephoneNumber)
               nodeState.putShared("verifiedTelephoneNumber",telephoneNumber)
                nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Phone OTP Validation completed successfully for :: "+nodeState.get("telephoneNumber"));
                action.goTo(NodeOutcome.VERIFY);

            } else {
                nodeState.putShared("validationErrorCode", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("resendSMS", null)
                nodeState.putShared("resendVoice", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
              nodeState.putShared("errorMessage_ExpiredOTP", null)
                if(nodeState.get("incorrectsmsvoiceotpCount")){
                    var incorrectsmsvoiceotpCount = nodeState.get("incorrectsmsvoiceotpCount")
                } else {

                    var incorrectsmsvoiceotpCount = 1;
                }
            
                if (incorrectsmsvoiceotpCount > 2) {
nodeState.putShared("incorrectsmsvoiceotpCount", 1);
                    action.goTo(NodeOutcome.MAX_LIMIT);
                } else {
                    incorrectsmsvoiceotpCount++
                    nodeState.putShared("incorrectsmsvoiceotpCount", incorrectsmsvoiceotpCount);
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invalid OTP for  :: "+nodeState.get("telephoneNumber")+"::"+nodeConfig.errorId_InvalidPhoneOTP);
                    action.goTo(NodeOutcome.FAILED);
                }
            }
                }
            }
        }
        else{
             nodeLogger.debug(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: ");
            action.goTo(NodeOutcome.ERROR);
        }
        // else if (!password) {
        //     nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
        //     nodeState.putShared("errorMessage", null)
        //     nodeState.putShared("resendcodeMessage", null)
        //     nodeState.putShared("resendSMS", null)
        //     nodeState.putShared("resendVoice", null)
        //     if(nodeState.get("blanksmsvoiceotpCount")){
        //         var blanksmsvoiceotpCount = nodeState.get("blanksmsvoiceotpCount")
        //     } else {
        //         var blanksmsvoiceotpCount = 1;
        //     }
        
        //     if (blanksmsvoiceotpCount > 2) {
        //         action.goTo(NodeOutcome.MAX_LIMIT);
        //     } else {
        //         blanksmsvoiceotpCount++
        //         nodeState.putShared("blanksmsvoiceotpCount", blanksmsvoiceotpCount);
        //         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "OTP is blank for  :: "+nodeState.get("telephoneNumber"));
        //         action.goTo(NodeOutcome.EMPTY_OTP);
        //     }
        // } else {
        //     nodeState.putShared("errorMessage", null)
        //     nodeState.putShared("resendcodeMessage", null)
        //     nodeState.putShared("resendSMS", null)
        //     nodeState.putShared("resendVoice", null)
        //     nodeState.putShared("errorMessage_BlankOTP", null)

        //     if(nodeState.get("incorrectsmsvoiceotpCount")){
        //         var incorrectsmsvoiceotpCount = nodeState.get("incorrectsmsvoiceotpCount")
        //     } else {
        //         var incorrectsmsvoiceotpCount = 1;
        //     }
        
        //     if (incorrectsmsvoiceotpCount > 2) {
        //         action.goTo(NodeOutcome.MAX_LIMIT);
        //     } else {
        //         incorrectsmsvoiceotpCount++
        //         nodeState.putShared("incorrectsmsvoiceotpCount", incorrectsmsvoiceotpCount);
        //         action.goTo(NodeOutcome.FAILED);
        //     }

        // }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
        nodeState.putShared("validationErrorCode", null)
        nodeState.putShared("resendcodeMessage", null)
        nodeState.putShared("resendSMS", null)
        nodeState.putShared("resendVoice", null)
        nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        action.goTo(NodeOutcome.ERROR);
    }
}







function readFromNodeState() {
    nodeLogger.debug(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " *** Twilio OTP verification *** ");
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "nodeState " + nodeState);
    sid = nodeState.get("sid")
    if (!sid) {
     nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio sid is null. Routing to FAILED outcome.");
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
      //  logger.debug("Printing the verify authcode function :::: " + authCode)
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
        auditLog("VER005", "OTP validation Failure");
        return false
    }    
}

// Main execution
try {
    var sid;
    var lib = require("KYID.Library.FAQPages");
    var process ="SelfRegistration";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    
    if(nodeState.get("pageHeader")==="1_add_methods"){
        var pageHeader= "3_verify_phone_number";  
    }else{
        var pageHeader= "2_verify_phone_number";  
    }
        logger.debug("pageHeader is in "+ pageHeader)
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage_BlankOTP", null)
    nodeState.putShared("errorMessage_ExpiredOTP", null)  
    action.goTo(NodeOutcome.ERROR);
}



function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
          var headerName = "X-Real-IP";
         var headerValues = requestHeaders.get(headerName); 
          var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
           var browser = requestHeaders.get("user-agent"); 
           var os = requestHeaders.get("sec-ch-ua-platform"); 
           var userId = null;
            var eventDetails = {};
              eventDetails["IP"] = ipAdress;
              eventDetails["Browser"] = browser;
              eventDetails["OS"] = os;
              eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
              eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
          var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

                if (userEmail){
              var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
              userId = userQueryResult.result[0]._id;
                }
              var requesterUserId = null;
               if (typeof existingSession != 'undefined') {
              requesterUserId = existingSession.get("UserId")
                }

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA Authentication success "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}


