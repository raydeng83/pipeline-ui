var dateTime = new Date().toISOString();
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId")[0];

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Update MFA Method",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.UpdateMFAMethod",
    timestamp: dateTime,
    end: "Node Execution Completed"
};


var NodeOutcome = {
    SUCCESS: "True",
    FAILED: "False",
    ADDMOBILE: "AddMobile"
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
var auditLib = require("KYID.2B1.Library.AuditLogger")
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
var errMsg = {};
var libError = null;
var msg = null;
var outcome=NodeOutcome.FAILED;
libError = require("KYID.2B1.Library.Loggers");
var mfaMethod = nodeState.get("MFAMethod");
var usrKOGID = nodeState.get("KOGID");
var mail = nodeState.get("mail");
logger.debug("mfaMethodValue:"+mfaMethod);

//fetch the purpose for mfa reporting
//MFAReporting
        // Retrieve journey purpose based on journey name
            var purpose = "";
            var journeyName = nodeState.get("journeyName");
            var alternateJourneyName = nodeState.get("journeyNameReporting");
            var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
            var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
            logger.error("the journey name in KYID.2B1.Journey.VerifyPrimaryEmailOTP:: "+nodeState.get("journeyName"))
            if (journeyName) {
                logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[journeyName])
               
                if (parsedjourneyPurposeMapping) {
                    if (parsedjourneyPurposeMapping.hasOwnProperty(journeyName)) {
                        logger.error("Journey Name: " + journeyName + ", Purpose: " + parsedjourneyPurposeMapping[journeyName]);
                        purpose = parsedjourneyPurposeMapping[journeyName];
                    } else {
                        logger.error("No purpose mapping found for Journey Name: " + journeyName);
                        if (alternateJourneyName && parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Trying alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        }
                        }
                    }
                } else if (alternateJourneyName) {
                    logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                    logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[alternateJourneyName])
                    if (parsedjourneyPurposeMapping) {
                        if (parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        } else {
                            logger.error("No purpose mapping found for Alternate Journey Name: " + alternateJourneyName);
                        }
                    }
                }

var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);

logger.debug("requestHeader :: "+ JSON.stringify(requestHeaders))

var browser = requestHeaders.get("user-agent"); 
var os = requestHeaders.get("sec-ch-ua-platform"); 

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
eventDetails["purpose"] = purpose || "" //MFAReporting


var userId = (typeof existingSession !== 'undefined' && existingSession.get("UserId")) || nodeState.get("_id") || "";
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

var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";


if(mfaMethod){
if(mfaMethod == "email"){
    var email = nodeState.get("email");
    logger.debug("mail "+mail);
    var result = registerMFAMethod(mfaMethod,usrKOGID, email, null,null,null,null,null,null,purpose);
    if(result){
        eventDetails.MFAValue = mfaMethod
        eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
        
        eventDetails["action"] = "Add" //MFA Reporting
        eventDetails["mfatype"] = "Primary Email OTP" //MFA Reporting
        eventDetails["mfastatus"] = "Successful"     //MFA Reporting

        if(nodeState.get("resendotpretryCountforReporting")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendotpretryCountforReporting")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA005",sessionDetails,"Register Email", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } else {
        eventDetails["action"] = "Add" //MFA Reporting
        eventDetails["mfatype"] = "Primary Email OTP" //MFA Reporting
        eventDetails["mfastatus"] = "Failed"     //MFA Reporting

        if(nodeState.get("resendotpretryCountforReporting")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendotpretryCountforReporting")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA005",sessionDetails,"Email Registration Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)  
    }
} else if(mfaMethod === "voice" || mfaMethod === "sms" || mfaMethod === "MOBILE" ){
    logger.debug("It is phone MFA object update")
    mfaMethod = "SMSVOICE"
    var telephoneNumber = nodeState.get("telephoneNumber"); 
    logger.debug("telephone num from nodestate: "+telephoneNumber)
    var result = registerMFAMethod(mfaMethod,usrKOGID, null,telephoneNumber,null,null,null,null,null,purpose);
    // nodeState.putShared("MFAMethodRegisterd","Phone");
    if(result){
        eventDetails.MFAValue = mfaMethod
        eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
        eventDetails["MFATYPE"] = "Phone"
        eventDetails["OTPDeliveryMethod"] = nodeState.get("otpDeliveryMethod") || "";
        
        eventDetails["action"] = "Add" //MFA Reporting
        if(nodeState.get("otpDeliveryMethod") && nodeState.get("otpDeliveryMethod").indexOf("SMS") > -1){  //MFA Reporting
            eventDetails["mfatype"] = "Mobile Phone OTP SMS"
        } else {
            eventDetails["mfatype"] = "Mobile Phone OTP Voice"
        }
        eventDetails["mfastatus"] = "Successful"     //MFA Reporting

        if(nodeState.get("resendsmsretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsmsretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA005",sessionDetails,"Register Mobile Phone MFA", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        auditLib.auditLogger("PRO005",sessionDetails,"Add Additional Account Recovery Method", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        errMsg["code"] = "INF-PRE-SYS-001";
        errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
        errMsg["MFAMethod"] = "Phone"
        nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg)); 
        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Mobile phone registered successfully for authentication"+"::"+telephoneNumber +"::"+mail);
        nodeState.putShared("actionFlag","1");
        nodeState.putShared("mobileNumber",telephoneNumber);
        nodeState.putShared("phoneReg","true")
        outcome = NodeOutcome.ADDMOBILE;
    } else {
        eventDetails["action"] = "Add" //MFA Reporting
    if(nodeState.get("otpDeliveryMethod") && nodeState.get("otpDeliveryMethod").indexOf("SMS") > -1){  //MFA Reporting
        eventDetails["mfatype"] = "Mobile Phone OTP SMS"
    } else {
        eventDetails["mfatype"] = "Mobile Phone OTP Voice"
    }
        eventDetails["mfastatus"] = "Failed"     //MFA Reporting

        if(nodeState.get("resendsmsretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsmsretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA005",sessionDetails,"Mobile Phone MFA Registration Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.ADDMOBILE;
    }
}
else if(mfaMethod == "SECONDARY_EMAIL"){
    var secondaryEmail = nodeState.get("alternateEmail");
    var result = registerMFAMethod(mfaMethod,usrKOGID,secondaryEmail,purpose);
    if (result) {
        errMsg["code"] = "INF-PRE-SYS-001";
        errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
        errMsg["MFAMethod"] = "SECONDARY_EMAIL";
        nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
        nodeState.putShared("phoneReg","true")
        eventDetails.MFAValue = mfaMethod
        eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
        eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
        
        eventDetails["action"] = "Add" //MFA Reporting
        eventDetails["mfatype"] = "Alternate Email OTP" //MFA Reporting
        eventDetails["mfastatus"] = "Successful"     //MFA Reporting

        if(nodeState.get("resendotpretryCountforReporting")){   //MFA Reporting
               eventDetails["NumberofResendCodes"] = nodeState.get("resendotpretryCountforReporting")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA007",sessionDetails,"Register Secondary EMAIL", eventDetails, userId,userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    } else{
        eventDetails["action"] = "Add" //MFA Reporting
        eventDetails["mfatype"] = "Alternate Email OTP" //MFA Reporting
        eventDetails["mfastatus"] = "Failed"     //MFA Reporting

        if(nodeState.get("resendotpretryCountforReporting")){    //MFA Reporting
               eventDetails["NumberofResendCodes"] = nodeState.get("resendotpretryCountforReporting")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        action.goTo(outcome); 
    }
}
else if(mfaMethod == "SYMANTEC"){
    var credId = nodeState.get("credId"); 
    var result = registerMFAMethod(mfaMethod,usrKOGID, null, null,credId,null,null,null,null,purpose);
    if(result){
        errMsg["code"] = "INF-PRE-SYS-001";
        errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
        errMsg["MFAMethod"] = "SYMANTEC"
        nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
        
        
        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Syamtec registered successfully for authentication"+"::"+credId +"::"+mail);
        nodeState.putShared("phoneReg","true")
        eventDetails.MFAValue = mfaMethod
        eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
        eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
        
        eventDetails["action"] = "Add" //MFA Reporting
    if (credId.startsWith("SYMC")) {   //MFA Reporting
        eventDetails["mfatype"] = "Symantec Mobile Soft Token"
    } else if (credId.startsWith("VSS")) {
        eventDetails["mfatype"] = "Symantec Desktop Soft Token"
    } else {
        eventDetails["mfatype"] = "Symantec Hard Token"
    }
        eventDetails["mfastatus"] = "Successful"     //MFA Reporting

        if(nodeState.get("resendsymantecretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsymantecretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    }
        else{
    eventDetails["action"] = "Add" //MFA Reporting
    if (credId.startsWith("SYMC")) {   //MFA Reporting
        eventDetails["mfatype"] = "Symantec Mobile Soft Token"
    } else if (credId.startsWith("VSS")) {
        eventDetails["mfatype"] = "Symantec Desktop Soft Token"
    } else {
        eventDetails["mfatype"] = "Symantec Hard Token"
    }
    eventDetails["mfastatus"] = "Failed"     //MFA Reporting

    if(nodeState.get("resendsymantecretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsymantecretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
    
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the symantec app"+"::"+mail);
    } 
}
else if(mfaMethod == "PUSH"){
  var FRPUSH = "PUSH"; 
 var result = registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,FRPUSH,null,null,purpose);
 if(result){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "ForgeRock_PUSH"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForgeRock PUSH registered successfully for authentication" +"::"+mail);
 nodeState.putShared("phoneReg","true")
    eventDetails.MFAValue = mfaMethod
    eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
    eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""

    eventDetails["action"] = "Add" //MFA Reporting
    eventDetails["mfatype"] = "ForgeRock Push" //MFA Reporting
    eventDetails["mfastatus"] = "Successful"     //MFA Reporting

     if(nodeState.get("retryPUSHAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get("retryPUSHAttempt")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
    auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
 
    outcome = NodeOutcome.SUCCESS;
 }
  else{

    eventDetails["action"] = "Add" //MFA Reporting
    eventDetails["mfatype"] = "ForgeRock Push" //MFA Reporting
    eventDetails["mfastatus"] = "Failed"     //MFA Reporting

      if(nodeState.get("retryPUSHAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get("retryPUSHAttempt")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected debug has occurred while registering the forgerock authenticator app"+"::"+mail);
} 
}
else if(mfaMethod == "TOTP"){
 if(nodeState.get("TOTPType")== "FRTOTP"){
  var FRTOTP ="FRTOTP";
var result = registerMFAMethod(mfaMethod,usrKOGID, null, null,null,FRTOTP,null,null,null,purpose);
if(result){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "ForgeRock_TOTP"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForgeRock TOTP registered successfully for authentication"+"::"+credId +"::"+mail);  
 nodeState.putShared("phoneReg","true")
 eventDetails.MFAValue = mfaMethod
 eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
 eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""   

 eventDetails["action"] = "Add" //MFA Reporting
 eventDetails["mfatype"] = "ForgeRock TOTP" //MFA Reporting
 eventDetails["mfastatus"] = "Successful"     //MFA Reporting

if(nodeState.get("retryTOTPAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get(retryTOTPAttempt)
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
    
 auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
 outcome = NodeOutcome.SUCCESS;
 
}
else{

    eventDetails["action"] = "Add" //MFA Reporting
    eventDetails["mfatype"] = "ForgeRock TOTP" //MFA Reporting
    eventDetails["mfastatus"] = "Failed"     //MFA Reporting

    if(nodeState.get("retryTOTPAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get(retryTOTPAttempt)
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
    
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the forgerock authenticator app"+"::"+mail);
}
 
 }
else if(nodeState.get("TOTPType")== "MSTOTP"){
    var MSTOTP = "MSTOTP";
    var result = registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,null,MSTOTP,null,purpose);
    if(result){
         errMsg["code"] = "INF-PRE-SYS-001";
         errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
         errMsg["MFAMethod"] = "Microsoft_TOTP"
         nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft TOTP registered successfully for authentication"+"::"+mail); 
                 nodeState.putShared("phoneReg","true")
         eventDetails.MFAValue = mfaMethod
         eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
         eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
        
         eventDetails["action"] = "Add" //MFA Reporting
         eventDetails["mfatype"] = "Microsoft TOTP" //MFA Reporting
         eventDetails["mfastatus"] = "Successful"     //MFA Reporting
        
          if(nodeState.get("retryTOTPAttempt") || nodeState.get("retryTOTPAttemptReporting") ){
               eventDetails["NumberofResendCodes"] = nodeState.get("retryTOTPAttempt") || nodeState.get("retryTOTPAttemptReporting")
           } else {
               eventDetails["NumberofResendCodes"] = 0
           }
             auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    }
    else{

     eventDetails["action"] = "Add" //MFA Reporting
     eventDetails["mfatype"] = "Microsoft TOTP" //MFA Reporting
     eventDetails["mfastatus"] = "Failed"     //MFA Reporting

        if(nodeState.get("retryTOTPAttempt") || nodeState.get("retryTOTPAttemptReporting") ){
           eventDetails["NumberofResendCodes"] = nodeState.get("retryTOTPAttempt") || nodeState.get("retryTOTPAttemptReporting")
       } else {
           eventDetails["NumberofResendCodes"] = 0
       }
         auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the microsoft authenticator app"+"::"+mail);
    }
    }
else if(nodeState.get("TOTPType")== "GTOTP"){
    var GTOTP = "GTOTP"
    var result = registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,null,null,GTOTP,purpose);
    if(result){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "Google_TOTP"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google TOTP registered successfully for authentication"+"::"+mail); 
         nodeState.putShared("phoneReg","true")
 eventDetails.MFAValue = mfaMethod
 eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
 eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""

 eventDetails["action"] = "Add" //MFA Reporting
 eventDetails["mfatype"] = "Google TOTP" //MFA Reporting
 eventDetails["mfastatus"] = "Successful"     //MFA Reporting

if(nodeState.get("retryTOTPAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get(retryTOTPAttempt)
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
 auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    }
    else{

        eventDetails["action"] = "Add" //MFA Reporting
        eventDetails["mfatype"] = "Google TOTP" //MFA Reporting
        eventDetails["mfastatus"] = "Failed"     //MFA Reporting

        if(nodeState.get("retryTOTPAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get(retryTOTPAttempt)
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
        
        auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders);
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the google authenticator app"+"::"+mail);
    }
    }

 
}
    logger.debug("Outcome is "+ outcome);
   action.goTo(outcome);
}
else{
    action.goTo(outcome);
}



// Functions
function registerMFAMethod(mfaMethod, usrKOGID, email, telephoneNumber,credId,FRTOTP,FRPUSH,MSTOTP,GTOTP,purpose) {
    try {
        logger.debug("MFA Method is = "+mfaMethod);
        if ((mfaMethod === "SMSVOICE" && telephoneNumber !=null )) {
            if(!lookupInMFAObject(usrKOGID, telephoneNumber, mfaMethod)) {
                var createResult = createMFAObject(usrKOGID,"SMSVOICE",telephoneNumber,"ACTIVE",true,purpose);
                logger.debug("createResult" +JSON.stringify(createResult));
                if (createResult._id){
                    return true;
                }
                else{
                return false;   
                }
            }else if(nodeState.get("existingHighRiskMFAId") && nodeState.get("existingHighRiskMFAId") != null){
                patchHighRisk(nodeState.get("existingHighRiskMFAId"), telephoneNumber, mfaMethod);
                return true;
            }else
                return true;
        } 
        else if (mfaMethod === "EMAIL" && email !=null ) {
        if(!lookupInMFAObject(usrKOGID, email, mfaMethod)) {
            var createResult = createMFAObject(usrKOGID,"EMAIL",email,"ACTIVE",true,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
         }
    } 
    else if (mfaMethod === "TOTP" && FRTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        var createResult = createMFAObject(usrKOGID, "TOTP", "FORGEROCK", "ACTIVE",false,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
        }
    }
   else if (mfaMethod === "PUSH" && FRPUSH !=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        var createResult = createMFAObject(usrKOGID, "PUSH", "FORGEROCK", "ACTIVE",false,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
        }
    }
    else if (mfaMethod === "TOTP" && MSTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "MICROSOFT", mfaMethod)) {
        var createResult = createMFAObject(usrKOGID, "TOTP", "MICROSOFT", "ACTIVE",false,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
        }
    }
   else if (mfaMethod === "TOTP" && GTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "GOOGLE", mfaMethod)) {
        var createResult = createMFAObject(usrKOGID, "TOTP", "GOOGLE", "ACTIVE",false,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
        }
    }
   else if (mfaMethod === "SYMANTEC" && credId!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "SYMANTEC", mfaMethod)) {
        var createResult = createMFAObject(usrKOGID, "SYMANTEC", credId, "ACTIVE",false,purpose);
         logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
        }
    }
    else if (mfaMethod === "SECONDARY_EMAIL" && secondaryEmail !=null ) {
    logger.debug("inside if");
        if(!lookupInMFAObject(usrKOGID, secondaryEmail, mfaMethod)) {
            var createResult = createMFAObject(usrKOGID,"SECONDARY_EMAIL",secondaryEmail,"ACTIVE", true,purpose);
            logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
                return false;   
            }
        }else if(nodeState.get("existingHighRiskMFAId") && nodeState.get("existingHighRiskMFAId") != null){
                patchHighRisk(nodeState.get("existingHighRiskMFAId"), telephoneNumber, mfaMethod);
                return true;
        }else{
            errMsg["code"] = "ERR-MFA-MAIL-002";
            errMsg["message"] = libError.readErrorMessage("ERR-MFA-MAIL-002"); 
            nodeState.putShared("errorMessage", JSON.stringify(errMsg));
            return false;
        }
    }
    else{
        return false;
    }
    
        
    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects"+"::"+error);
    }

    

}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly,purpose) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
  try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)

        // var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
        // var risk = nodeState.get("risk") || "" ;
        // var requestStatus = nodeState.get("requestStatus") || "" ;
        // var riskReasonId = nodeState.get("riskReasonId") || "" ;
        // var riskReason = nodeState.get("riskReason") || "" ;
        // var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
        // var riskBand = nodeState.get("riskBand") || "" ;
        // var failureReason = nodeState.get("failureReason") || "" ;

        var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
        var risk = nodeState.get("mailRisk") || "" ;
        var requestStatus = nodeState.get("requestStatus") || "" ;
        var riskReasonId = nodeState.get("riskReasonId") || "" ;
        var riskReason = nodeState.get("riskReason") || "" ;
        var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
        var riskBand = nodeState.get("riskBand") || "" ;
        var failureReason = nodeState.get("failureReason") || "" ;


      var emailPhoneRiskIndicator = []
      if(nodeState.get("phoneFinderRiskIndicator")){
          emailPhoneRiskIndicator = nodeState.get("phoneFinderRiskIndicator") ? JSON.parse(nodeState.get("phoneFinderRiskIndicator")) : [] ;
      }else if(nodeState.get("alternateEmailRiskIndicator")){
          emailPhoneRiskIndicator = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
      }else{
          emailPhoneRiskIndicator = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : [] ;
      }
        //For MFA Reporting
      var normalizedMethod = (method || "").toString().toUpperCase();
      var normalizedValue = (usrMfaValue || "").toString().toUpperCase();

        var mfaTypeLabel = "";
        if (normalizedMethod === "PUSH" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock Push";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "MICROSOFT") {
            mfaTypeLabel = "Microsoft TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "GOOGLE") {
            mfaTypeLabel = "Google TOTP";
        } else if (normalizedMethod === "SYMANTEC") {
            // usrMfaValue is credId for Symantec
            if (normalizedValue.indexOf("SYMC") === 0) {
                mfaTypeLabel = "Symantec Mobile Soft Token";
            } else if (normalizedValue.indexOf("VSS") === 0) {
                mfaTypeLabel = "Symantec Desktop Soft Token";
            } else {
                mfaTypeLabel = "Symantec Hard Token";
            }
        } else if (normalizedMethod === "SMSVOICE") {
            var otpDelivery = (nodeState.get("otpDeliveryMethod") || "").toString().toUpperCase();
            mfaTypeLabel = (otpDelivery === "VOICE") ? "Mobile Phone OTP Voice" : "Mobile Phone OTP SMS"; // default SMS
        } else if (normalizedMethod === "EMAIL") {
            mfaTypeLabel = "Primary Email OTP";
        } else if (normalizedMethod === "SECONDARY_EMAIL") {
            mfaTypeLabel = "Alternate Email OTP";
        }
        
      
        var mfajsonObj = {
            'KOGId': usrKOGID,
            'MFAMethod': method,
            'MFAValue': usrMfaValue,
            'MFAStatus': status,
            'isRecoveryOnly': isRecoveryOnly,
            'createDate': auditData.createdDate,
            'createDateEpoch': auditData.createdDateEpoch,
            'createdBy': auditData.createdBy,
            'createdByID': auditData.createdByID,
            'updateDate': auditData.updatedDate,
            'updateDateEpoch': auditData.updatedDateEpoch,
            'updatedBy': auditData.updatedBy,
            'updatedByID': auditData.updatedByID,
            'transactionId': transactionIdLN || "",
            'risk': risk || "",
            'requestStatus': requestStatus || "",
            'riskReason': riskReason || "",
            'riskReasonID': riskReasonId || "",
            'riskReasonDescription': riskReasonDescription || "",
            'riskBand,': riskBand || "",
            'failureReason': failureReason || "",
            'riskIndicator': emailPhoneRiskIndicator.riskIndicator || []
            //'purpose': purpose    //MFA Reporting 1
        };
      logger.debug("mfajsonObj is :: " + JSON.stringify(mfajsonObj))
      return openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
      
    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in audData" + "::" + error);
    }

   
}

function lookupInMFAObject(usrKOGID, usrMfaValue,mfaMethod) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});
	if (mfaMethodResponses.result.length>0){
       for(i=0;i<mfaMethodResponses.result.length;i++){
           var mfaMethodResponse = mfaMethodResponses.result[i];
		   if(mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue)===0 && (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE")===0 || mfaMethodResponse["MFAStatus"].localeCompare("HIGHRISK")===0 || mfaMethodResponse["MFAStatus"].localeCompare("highrisk")===0) && mfaMethodResponse["MFAMethod"].localeCompare(mfaMethod)===0) {
			   if(mfaMethodResponse["MFAStatus"].localeCompare("HIGHRISK")===0 || mfaMethodResponse["MFAStatus"].localeCompare("highrisk")===0){
                nodeState.putShared("existingHighRiskMFAId",mfaMethodResponse._id);
               }
                return true;
		   }
	   }
	}
	return false;
}



function patchHighRisk(_id, usrMfaValue,method) {
    logger.debug("Inside patchHighRisk function")
    try {
        // Extract user info
        var usrKOGID = nodeState.get("KOGID");
        var telephoneNumber = nodeState.get("telephoneNumber"); 
        var secondaryEmail = nodeState.get("alternateEmail");
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)

        logger.debug("usrKOGID :: " + usrKOGID)
        logger.debug("telephoneNumber :: " + telephoneNumber)
        logger.debug("secondaryEmail :: " + secondaryEmail)

        // if(telephoneNumber){
        //     var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND (MFAStatus eq "highrisk" OR MFAStatus eq "HIGHRISK") AND MFAValue eq "' + telephoneNumber + '"' });
        //     method = "SMSVOICE"
        //     usrMfaValue = telephoneNumber;
        //     logger.debug("mfaMethodResponses for telephoneNumber :: " + JSON.stringify(mfaMethodResponses))
        // }else if(secondaryEmail){
        //     var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND (MFAStatus eq "highrisk" OR MFAStatus eq "HIGHRISK") AND MFAValue eq "' + secondaryEmail + '"' });
        //     method = "SECONDARY_EMAIL"
        //     usrMfaValue = secondaryEmail
        //     logger.debug("mfaMethodResponses for secondaryEmail :: " + JSON.stringify(mfaMethodResponses))
        // }

        var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
        var risk = nodeState.get("mailRisk") || "" ;
        var requestStatus = nodeState.get("requestStatus") || "" ;
        var riskReasonId = nodeState.get("riskReasonId") || "" ;
        var riskReason = nodeState.get("riskReason") || "" ;
        var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
        var riskBand = nodeState.get("riskBand") || "" ;
        var failureReason = nodeState.get("failureReason") || "" ;


        var emailPhoneRiskIndicator = []
        if(nodeState.get("phoneFinderRiskIndicator")){
            emailPhoneRiskIndicator = nodeState.get("phoneFinderRiskIndicator") ? JSON.parse(nodeState.get("phoneFinderRiskIndicator")) : [] ;
            logger.debug("emailPhoneRiskIndicatorin ptachMFA is :: " + JSON.stringify(emailPhoneRiskIndicator))
        }else if(nodeState.get("alternateEmailRiskIndicator")){
            emailPhoneRiskIndicator = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
            logger.debug("emailPhoneRiskIndicatorin ptachMFA is :: " + JSON.stringify(emailPhoneRiskIndicator))
        }else{
            emailPhoneRiskIndicator = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : [] ;
        }
        logger.debug("emailPhoneRiskIndicator is :: " + JSON.stringify(emailPhoneRiskIndicator))
            //For MFA Reporting
        var normalizedMethod = (method || "").toString().toUpperCase();
        var normalizedValue = (usrMfaValue || "").toString().toUpperCase();

        var mfaTypeLabel = "";
        if (normalizedMethod === "PUSH" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock Push";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "MICROSOFT") {
            mfaTypeLabel = "Microsoft TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "GOOGLE") {
            mfaTypeLabel = "Google TOTP";
        } else if (normalizedMethod === "SYMANTEC") {
            // usrMfaValue is credId for Symantec
            if (normalizedValue.indexOf("SYMC") === 0) {
                mfaTypeLabel = "Symantec Mobile Soft Token";
            } else if (normalizedValue.indexOf("VSS") === 0) {
                mfaTypeLabel = "Symantec Desktop Soft Token";
            } else {
                mfaTypeLabel = "Symantec Hard Token";
            }
        } else if (normalizedMethod === "SMSVOICE") {
            var otpDelivery = (nodeState.get("otpDeliveryMethod") || "").toString().toUpperCase();
            mfaTypeLabel = (otpDelivery === "VOICE") ? "Mobile Phone OTP Voice" : "Mobile Phone OTP SMS"; // default SMS
        } else if (normalizedMethod === "EMAIL") {
            mfaTypeLabel = "Primary Email OTP";
        } else if (normalizedMethod === "SECONDARY_EMAIL") {
            mfaTypeLabel = "Alternate Email OTP";
        }

        var purpose = "";
        var journeyName = nodeState.get("journeyName");
        var alternateJourneyName = nodeState.get("journeyNameReporting");
        var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
        var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
        logger.error("the journey name in KYID.2B1.Journey.VerifyPrimaryEmailOTP:: "+nodeState.get("journeyName"))
        if (journeyName) {
            logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
            logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[journeyName])
            
            if (parsedjourneyPurposeMapping) {
                if (parsedjourneyPurposeMapping.hasOwnProperty(journeyName)) {
                    logger.error("Journey Name: " + journeyName + ", Purpose: " + parsedjourneyPurposeMapping[journeyName]);
                    purpose = parsedjourneyPurposeMapping[journeyName];
                } else {
                    logger.error("No purpose mapping found for Journey Name: " + journeyName);
                    if (alternateJourneyName && parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                        logger.error("Trying alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                        purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                    }
                    }
                }
            } else if (alternateJourneyName) {
                logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[alternateJourneyName])
                if (parsedjourneyPurposeMapping) {
                    if (parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                        logger.error("Alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                        purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                    } else {
                        logger.error("No purpose mapping found for Alternate Journey Name: " + alternateJourneyName);
                    }
                }
            }

            if (_id && _id != null) {
                    var patchObj = [
                {
                    "operation": "replace",
                    "field": "/MFAStatus",
                    "value": "ACTIVE"
                },
                {
                    "operation": "replace",
                    "field": "/updateDateEpoch",
                    "value": auditData.updatedDateEpoch
                },
                {
                    "operation": "replace",
                    "field": "/updatedByID",
                    "value": auditData.updatedByID || nodeState.get("_id") || ""
                },
                {
                    "operation": "replace",
                    "field": "/updateDate",
                    "value": auditData.updatedDate
                },
                {
                    "operation": "replace",
                    "field": "/updatedBy",
                    "value": auditData ? auditData.updatedBy || nodeState.get("mail") || nodeState.get("EmailAddress") || "" : nodeState.get("mail") || nodeState.get("EmailAddress") || ""
                },
                {
                    "operation": "replace",
                    "field": "/transactionId",
                    "value": transactionIdLN    
                },
                {
                    "operation": "replace", 
                    "field": "/risk",
                    "value": risk   
                },
                {
                    "operation": "replace",
                    "field": "/requestStatus",
                    "value": requestStatus
                },
                {
                    "operation": "replace",
                    "field": "/riskReasonId",
                    "value": riskReasonId || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskReasonDescription",
                    "value": riskReasonDescription || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskBand",
                    "value": riskBand || ""
                },
                {
                    "operation": "replace",
                    "field": "/failureReason",
                    "value": failureReason || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskIndicator",
                    "value": emailPhoneRiskIndicator ? emailPhoneRiskIndicator.riskIndicator || [] : []
                },
                {
                    "operation": "replace",
                    "field": "/purpose",
                    "value": purpose || ""
                }
                
            ];

            logger.debug("patchObj in patchMFA :: " + JSON.stringify(patchObj))
            openidm.patch("managed/alpha_kyid_mfa_methods/" + _id, null, patchObj);
        }
    } catch (error) {
        logger.error("Error in patchHighRisk function :: " + error)
    }
}