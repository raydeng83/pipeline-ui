
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Create User in AIC",
    script: "Script",
    scriptName: "KYID.2B1.SelfRegistration.CreateUserInAIC",
    timestamp: dateTime,
    idmCreateOperationFailed: "IDM Create Operation Failed",
    mfaCreateOperationFailed: "MFA Create Operation Failed",
    exceptionErrMsg: "Error during user creation: ",
    errorId_AccountCreationFailed:"errorID::KYID002",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};

try {
    var userData = {};
    var availableMFAMethods=[];
    var primaryEmail = null;
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    if(nodeState.get("verifiedPrimaryEmail") != null){
        primaryEmail=nodeState.get("verifiedPrimaryEmail").toLowerCase();
        availableMFAMethods.push("EMAIL");
    }
    var usrLastName = null;
    if(nodeState.get("lastName") !=null ){
        usrLastName=nodeState.get("lastName").toLowerCase();
    }
    var usrFirstName = null;
    if(nodeState.get("givenName") !=null){
        usrFirstName=nodeState.get("givenName").toLowerCase();
    }
    var usrPassword;
    if(nodeState.get("password") !=null ){
        usrPassword=nodeState.get("password")
    }
    var telephoneNumber = null;
    //var telephoneNumber = "";
    if(nodeState.get("verifiedTelephoneNumber") !=null ){
        telephoneNumber=nodeState.get("verifiedTelephoneNumber").toLowerCase();
        availableMFAMethods.push("SMSVOICE");
    }
    var verifiedAlternateEmail = null;
    if(nodeState.get("verifiedAlternateEmail") !=null ){
        verifiedAlternateEmail=nodeState.get("verifiedAlternateEmail").toLowerCase();
        availableMFAMethods.push("SECONDARY_EMAIL");
    }
    var accountStatus = "active";
    var external = "External";
    var usrKOGID = generateGUID();
    var domain = "External"

    // Creating JSON object for user creation
    if(telephoneNumber!=null){
        userData = {
        givenName: usrFirstName,
        sn: usrLastName,
        mail: primaryEmail,
        userName: usrKOGID,
        accountStatus: accountStatus,
        password: usrPassword,
        telephoneNumber:telephoneNumber,
        frUnindexedString1: external,
        frUnindexedString2: domain
        
    };
       
    }
    else{
        userData = {
        givenName: usrFirstName,
        sn: usrLastName,
        mail: primaryEmail,
        userName: usrKOGID,
        accountStatus: accountStatus,
        password: usrPassword,
        frUnindexedString1: external,
        frUnindexedString2: domain
    };
    }
    logger.debug("User Input Data"+ JSON.stringify(userData));
    var isUserCreated = createUser(userData);
    if(isUserCreated == true){
        if(availableMFAMethods.includes("EMAIL")){
            var mfaMethod = "EMAIL";
            createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
        }
        if(availableMFAMethods.includes("SMSVOICE")){
            var mfaMethod = "SMSVOICE";
            createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
        }
        if(availableMFAMethods.includes("SECONDARY_EMAIL")){
            var mfaMethod = "SECONDARY_EMAIL";
            createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
        }
        action.goTo(nodeOutcome.SUCCESS)
        
    }
    else{
        
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user"+"::"+primaryEmail+"::"+nodeConfig.errorId_AccountCreationFailed);
        action.goTo(nodeOutcome.ERROR);
    }

    

    

} catch (error) {
    nodeLogger.error(transactionid+"::"+timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error in main execution"  +"::"+error);
    action.goTo(nodeOutcome.ERROR);
}



function createUser(userData) {
    try {
         var createUserResponse = openidm.create("managed/alpha_user", null, userData);
          nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"createUserResponse Response::"+createUserResponse )
          if(createUserResponse){
          nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Account created successfully for the user"  +"::"+primaryEmail);    
              return true;
          }
        else{
            return false;
        }
                  
    } catch (error) {
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user"+"::"+primaryEmail+"::"+nodeConfig.errorId_AccountCreationFailed+"::"+error);
        // nodeLogger.error(nodeConfig.exceptionErrMsg + error);
        action.goTo(nodeOutcome.ERROR)
    }
    
}

// createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);

function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber) {
    try {
        if ((mfaMethod === "SMSVOICE" && telephoneNumber !=null )) {
        if(!lookupInMFAObject(usrKOGID, telephoneNumber)) {
            createMFAObject(usrKOGID,"SMSVOICE",telephoneNumber,"ACTIVE",true);
         }
    } 
    if (mfaMethod === "EMAIL" && primaryEmail !=null ) {
        if(!lookupInMFAObject(usrKOGID, primaryEmail)) {
            createMFAObject(usrKOGID,"EMAIL",primaryEmail,"ACTIVE",false);
         }
    } 
    if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail!=null) {
        logger.debug("mfaMethod: "+mfaMethod)
        createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE",true);
    } 
        
    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects"+"::"+error);
    }

    

}

function createMFAObject(usrKOGID, method, usrMfaValue, status,isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status,
        'isRecoveryOnly':isRecoveryOnly
    };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});
	if (mfaMethodResponses.result.length>0){
       for(i=0;i<mfaMethodResponses.result.length;i++){
           var mfaMethodResponse = mfaMethodResponses.result[i];
		   if(mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue)===0 && 
				mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE")===0) {
			   return true;
		   }
	   }
	}
	return false;
}
/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}











