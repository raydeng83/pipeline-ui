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
 registerMFAMethod(mfaMethod,usrKOGID, email, null,null,null,null,null,null);
eventDetails.MFAValue = mfaMethod
eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
auditLib.auditLogger("MFA005",sessionDetails,"Register Email", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
}
else if(mfaMethod === "voice" || mfaMethod === "sms" || mfaMethod === "MOBILE" ){
logger.debug("It is phone MFA object update")
 mfaMethod = "SMSVOICE"
 var telephoneNumber = nodeState.get("telephoneNumber"); 
    logger.debug("telephone num from nodestate: "+telephoneNumber)
 registerMFAMethod(mfaMethod,usrKOGID, null,telephoneNumber,null,null,null,null,null);
 // nodeState.putShared("MFAMethodRegisterd","Phone");
eventDetails.MFAValue = mfaMethod
eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
eventDetails["MFATYPE"] = "Phone"
eventDetails["OTPDeliveryMethod"] = nodeState.get("otpDeliveryMethod") || "";
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
}
else if(mfaMethod == "SECONDARY_EMAIL"){
var secondaryEmail = nodeState.get("alternateEmail");
var result = registerMFAMethod(mfaMethod,usrKOGID,secondaryEmail);
if (result)
{
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "SECONDARY_EMAIL";
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeState.putShared("phoneReg","true")
eventDetails.MFAValue = mfaMethod
eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
auditLib.auditLogger("MFA007",sessionDetails,"Register Secondary EMAIL", eventDetails, userId,userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
outcome = NodeOutcome.SUCCESS;
}
else{
   action.goTo(outcome); 
}
}
else if(mfaMethod == "SYMANTEC"){
  var credId = nodeState.get("credId"); 
 registerMFAMethod(mfaMethod,usrKOGID, null, null,credId,null,null,null,null);
 if(registerMFAMethod){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "SYMANTEC"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 
        
    nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Syamtec registered successfully for authentication"+"::"+credId +"::"+mail);
    nodeState.putShared("phoneReg","true")
    eventDetails.MFAValue = mfaMethod
    eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
    eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
    auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    outcome = NodeOutcome.SUCCESS;
 }
  else{
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the symantec app"+"::"+mail);
} 
}
else if(mfaMethod == "PUSH"){
  var FRPUSH = "PUSH"; 
 registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,FRPUSH,null,null);
 if(registerMFAMethod){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "ForgeRock_PUSH"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForgeRock PUSH registered successfully for authentication" +"::"+mail);
 nodeState.putShared("phoneReg","true")
    eventDetails.MFAValue = mfaMethod
    eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
    eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
    auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
 
    outcome = NodeOutcome.SUCCESS;
 }
  else{
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected debug has occurred while registering the forgerock authenticator app"+"::"+mail);
} 
}
else if(mfaMethod == "TOTP"){
 if(nodeState.get("TOTPType")== "FRTOTP"){
  var FRTOTP ="FRTOTP";
registerMFAMethod(mfaMethod,usrKOGID, null, null,null,FRTOTP,null,null,null);
if(registerMFAMethod){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "ForgeRock_TOTP"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForgeRock TOTP registered successfully for authentication"+"::"+credId +"::"+mail);  
 nodeState.putShared("phoneReg","true")
 eventDetails.MFAValue = mfaMethod
 eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
 eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""   
 auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
 outcome = NodeOutcome.SUCCESS;
 
}
else{
    auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the forgerock authenticator app"+"::"+mail);
}
 
 }
else if(nodeState.get("TOTPType")== "MSTOTP"){
    var MSTOTP = "MSTOTP";
    registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,null,MSTOTP,null);
    if(registerMFAMethod){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "Microsoft_TOTP"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft TOTP registered successfully for authentication"+"::"+mail); 
         nodeState.putShared("phoneReg","true")
 eventDetails.MFAValue = mfaMethod
 eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
 eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
 auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    }
    else{
         auditLib.auditLogger("MFA008",sessionDetails,"Authenticator App Registration Failure", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the microsoft authenticator app"+"::"+mail);
    }
    }
else if(nodeState.get("TOTPType")== "GTOTP"){
    var GTOTP = "GTOTP"
    registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,null,null,GTOTP);
    if(registerMFAMethod){
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "Google_TOTP"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google TOTP registered successfully for authentication"+"::"+mail); 
         nodeState.putShared("phoneReg","true")
 eventDetails.MFAValue = mfaMethod
 eventDetails["MFAMethod"] = nodeState.get("MFAMethod")
 eventDetails["MFATYPE"] = nodeState.get("MFAType") || ""
 auditLib.auditLogger("MFA007",sessionDetails,"Register Authenticator App", eventDetails,userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        outcome = NodeOutcome.SUCCESS;
    }
    else{
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
function registerMFAMethod(mfaMethod, usrKOGID, email, telephoneNumber,credId,FRTOTP,FRPUSH,MSTOTP,GTOTP) {
    try {
        logger.debug("MFA Method is = "+mfaMethod);
        if ((mfaMethod === "SMSVOICE" && telephoneNumber !=null )) {
        if(!lookupInMFAObject(usrKOGID, telephoneNumber, mfaMethod)) {
            createMFAObject(usrKOGID,"SMSVOICE",telephoneNumber,"ACTIVE",true);
         }
        return true;
        } 
        else if (mfaMethod === "EMAIL" && email !=null ) {
        if(!lookupInMFAObject(usrKOGID, email, mfaMethod)) {
            createMFAObject(usrKOGID,"EMAIL",email,"ACTIVE");
            return true;
         }
    } 
    else if (mfaMethod === "TOTP" && FRTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "FORGEROCK", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "PUSH" && FRPUSH !=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        createMFAObject(usrKOGID, "PUSH", "FORGEROCK", "ACTIVE",false);
            return true;
        }
    }
    else if (mfaMethod === "TOTP" && MSTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "MICROSOFT", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "MICROSOFT", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "TOTP" && GTOTP!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "GOOGLE", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "GOOGLE", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "SYMANTEC" && credId!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "SYMANTEC", mfaMethod)) {
        createMFAObject(usrKOGID, "SYMANTEC", credId, "ACTIVE",false);
        }
    }
    else if (mfaMethod === "SECONDARY_EMAIL" && secondaryEmail !=null ) {
    logger.debug("inside if");
        if(!lookupInMFAObject(usrKOGID, secondaryEmail, mfaMethod)) {
         var createResult = createMFAObject(usrKOGID,"SECONDARY_EMAIL",secondaryEmail,"ACTIVE", true);
         logger.debug("createResult" +JSON.stringify(createResult));
            if (createResult._id){
                return true;
            }
            else{
             return false;   
            }
         }
        else{
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

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
  try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.debug("KYID auditDetail " + auditData)

        // var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
        // var risk = nodeState.get("risk") || "" ;
        // var requestStatus = nodeState.get("requestStatus") || "" ;
        // var riskReasonId = nodeState.get("riskReasonId") || "" ;
        // var riskReason = nodeState.get("riskReason") || "" ;
        // var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
        // var riskBand = nodeState.get("riskBand") || "" ;
        // var failureReason = nodeState.get("failureReason") || "" ;

        // var mfajsonObj = {
        //     'KOGId': usrKOGID,
        //     'MFAMethod': method,
        //     'MFAValue': usrMfaValue,
        //     'MFAStatus': status,
        //     'isRecoveryOnly': isRecoveryOnly,
        //     'createDate': auditData.createdDate,
        //     'createDateEpoch': auditData.createdDateEpoch,
        //     'createdBy': auditData.createdBy,
        //     'createdByID': auditData.createdByID,
        //     'updateDate': auditData.updatedDate,
        //     'updateDateEpoch': auditData.updatedDateEpoch,
        //     'updatedBy': auditData.updatedBy,
        //     'updatedByID': auditData.updatedByID,
        //     'transactionId': transactionIdLN,
        //     'risk': risk,
        //     'requestStatus': requestStatus,
        //     'riskReason': riskReasonId,
        //     'riskReasonID': riskReason,
        //     'riskReasonDescription': riskReasonDescription,
        //     'riskBand,': riskBand,
        //     'failureReason': failureReason
        // };
      
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
            'updatedByID': auditData.updatedByID
        };
      
    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in audData" + "::" + error);
    }

    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
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
