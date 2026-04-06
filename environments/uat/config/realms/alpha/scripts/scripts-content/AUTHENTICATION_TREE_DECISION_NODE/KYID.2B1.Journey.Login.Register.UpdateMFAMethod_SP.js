var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

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

var errMsg = {};
var libError = null;
var msg = null;
var outcome=NodeOutcome.FAILED;
libError = require("KYID.2B1.Library.Loggers");
var mfaMethod = nodeState.get("MFAMethod");
var usrKOGID = nodeState.get("KOGID");
var mail = nodeState.get("mail");
if(mfaMethod){
if(mfaMethod == "email"){
 var email = nodeState.get("email"); 
 registerMFAMethod(mfaMethod,usrKOGID, email, null,null,null,null,null,null);
}
else if(mfaMethod == "voice" || mfaMethod =="sms" ){
var mfaMethod = "SMSVOICE"
 var telephoneNumber = nodeState.get("telephoneNumber"); 
 registerMFAMethod(mfaMethod,usrKOGID, null,telephoneNumber,null,null,null,null,null);
 // nodeState.putShared("MFAMethodRegisterd","Phone");
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "Phone"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg)); 
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Mobile phone registered successfully for authentication"+"::"+telephoneNumber +"::"+mail);
 nodeState.putShared("actionFlag","1");
 nodeState.putShared("mobileNumber",telephoneNumber);
 outcome = NodeOutcome.ADDMOBILE;
}
else if(mfaMethod == "SYMANTEC"){
  var credId = nodeState.get("credId"); 
 registerMFAMethod(mfaMethod,usrKOGID, null, null,credId,null,null,null,null);
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "SYMANTEC"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Syamtec registered successfully for authentication"+"::"+credId +"::"+mail);
}
else if(mfaMethod == "PUSH"){
  var FRPUSH = "PUSH"; 
 registerMFAMethod(mfaMethod,usrKOGID, null, null,null,null,FRPUSH,null,null);
 errMsg["code"] = "INF-PRE-SYS-001";
 errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
 errMsg["MFAMethod"] = "ForgeRock_PUSH"
 nodeState.putShared("MFAMethodRegisterd",JSON.stringify(errMsg));
 nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForgeRock PUSH registered successfully for authentication" +"::"+mail);
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
 
}
else{
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
    }
    else{
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
    }
    else{
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An unexpected error has occurred while registering the google authenticator app"+"::"+mail);
    }
    }

 
}
    logger.error("Outcome is "+ outcome);
   action.goTo(outcome);
}
else{
    action.goTo(outcome);
}



// Functions
function registerMFAMethod(mfaMethod, usrKOGID, email, telephoneNumber,credId,FRTOTP,FRPUSH,MSTOTP,GTOTP) {
    try {
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
        logger.error("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "FORGEROCK", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "PUSH" && FRPUSH !=null) {
        logger.error("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "FORGEROCK", mfaMethod)) {
        createMFAObject(usrKOGID, "PUSH", "FORGEROCK", "ACTIVE",false);
            return true;
        }
    }
    else if (mfaMethod === "TOTP" && MSTOTP!=null) {
        logger.error("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "MICROSOFT", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "MICROSOFT", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "TOTP" && GTOTP!=null) {
        logger.error("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "GOOGLE", mfaMethod)) {
        createMFAObject(usrKOGID, "TOTP", "GOOGLE", "ACTIVE",false);
            return true;
        }
    }
   else if (mfaMethod === "SYMANTEC" && credId!=null) {
        logger.error("mfaMethod: "+mfaMethod)
        if(!lookupInMFAObject(usrKOGID, "SYMANTEC", mfaMethod)) {
        createMFAObject(usrKOGID, "SYMANTEC", credId, "ACTIVE",false);
        }
    }
    else{
        return false;
    }
    
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects"+"::"+error);
    }

    

}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.error("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status,
        'isRecoveryOnly': isRecoveryOnly
        
    };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue,mfaMethod) {
    logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
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
