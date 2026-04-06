
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
  //  nodeState.putShared("verifiedPrimaryEmail","testag90@mailinator.com")
    if(nodeState.get("verifiedPrimaryEmail") != null){
        primaryEmail=nodeState.get("verifiedPrimaryEmail").toLowerCase();
        availableMFAMethods.push("EMAIL");
    }
    var usrFirstName = null;
    if(nodeState.get("givenName") !=null){
        usrFirstName=nodeState.get("givenName").toLowerCase();
    }
    var usrLastName = null;
    if(nodeState.get("lastName") !=null ){
        usrLastName=nodeState.get("lastName").toLowerCase();
    }
    var usrMiddleName =null;
    if(nodeState.get("custom_middleName") !=null){
        usrMiddleName = nodeState.get("custom_middleName")
    }
    var usrGender = null;
    if(nodeState.get("custom_gender") !=null){
        usrGender = nodeState.get("custom_gender")
    }
    var usrdateOfBirth = null;
    if(nodeState.get("custom_dateofBirth") !=null){
        usrdateOfBirth = nodeState.get("custom_dateofBirth")
    }
    var usrpostalAddress = null;
    if(nodeState.get("postalAddress") !=null){
        usrpostalAddress = nodeState.get("postalAddress")
    }
    var usrpostalAddress2 = null;
    if(nodeState.get("custom_postalAddress2") !=null){
        usrpostalAddress2 = nodeState.get("custom_postalAddress2")
    }
    var usrcity = null;
    if(nodeState.get("city") !=null){
        usrcity = nodeState.get("city")
    }
    var usrstateProvince = "";
    if(nodeState.get("stateProvince") !=null){
        usrstateProvince = nodeState.get("stateProvince")
    }
    var usrcounty = null;
    if(nodeState.get("custom_county") !=null){
        usrcounty = nodeState.get("custom_county")
    }
    var usrpostalCode = null;
    if(nodeState.get("postalCode") !=null){
        usrpostalCode = nodeState.get("postalCode")
    }
    var suffix=null;
    if(nodeState.get("custom_suffix")!=null){
        suffix=nodeState.get("custom_suffix")
    }
    var usrPassword;
    if(nodeState.get("password") !=null ){
        usrPassword=nodeState.get("password")
    }
    
    var telephoneNumber = null;
    //var telephoneNumber = "";
    if(nodeState.get("verifiedTelephoneNumber") !=null ){
        telephoneNumber=nodeState.get("verifiedTelephoneNumber").toLowerCase();
        logger.debug("phone no is: "+telephoneNumber)
        availableMFAMethods.push("SMSVOICE");
    }
    var verifiedAlternateEmail = null;
    if(nodeState.get("verifiedAlternateEmail") !=null ){
        verifiedAlternateEmail=nodeState.get("verifiedAlternateEmail").toLowerCase();
        availableMFAMethods.push("SECONDARY_EMAIL");
    }

   // var accountExistInAD = null;
    // if(nodeState.get("doesaccountExistsInAD") !=null ){
    //     accountExistInAD=nodeState.get("doesaccountExistsInAD");
    // }

    var usrKOGID = null;
    if(nodeState.get("fetchedKOGID") !=null ){
        usrKOGID=nodeState.get("fetchedKOGID");
    }

    var usrUPN = null;
    if(nodeState.get("fetchedUPN") !=null ){
        usrUPN=nodeState.get("fetchedUPN");
    }
	
	var usrLogon = null;
    if(nodeState.get("fetchedLogon") !=null ){
        usrLogon=nodeState.get("fetchedLogon");
    }
    
    var accountStatus = "active";
    
    var accountExistInAD = true;
    if(nodeState.get("failedADFlag") === "true"){
    var accountExistInAD = false;
    }
    //var external = "External";
    //   var usrKOGID = generateGUID();
    //var domain = "External"
    // Creating JSON object for user creation

   
        userData = {
        givenName: usrFirstName,
        sn: usrLastName,
        custom_middleName: usrMiddleName,
        mail: primaryEmail,
        userName: usrKOGID,
        custom_gender: usrGender,
        custom_dateofBirth: usrdateOfBirth,
        postalAddress: usrpostalAddress,
        custom_postalAddress2: usrpostalAddress2,
        city: usrcity,
        stateProvince: usrstateProvince,
        postalCode: usrpostalCode,
        accountStatus: accountStatus,
        password: usrPassword,
        telephoneNumber:telephoneNumber,
        custom_ADFlag:accountExistInAD,
        frIndexedString1:usrUPN,
        frIndexedString2:usrLogon
        //custom_suffix:suffix
    };
  
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
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects"+"::"+error);
    }

    

}

function createMFAObject(usrKOGID, method, usrMfaValue, status,isRecoveryOnly) {
    logger.error("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
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