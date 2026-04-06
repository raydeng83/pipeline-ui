/**
* Function: KYID.2B1.SelfRegistration.CreateUserInAIC
* Description: This script creates a user in the alpha environment. It also handles MFA registration if required.
* Param(s):
* Input:
* - usrEmailAddress
* - usrLastName
* - usrFirstName
* - usrPassword
* - phoneNumber
* - objectAttributes
* - mail
* - sn
* - givenName
* Returns: 
* - Success: User created successfully.
* - Error: User creation failed.

*/

// var dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "Create User in AIC",
//     script: "Script",
//     scriptName: "KYID.2B1.SelfRegistration.CreateUserInAIC",
//     timestamp: dateTime,
//     idmCreateOperationFailed: "IDM Create Operation Failed",
//     mfaCreateOperationFailed: "MFA Create Operation Failed",
//     exceptionErrMsg: "Error during user creation: ",
//     end: "Node Execution Completed"
// };

// // Node outcomes
// var nodeOutcome = {
//     SUCCESS: "True",
//     ERROR: "False"
// };

// // Logging Function
// var nodeLogger = {
//     debug: function (message) {
//         logger.debug(message);
//     },
//     error: function (message) {
//     }
// };

// nodeLogger.debug(nodeConfig.begin);

// var jsonObj = {};
// var jsonObj1 = {};
// var createUserSuccess = false;

try {
    var availableMFAMethods=[];
    var userExist = "false";
    var usrKOGID = null;
    var primaryEmail = null;
    // var collectedPrimaryEmail = null;
    var verifiedAlternateEmail = null;
    var telephoneNumber=null;
    var password;
    var userID = null;
    if(nodeState.get("verifiedPrimaryEmail") != null){
        primaryEmail = nodeState.get("verifiedPrimaryEmail")
        availableMFAMethods.push("EMAIL");
    }

    if(nodeState.get("userKogId") != null){
        usrKOGID = nodeState.get("userKogId")
    }
    if(nodeState.get("verifiedAlternateEmail") != null){
        verifiedAlternateEmail = nodeState.get("verifiedAlternateEmail")
        availableMFAMethods.push("SECONDARY_EMAIL");
    }
    if(nodeState.get("verifiedTelephoneNumber") != null){
        telephoneNumber = nodeState.get("verifiedTelephoneNumber")
        availableMFAMethods.push("SMSVOICE");
    }
    if(nodeState.get("password") != null){
        password = nodeState.get("password")
     }
    if(nodeState.get("userExist") != null){
        userExist = nodeState.get("userExist")
     }
    if(nodeState.get("userId") != null){
        userID = nodeState.get("userId")
     }
    logger.error("User ID is "+ userID)
    

    if(userExist == "true"){
        logger.error("availableMFAMethods.length is  " + availableMFAMethods.length)
        var response = patchUser (userID,telephoneNumber,primaryEmail);
        if(response== true){
            
            if(availableMFAMethods.includes("EMAIL")){
                var mfamethod = "EMAIL";
                createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
                
            }
            if(availableMFAMethods.includes("SMSVOICE")){
                var mfamethod = "SMSVOICE";
                createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
                
            }
            if(availableMFAMethods.includes("SECONDARY_EMAIL")){
                var mfamethod = "SECONDARY_EMAIL";
                createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
                
            }

            }
            

            action.goTo("true");
            
            
        
    }
    else{
        action.goTo("false");
    }
}
catch(error){
    logger.error("Error Occured ::"+error )
}

    
//     var usrEmailAddress = nodeState.get("mail");
    
//     var usrLastName = nodeState.get("sn");
//     var usrFirstName = nodeState.get("givenName");
//     //var usrPassword = nodeState.get("objectAttributes").get("password");
//     var usrPassword = nodeState.get("password");
//     var phoneNumber = nodeState.get("telephoneNumber");
//     var usrKOGID = generateGUID();
//     nodeState.putShared("usrKOGID", usrKOGID);

//     var accountStatus = "Active";
//     var external = "External";
//     var frUnindexedString2 = systemEnv.getProperty("esv.kyid.dev.ext.ad.domain");
    

//     // Creating JSON object for user creation
//     jsonObj = {
//         givenName: usrFirstName,
//         sn: usrLastName,
//         mail: usrEmailAddress,
//         userName: usrKOGID,
//         accountStatus: accountStatus,
//         password: usrPassword,
//         telephoneNumber: phoneNumber,
//         frUnindexedString1: external,
//         frUnindexedString2: frUnindexedString2
//     };

//     jsonObj1 = Object.assign({}, jsonObj);
//     delete jsonObj1.telephoneNumber;

//     // Logging input data
//     nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Data: " + JSON.stringify(jsonObj));

//     // Attempt user creation
//     var createUserResponse;
//     if (!phoneNumber) {

//         createUserResponse = openidm.create("managed/alpha_user", null, jsonObj1);
//     } else {

//         createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
//     }


//     // MFA Registration
//     if (createUserResponse) {

//         if (usrEmailAddress && !lookupInMFAObject(usrKOGID, usrEmailAddress)) {
//             nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Email Registration in Progress");
//             createMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE");
//         }
//     }
//     nodeLogger.debug(nodeConfig.end);
//     action.goTo(nodeOutcome.SUCCESS);

// } catch (error) {
//     action.goTo(nodeOutcome.ERROR);
// }

// /**
//  * Create MFA Object
//  */
// // function createMFAObject(usrKOGID, method, usrMfaValue, status) {
// //     var mfajsonObj = {
// //         KOGId: usrKOGID,
// //         MFAMethod: method,
// //         MFAValue: usrMfaValue,
// //         MFAStatus: status
// //     };
// //     openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
// // }

// /**
//  * Lookup MFA Object
//  */
// // function lookupInMFAObject(usrKOGID, usrMfaValue) {
// //     var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
// //         "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
// //     });

// //     if (mfaMethodResponses.result.length > 0) {
// //         for (var i = 0; i < mfaMethodResponses.result.length; i++) {
// //             var mfaMethodResponse = mfaMethodResponses.result[i];
// //             if (mfaMethodResponse["MFAValue"] === usrMfaValue &&
// //                 mfaMethodResponse["MFAStatus"] === "ACTIVE") {
// //                 return true;
// //             }
// //         }
// //     }
// //     return false;
// // }

// /**
//  * Generate Unique GUID
//  */
// function generateGUID() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//         const r = Math.random() * 16 | 0;
//         return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
//     });
// }

function patchUser (userId,telephoneNumber,primaryEmail,password) {
    try {
        if(userId){
        if (primaryEmail!= null){
            var updateEmail = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "mail", "value": primaryEmail}]);
            logger.error("Email is Updated"+ updateEmail);
        }
        if (telephoneNumber != null){
            var upatePhoneNumber = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "telephoneNumber", "value": telephoneNumber}]);
            logger.error("Phone Number is Updated"+ upatePhoneNumber);
            
        }
        if(password != null){
            var updatePassword = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "password", "value": password}]);
        }

        var updateStatus = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "accountStatus", "value": "active"}]);
        return true;
        // var updatePassword = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "password", "value": password}]);
        }
        else{
            logger.error("KOG ID is not Present")
            return false;
        }
    } catch (error) {
        logger.error("Error Occurred "+ error)
        return "error"
    }
    
}
// createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber) {
    try {
        if ((mfaMethod === "SMSVOICE" && telephoneNumber !=null )) {
        if(!lookupInMFAObject(usrKOGID, telephoneNumber)) {
            createMFAObject(usrKOGID,"SMSVOICE",telephoneNumber,"ACTIVE");
         }
    } 
    if (mfaMethod === "EMAIL" && primaryEmail !=null ) {
        if(!lookupInMFAObject(usrKOGID, primaryEmail)) {
            createMFAObject(usrKOGID,"EMAIL",primaryEmail,"ACTIVE");
         }
    } 
    if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail!=null) {
        logger.error("mfaMethod: "+mfaMethod)
        createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE");
    } 
        
    } catch (error) {
        logger.error("Error Occured"+ error)
    }

    

}

function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    logger.error("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status
    };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
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







