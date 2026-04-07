var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger")

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
    errorId_AccountCreationFailed: "errorID::KYID002",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
var nodeLogger = {
    debug: function(message) {
        logger.debug(message);
    },
    error: function(message) {
        logger.error(message);
    },
    info: function(message) {
        logger.info(message);
    }
};

var userId = nodeState.get("userId") || null
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName);
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var browser = null;
if (requestHeaders.get("user-agent")) {
    browser = requestHeaders.get("user-agent")[0];
}

var os = null;
if (requestHeaders.get("sec-ch-ua-platform")) {
    os = requestHeaders.get("sec-ch-ua-platform");
}

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("verifiedPrimaryEmail") || nodeState.get("mail") || "";
var sessionDetails = {}
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];


// Helper function to include non-null values only
function addIfNotNull(obj, key, value) {
    if (value !== null && value !== undefined && value !== "") {
        obj[key] = value;
    }
}

function getLangCode(langCode, languageMap){
    var languageMap = languageMap;
    var langCode = langCode;
    logger.debug("languageMap :: " + languageMap)
    logger.debug("langCode :: " + langCode)
    for(var key in languageMap){
        if(languageMap[key] == langCode){
             logger.debug("langKey :: " + key)
             return key;
        }
    } 
}


try {
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
    logger.debug("KYID auditDetail " + JSON.stringify(auditData))
    var userData = {};
    var availableMFAMethods = [];
    var primaryEmail = null;
    var transactionid = requestHeaders.get("X-ForgeRock-TransactionId")
    //  nodeState.putShared("verifiedPrimaryEmail","testag90@mailinator.com")
    if (nodeState.get("verifiedPrimaryEmail") != null) {
        primaryEmail = nodeState.get("verifiedPrimaryEmail").toLowerCase();
        availableMFAMethods.push("EMAIL");
    }
    var usrFirstName;
    if (nodeState.get("givenName") != null) {
        usrFirstName = nodeState.get("givenName").toLowerCase();
    }
    var usrLastName;
    if (nodeState.get("lastName") != null) {
        usrLastName = nodeState.get("lastName").toLowerCase();
    }

    //var fullname=usrFirstName+" "+usrLastName;


    var usrMiddleName;
    if (nodeState.get("custom_middleName") != null) {
        usrMiddleName = nodeState.get("custom_middleName")
    }
    var usrGender = null;
    if (nodeState.get("custom_gender") != null) {
        usrGender = nodeState.get("custom_gender")
    }
    var usrdateOfBirth;
    if (nodeState.get("custom_dateofBirth") != null) {
        usrdateOfBirth = nodeState.get("custom_dateofBirth")
    }
    var usrpostalAddress = null;
    if (nodeState.get("postalAddress") != null) {
        usrpostalAddress = nodeState.get("postalAddress")
    }
    var usrpostalAddress2;
    if (nodeState.get("custom_postalAddress2") != null) {
        usrpostalAddress2 = nodeState.get("custom_postalAddress2")
    }
    var usrcity;
    if (nodeState.get("city") != null) {
        usrcity = nodeState.get("city")
    }
    var usrstateProvince;
    if (nodeState.get("stateProvince") != null) {
        usrstateProvince = nodeState.get("stateProvince")
    }
    var usrcounty;
    if (nodeState.get("custom_county") != null) {
        usrcounty = nodeState.get("custom_county")
        logger.debug("PrintCounty" + usrcounty);
    }
    var usrpostalCode;
    if (nodeState.get("postalCode") != null) {
        usrpostalCode = nodeState.get("postalCode")
    }
    var usrzipExtension;
    if (nodeState.get("zipExtension") != null) {
        usrzipExtension = nodeState.get("zipExtension")
    }

    // var usrPassword;
    // if (nodeState.get("password") != null) {
    //     usrPassword = nodeState.get("password")
    // }

    var telephoneNumber;
    //var telephoneNumber = "";
    if (nodeState.get("verifiedTelephoneNumber") != null) {
        telephoneNumber = nodeState.get("verifiedTelephoneNumber").toLowerCase();
        logger.debug("phone no is: " + telephoneNumber)
        availableMFAMethods.push("SMSVOICE");
    }
    var verifiedAlternateEmail;
    if (nodeState.get("verifiedAlternateEmail") != null) {
        verifiedAlternateEmail = nodeState.get("verifiedAlternateEmail").toLowerCase();
        availableMFAMethods.push("SECONDARY_EMAIL");
    }

    // var accountExistInAD = null;
    // if(nodeState.get("doesaccountExistsInAD") !=null ){
    //     accountExistInAD=nodeState.get("doesaccountExistsInAD");
    // }

    var usrKOGID;
    if (nodeState.get("fetchedKOGID") != null) {
        usrKOGID = nodeState.get("fetchedKOGID");
    }

    var usrUPN;
    if (nodeState.get("fetchedUPN") != null) {
        usrUPNTemp = nodeState.get("fetchedUPN");
        usrUPN= usrUPNTemp.toLowerCase();
    }

    var usrLogon
    if (nodeState.get("fetchedLogon") != null) {
        usrLogonTemp = nodeState.get("fetchedLogon");
        usrLogon= usrLogonTemp.toLowerCase();
    }

    var custom_Reason = "";
    var highRiskFlag =  nodeState.get("highRiskFlag")
    if(((nodeState.get("riskIndicator") && nodeState.get("riskIndicator").toLowerCase() === "high") || (nodeState.get("risk") && nodeState.get("risk").toLowerCase() === "high") || (nodeState.get("mailRisk") && nodeState.get("mailRisk").toLowerCase() === "high") || (nodeState.get("phoneRisk") && nodeState.get("phoneRisk").toLowerCase() === "high") || (nodeState.get("alternateEmailRisk") && nodeState.get("alternateEmailRisk").toLowerCase() === "high")) && (highRiskFlag && highRiskFlag == true)){
         var accountStatus = "inactive";
         // if(nodeState.get("mailRisk") && nodeState.get("mailRisk") === "high"){
         //      custom_Reason = "LexisNexis: High Risk Transaction - Email"
         // }else if(nodeState.get("phoneRisk")  && nodeState.get("phoneRisk") === "high"){
         //      custom_Reason = "LexisNexis: High Risk Transaction - Mobile Phone"
         // }else if(nodeState.get("alternateEmailRisk")  && nodeState.get("alternateEmailRisk") === "high"){
         //      custom_Reason = "LexisNexis: High Risk Transaction - Alternate Email"
         // }else if (nodeState.get("riskIndicator")){
         //     custom_Reason = "LexisNexis: High Risk Transaction - Identity"
         // }else{
         //     custom_Reason = "LexisNexis: High Risk Transaction - {Identity | Email | Mobile Phone}"
         // }  

        var riskArray = [];
        var mailRisk = nodeState.get("mailRisk");
        var phoneRisk = nodeState.get("phoneRisk");
        var altEmailRisk = nodeState.get("alternateEmailRisk");
        var riskIndicator = nodeState.get("riskIndicator");
        
        // 1. Evaluate risk levels
        if (mailRisk && String(mailRisk).toLowerCase() === "high") {
            riskArray.push("Primary Email");
        }
        if (phoneRisk && String(phoneRisk).toLowerCase() === "high") {
            riskArray.push("Mobile Number");
        }
        if (altEmailRisk && String(altEmailRisk).toLowerCase() === "high") {
            riskArray.push("Alternate Email");
        }
        if (riskIndicator && riskIndicator.toLowerCase() === "high") {
            riskArray.push("Identity");
        }
        
        // 2. Build the custom_Reason string
        var prefix = "LexisNexis: High Risk Transaction - ";
        var custom_Reason = "";
        
        if (riskArray.length > 0) {
            // Map each item to include the full prefix
            var formattedRisks = [];
            for (var i = 0; i < riskArray.length; i++) {
                formattedRisks.push(prefix + riskArray[i]);
            }
            custom_Reason = formattedRisks.join(" | ");
        } else {
            // Default fallback with repeated prefixes
            custom_Reason = prefix + "Identity | " + prefix + "Primary Email | " + prefix + "Mobile Number";
        }
        
        logger.error("Final custom_Reason: " + custom_Reason);
        nodeState.putShared("custom_Reason", custom_Reason);
        
    }else{
         var accountStatus = "active";
    }
   

    var accountExistInAD = true;
    if (nodeState.get("failedADFlag") === "true") {
        var accountExistInAD = false;
    }

    var suffix
    if (nodeState.get("custom_suffix")) {
        suffix = nodeState.get("custom_suffix")
    }

    var languagePreference
    if(nodeState.get("userLanguage")){
        var languagePreference = nodeState.get("languagePreference") || "1";
    }

    var adDomain;
    if (nodeState.get("audit_LOGON") != null) {
        adDomain = nodeState.get("audit_LOGON").split("@")[1];
        logger.error("adDomain in KOG CreateAccount API Response => "+adDomain)
    }
    
    //var external = "External";
    //   var usrKOGID = generateGUID();
    //var domain = "External"
    // Creating JSON object for user creation


    //     userData = {
    //     givenName: usrFirstName,
    //     sn: usrLastName,
    //     custom_middleName: usrMiddleName,
    //     mail: primaryEmail,
    //     userName: usrKOGID,
    //     custom_gender: usrGender,
    //     custom_dateofBirth: usrdateOfBirth,
    //     postalAddress: usrpostalAddress,
    //     custom_postalAddress2: usrpostalAddress2,
    //     city: usrcity,
    //     stateProvince: usrstateProvince,
    //     postalCode: usrpostalCode,
    //     accountStatus: accountStatus,
    //     password: usrPassword,
    //     telephoneNumber:telephoneNumber,
    //     custom_ADFlag:accountExistInAD,
    //     frIndexedString1:usrUPN,
    //     frIndexedString2:usrLogon
    // };
    // Construct userData object with only non-null values
    addIfNotNull(userData, "givenName", usrFirstName);
    addIfNotNull(userData, "sn", usrLastName);
    addIfNotNull(userData, "custom_middleName", usrMiddleName);
    addIfNotNull(userData, "mail", primaryEmail);
    addIfNotNull(userData, "userName", usrKOGID);
    addIfNotNull(userData, "custom_gender", usrGender);
    addIfNotNull(userData, "custom_dateofBirth", usrdateOfBirth);
    addIfNotNull(userData, "postalAddress", usrpostalAddress);
    addIfNotNull(userData, "custom_postalAddress2", usrpostalAddress2);
    addIfNotNull(userData, "city", usrcity);
    addIfNotNull(userData, "stateProvince", usrstateProvince);
    addIfNotNull(userData, "postalCode", usrpostalCode);
    addIfNotNull(userData, "accountStatus", accountStatus);
    addIfNotNull(userData, "telephoneNumber", telephoneNumber);
    addIfNotNull(userData, "custom_ADFlag", accountExistInAD);
    addIfNotNull(userData, "frIndexedString1", usrUPN.toLowerCase());
    addIfNotNull(userData, "frIndexedString2", usrLogon.toLowerCase());
    addIfNotNull(userData, "custom_userReleaseStatus", "2B");
    addIfNotNull(userData, "custom_suffix", suffix);
    addIfNotNull(userData, "custom_county", usrcounty);
    addIfNotNull(userData, "custom_zipExtension", usrzipExtension);
    addIfNotNull(userData, "custom_kyidAccountType", "P");
    addIfNotNull(userData, "custom_kyidProfileSetup", true);
    addIfNotNull(userData, "custom_languagePreference", languagePreference);

    addIfNotNull(userData, "custom_isJITDone", false);
    
    addIfNotNull(userData, "custom_createdByID", auditData.createdByID);
    addIfNotNull(userData, "custom_createDateISO", auditData.createdDate);
    addIfNotNull(userData, "custom_createDateEpoch", auditData.createdDateEpoch);
    addIfNotNull(userData, "custom_createdBy", auditData.createdBy);

    addIfNotNull(userData, "custom_updatedDateEpoch", auditData.updatedDateEpoch);
    addIfNotNull(userData, "custom_updatedDateISO", auditData.updatedDate);
    addIfNotNull(userData, "custom_updatedBy", auditData.updatedBy);
    addIfNotNull(userData, "custom_updatedByID", auditData.updatedByID);
    addIfNotNull(userData, "frUnindexedString2", adDomain);
    addIfNotNull(userData, "custom_Reason", custom_Reason);
    // addIfNotNull(userData, "cn",fullname);




    nodeState.putShared("audit_LOGON", usrLogon)

    logger.debug("User Input Data" + JSON.stringify(userData));
    var isUserCreated = createUser(userData);
    if (isUserCreated == true) {
        if (availableMFAMethods.includes("EMAIL")) {
            var mfaMethod = "EMAIL";
            createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber);
        }
        if (availableMFAMethods.includes("SMSVOICE")) {
            var mfaMethod = "SMSVOICE";
            logger.debug("going inside SMSVOICE MFA")
            createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber);
        }
        if (availableMFAMethods.includes("SECONDARY_EMAIL")) {
            var mfaMethod = "SECONDARY_EMAIL";
            createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber);
        }
        action.goTo(nodeOutcome.SUCCESS)

    } else {

        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user" + "::" + primaryEmail + "::" + nodeConfig.errorId_AccountCreationFailed);
        var userId = ""
        if (nodeState.get("verifiedPrimaryEmail")) {
            userId = nodeState.get("verifiedPrimaryEmail");
        } else {
            userId = ""
        }
        var eventDetails = {
            emailAddress: nodeState.get("verifiedPrimaryEmail") || ""
        };

        // var sessionDetails = null

        // auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure", eventDetails, userId, userId, transactionid)
        action.goTo(nodeOutcome.ERROR);
    }




} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error in main execution" + "::" + error);
    action.goTo(nodeOutcome.ERROR);
}



function createUser(userData) {
    try {
        var createUserResponse = null
        createUserResponse = openidm.create("managed/alpha_user", null, userData);
        var sessionRefId = nodeState.get("sessionRefId") || "";
        logger.error("sessionRefId in KYID.2B1.SelfRegistration.CreateUserInAIC is :: " + nodeState.get("sessionRefId"))
        sessionDetails["sessionRefId"] = sessionRefId || ""
        

        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "createUserResponse Response::" + createUserResponse)
        if (createUserResponse) {
            nodeState.putShared("createdUserId", createUserResponse._id)
            nodeState.putShared("audit_ID", createUserResponse._id)
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Account created successfully for the user" + "::" + primaryEmail);
            auditLib.auditLogger("ACC001", sessionDetails, "KYID Account Created", eventDetails, createUserResponse._id, createUserResponse._id, transactionId, userEmail, eventDetails.applicationName, sessionRefId, requestHeaders)
            return true;
        } else {
            auditLib.auditLogger("ACC002", sessionDetails, "Account Creation Failure", eventDetails, userEmail, userEmail, transactionId, userEmail, eventDetails.applicationName, sessionRefId, requestHeaders)
            return false;
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user" + "::" + primaryEmail + "::" + nodeConfig.errorId_AccountCreationFailed + "::" + error);
        // nodeLogger.error(nodeConfig.exceptionErrMsg + error);
        //action.goTo(nodeOutcome.ERROR)
        auditLib.auditLogger("ACC002", sessionDetails, "Account Creation Failure", eventDetails, userEmail, userEmail, transactionId, userEmail, eventDetails.applicationName, sessionRefId, requestHeaders)
        return false;
    }

}

// createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);

function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber) {
    try {
        if ((mfaMethod === "SMSVOICE" && telephoneNumber != null)) {
            if (!lookupInMFAObject(usrKOGID, telephoneNumber)) {
                createMFAObject(usrKOGID, "SMSVOICE", telephoneNumber, "ACTIVE", true);
            }
        }
        if (mfaMethod === "EMAIL" && primaryEmail != null) {
            if (!lookupInMFAObject(usrKOGID, primaryEmail)) {
                createMFAObject(usrKOGID, "EMAIL", primaryEmail, "ACTIVE", false);
            }
        }
        if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail != null) {
            logger.debug("mfaMethod: " + mfaMethod)
            createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true);
        }

    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects" + "::" + error);
    }



}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    // var mfajsonObj = {
    //     'KOGId': usrKOGID,
    //     'MFAMethod': method,
    //     'MFAValue': usrMfaValue,
    //     'MFAStatus': status,
    //     'isRecoveryOnly':isRecoveryOnly
    // };
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.debug("KYID auditDetail " + JSON.stringify(auditData))
        var transactionIdLN = null;
        var requestStatus = null;
        var riskReason = null;
        var riskReasonID = null;
        var riskReasonDescription = null;
        var riskBand = null;
        var failureReason = null;
        var risk = ""

        logger.debug("phoneRiskIndicator :: " + nodeState.get("phoneRiskIndicator"))
        logger.debug("emailRiskIndicator :: " + nodeState.get("emailRiskIndicator"))
        logger.debug("alternateEmailRiskIndicator :: " + nodeState.get("alternateEmailRiskIndicator"))
        
        if(method === "SMSVOICE"){
            logger.debug("inside SMSVOICE MFA")
            //var phoneRiskIndicator = nodeState.get("phoneRiskIndicator") ? JSON.parse(nodeState.get("phoneRiskIndicator")) : [] ;
            var emailPhoneRiskIndicator = nodeState.get("phoneRiskIndicator") ? JSON.parse(nodeState.get("phoneRiskIndicator")) : [] ;
            transactionIdLN = nodeState.get("phoneTransactionIdLN")  || emailPhoneRiskIndicator.transactionId || "" ;
            risk = nodeState.get("phoneRisk") || "" ;
            requestStatus = nodeState.get("phoneRequestStatus") || "" ;
            riskReason = nodeState.get("phoneRiskReason") || "" ;
            riskReasonID = nodeState.get("phoneRiskReasonId") || "" ;
            riskReasonDescription = nodeState.get("phoneRiskReasonDescription") || "" ;
            riskBand = nodeState.get("phoneRiskBand") || "" ;
            failureReason = nodeState.get("phoneFailureReason") || "" ;
            auditLog("SMSVOICE_CREATEACCOUNT_SUCCESS", "SMSVOICE OTP Success Create Account - MFA Reporting",method)
        }else if(method === "EMAIL"){
            logger.debug("inside EMAIL MFA")
            //var emailRiskIndicator = nodeState.get("emailRiskIndicator") ? JSON.parse(nodeState.get("emailRiskIndicator")) : [] ;
            var emailPhoneRiskIndicator = nodeState.get("emailRiskIndicator") ? JSON.parse(nodeState.get("emailRiskIndicator")) : [] ;
            transactionIdLN = nodeState.get("mailTransactionIdLN")  || emailPhoneRiskIndicator.transactionId || "" ;
            risk = nodeState.get("mailRisk") || "" ;
            requestStatus = nodeState.get("mailRequestStatus") || "" ;
            riskReason = nodeState.get("mailRiskReason") || "" ;
            riskReasonID = nodeState.get("mailRiskReasonID") || "" ;
            riskReasonDescription = nodeState.get("mailRiskReasonDescription") || "" ;
            riskBand = nodeState.get("mailRiskBand") || "" ;
            failureReason = nodeState.get("mailFailureReason") || "" ;
            auditLog("EMAIL_CREATEACCOUNT_SUCCESS", "EMAIL OTP Success Create Account - MFA Reporting",method)
        }else if(method === "SECONDARY_EMAIL"){
            logger.debug("inside SECONDARY_EMAIL MFA")
            //var emailRiskIndicator = nodeState.get("secondEmailRiskIndicator") ? JSON.parse(nodeState.get("secondEmailRiskIndicator")) : [] ;
            var emailPhoneRiskIndicator = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
            transactionIdLN = nodeState.get("alternateEmailTransactionIdLN")  || emailPhoneRiskIndicator.transactionId || "" ;
            risk = nodeState.get("alternateEmailRisk") || "" ;
            requestStatus = nodeState.get("alternateEmailRequestStatus") || "" ;
            riskReason = nodeState.get("alternateEmailRiskReason") || "" ;
            riskReasonID = nodeState.get("alternateEmailRiskReasonId") || "" ;
            riskReasonDescription = nodeState.get("alternateEmailRiskReasonDescription") || "" ;
            riskBand = nodeState.get("alternateEmailRiskBand") || "" ;
            failureReason = nodeState.get("alternateEmailFailureReason") || "" ;
            auditLog("SECONDARYEMAIL_CREATEACCOUNT_SUCCESS", "SECONDARYEMAIL OTP Success Create Account - MFA Reporting",method)
        }

        if(risk && risk.toLowerCase() === "high"){
            status = "highrisk"
        }
        // var mfajsonObj = {
        //        'KOGId': usrKOGID,
        //        'MFAMethod': method,
        //        'MFAValue': usrMfaValue,
        //        'MFAStatus': status,
        //        'isRecoveryOnly': isRecoveryOnly,
        //        'createDate': auditData.createdDate,
        //        'createDateEpoch': auditData.createdDateEpoch,
        //        'createdBy': auditData.createdBy,
        //        'createdByID': auditData.createdByID,
        //        'updateDate': auditData.updatedDate,
        //        'updateDateEpoch': auditData.updatedDateEpoch,
        //        'updatedBy': auditData.updatedBy,
        //        'updatedByID': auditData.updatedByID,
        //        'transactionId': transactionIdLN,
        //        'risk': risk,
        //        'requestStatus': requestStatus ? requestStatus : "",
        //        'riskReason':   riskReason ? riskReason : "",
        //        'riskReasonID':   riskReasonID ? riskReasonID : "",
        //        'riskReasonDescription':   riskReasonDescription ? riskReasonDescription : "",
        //        'riskBand,':   riskBand ? riskBand : "",
        //        'failureReason':   failureReason ? failureReason : "",
        //        'riskIndicator': emailPhoneRiskIndicator.riskIndicatorDetails || []
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
            'updatedByID': auditData.updatedByID,
            'transactionId': transactionIdLN,
            'risk': risk || "",
            // If the variable is null, undefined, or the literal string "undefined", return ""
            'requestStatus': (requestStatus && requestStatus !== "undefined") ? requestStatus : "",
            'riskReason': (riskReason && riskReason !== "undefined") ? riskReason : "",
            'riskReasonID': (riskReasonID && riskReasonID !== "undefined") ? riskReasonID : "",
            'riskReasonDescription': (riskReasonDescription && riskReasonDescription !== "undefined") ? riskReasonDescription : "",
            'riskBand': riskBand && riskBand !== "undefined" ? riskBand : "", // Fixed the trailing comma in the key name too
            'failureReason': (failureReason && failureReason !== "undefined") ? failureReason : "",
            'riskIndicator': (emailPhoneRiskIndicator && emailPhoneRiskIndicator.riskIndicator) || [],
            'purpose': "Account Creation"  //MFA Reporting 1
                };

        logger.debug("mfajsonObj is :: " + JSON.stringify(mfajsonObj))
        openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
    } catch (error) {
        logger.debug("Error Occured : Couldnot find audit details" + error)
        auditLog("OTP_FAILED_CREATEACCOUNT", "OTP failure Create Account - MFA Reporting",method)

    }
    
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is " + usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
        "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
    });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function auditLog(code, message,method){
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
               //eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""    

               //MFAReporting              
                eventDetails["purpose"] = "Account Creation" || ""
                eventDetails["action"] = "Add"

                if(message.indexOf("Fail") !== -1){
                    eventDetails["mfastatus"] = "Failed"   
                } else {
                eventDetails["mfastatus"] = "Successful"
                }
               
               if(method === "EMAIL"){
                     eventDetails["mfatype"] = "Primary Email OTP"
                     if(nodeState.get("resendotpretryCountforReporting")){
                        var resendotpretryCountforReporting = parseInt(nodeState.get("resendotpretryCountforReporting")) - 1    
                       eventDetails["NumberofResendCodes"] = resendotpretryCountforReporting
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               } else if(method === "SMSVOICE"){
                      if(nodeState.get("otpDeliveryMethod") && nodeState.get("otpDeliveryMethod").indexOf("SMS") > -1){
                    eventDetails["mfatype"] = "Mobile Phone OTP SMS"
                } else {
                    eventDetails["mfatype"] = "Mobile Phone OTP Voice"
                }

                if(nodeState.get("resendsmsretryCountforReporting")){
                     var resendsmsretryCountforReporting = parseInt(nodeState.get("resendsmsretryCountforReporting")) - 1
                       eventDetails["NumberofResendCodes"] = resendsmsretryCountforReporting
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }
			   
               } else if(method === "SECONDARY_EMAIL"){
                     eventDetails["mfatype"] = "Alternate Email OTP"
                    if(nodeState.get("resendSecondaryotpretryCountforReporting")){
                    var resendSecondaryotpretryCountforReporting = parseInt(nodeState.get("resendSecondaryotpretryCountforReporting")) - 1
                   eventDetails["NumberofResendCodes"] = resendSecondaryotpretryCountforReporting
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               }


                var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
                var sessionDetails = {}
                var sessionDetail = null
        
               if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
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
            var requestedUserId = nodeState.get("createdUserId") || ""
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, requestedUserId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA Authentication success "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

// Audit Log Function
// function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title) {
//     try {
//         var auditLib = require("KYID.2B1.Library.AuditLogger")
//         var headerName = "X-Real-IP";
//         var headerValues = requestHeaders.get(headerName);
//         var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
//         var browser = requestHeaders.get("user-agent");
//         var os = requestHeaders.get("sec-ch-ua-platform");
//         var userId = null;
//         var eventDetails = {};
//         eventDetails["IP"] = ipAdress;
//         eventDetails["Browser"] = browser;
//         eventDetails["OS"] = os;
//         eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
//         eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
//         eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
//         //eventDetails["transactionid"] = transactionid || "";
//         eventDetails["useCase"] = useCase || "";
//         eventDetails["useCaseInput"] = useCaseInput || "";
//         eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
//         eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
//         eventDetails["message"] = title || "";
//         eventDetails["reason"] = reason || "";
        
//         var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || "";
//         var sessionDetails = {}
//         var sessionDetail = null
//         logger.error("sessionRefId in KYID.2B1.Journey.IDProofing.CreateAccount " + nodeState.get("sessionRefId"))
//         if (nodeState.get("sessionRefId")) {
//             sessionDetail = nodeState.get("sessionRefId")
//             sessionDetails["sessionRefId"] = sessionDetail
//         } else if (typeof existingSession != 'undefined') {
//             sessionDetail = existingSession.get("sessionRefId")
//             sessionDetails["sessionRefId"] = sessionDetail
//         } else {
//             sessionDetails = { "sessionRefId": "" }
//         }
//         var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
//         var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
//         var sspVisibility = false;
//         var helpdeskVisibility = helpdeskVisibility || false;
        
//         // if (userEmail) {
//         //     var userQueryResult = openidm.query("managed/alpha_user", {
//         //         _queryFilter: 'mail eq "' + userEmail + '"'
//         //     }, ["_id"]);
//         //     userId = userQueryResult.result[0]._id ;
//         // }
        
//         var requesterUserId = null;
//         if (typeof existingSession != 'undefined') {
//             requesterUserId = existingSession.get("UserId")
//         }

//         auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
//     } catch (error) {
//         logger.error("Failed to log RIDP verification activity " + error)
//     }
// }
// var dateTime = new Date().toISOString();
// var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

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
//     errorId_AccountCreationFailed:"errorID::KYID002",
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
//         logger.error(message);
//     },
//     info: function (message) {
//         logger.info(message);
//     }
// };

// try {
//     var userData = {};
//     var availableMFAMethods=[];
//     var primaryEmail = null;
//     var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
//   //  nodeState.putShared("verifiedPrimaryEmail","testag90@mailinator.com")
//     if(nodeState.get("verifiedPrimaryEmail") != null){
//         primaryEmail=nodeState.get("verifiedPrimaryEmail").toLowerCase();
//         availableMFAMethods.push("EMAIL");
//     }
//     var usrFirstName = null;
//     if(nodeState.get("givenName") !=null){
//         usrFirstName=nodeState.get("givenName").toLowerCase();
//     }
//     var usrLastName = null;
//     if(nodeState.get("lastName") !=null ){
//         usrLastName=nodeState.get("lastName").toLowerCase();
//     }
//     var usrMiddleName = null;
//     if(nodeState.get("custom_middleName") !=null){
//         usrMiddleName = nodeState.get("custom_middleName")
//     }
//     var usrGender = null;
//     if(nodeState.get("custom_gender") !=null){
//         usrGender = nodeState.get("custom_gender")
//     }
//     var usrdateOfBirth = null;
//     if(nodeState.get("custom_dateofBirth") !=null){
//         usrdateOfBirth = nodeState.get("custom_dateofBirth")
//     }
//     var usrpostalAddress = null;
//     if(nodeState.get("postalAddress") !=null){
//         usrpostalAddress = nodeState.get("postalAddress")
//     }
//     var usrpostalAddress2 = null;
//     if(nodeState.get("custom_postalAddress2") !=null){
//         usrpostalAddress2 = nodeState.get("custom_postalAddress2")
//     }
//     var usrcity = null;
//     if(nodeState.get("city") !=null){
//         usrcity = nodeState.get("city")
//     }
//     var usrstateProvince = null;
//     if(nodeState.get("stateProvince") !=null){
//         usrstateProvince = nodeState.get("stateProvince")
//     }
//     var usrcounty = null;
//     if(nodeState.get("custom_county") !=null){
//         usrcounty = nodeState.get("custom_county")
//     }
//     var usrpostalCode = null;
//     if(nodeState.get("postalCode") !=null){
//         usrpostalCode = nodeState.get("postalCode")
//     }
//     var usrPassword = null;
//     if(nodeState.get("password") !=null ){
//         usrPassword=nodeState.get("password")
//     }

//     var telephoneNumber = null;
//     //var telephoneNumber = "";
//     if(nodeState.get("verifiedTelephoneNumber") !=null ){
//         telephoneNumber=nodeState.get("verifiedTelephoneNumber").toLowerCase();
//         logger.error("phone no is: "+telephoneNumber)
//         availableMFAMethods.push("SMSVOICE");
//     }
//     var verifiedAlternateEmail = null;
//     if(nodeState.get("verifiedAlternateEmail") !=null ){
//         verifiedAlternateEmail=nodeState.get("verifiedAlternateEmail").toLowerCase();
//         availableMFAMethods.push("SECONDARY_EMAIL");
//     }

//    // var accountExistInAD = null;
//     // if(nodeState.get("doesaccountExistsInAD") !=null ){
//     //     accountExistInAD=nodeState.get("doesaccountExistsInAD");
//     // }

//     var usrKOGID = null;
//     if(nodeState.get("fetchedKOGID") !=null ){
//         usrKOGID=nodeState.get("fetchedKOGID");
//     }

//     var usrUPN = null;
//     if(nodeState.get("fetchedUPN") !=null ){
//         usrUPN=nodeState.get("fetchedUPN");
//     }

// 	var usrLogon = null;
//     if(nodeState.get("fetchedLogon") !=null ){
//         usrLogon=nodeState.get("fetchedLogon");
//     }

//     var accountStatus = "active";

//     var accountExistInAD = true;
//     if(nodeState.get("failedADFlag") === "true"){
//     var accountExistInAD = false;
//     }
//     //var external = "External";
//     //   var usrKOGID = generateGUID();
//     //var domain = "External"
//     // Creating JSON object for user creation


//         userData = {
//         givenName: usrFirstName,
//         sn: usrLastName,
//         custom_middleName: usrMiddleName,
//         mail: primaryEmail,
//         userName: usrKOGID,
//         custom_gender: usrGender,
//         custom_dateofBirth: usrdateOfBirth,
//         postalAddress: usrpostalAddress,
//         custom_postalAddress2: usrpostalAddress2,
//         city: usrcity,
//         stateProvince: usrstateProvince,
//         postalCode: usrpostalCode,
//         accountStatus: accountStatus,
//         password: usrPassword,
//         telephoneNumber:telephoneNumber,
//         custom_ADFlag:accountExistInAD,
//         frIndexedString1:usrUPN,
//         frIndexedString2:usrLogon
//     };

//     logger.error("User Input Data"+ JSON.stringify(userData));
//     var isUserCreated = createUser(userData);
//     if(isUserCreated == true){
//         if(availableMFAMethods.includes("EMAIL")){
//             var mfaMethod = "EMAIL";
//             createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
//         }
//         if(availableMFAMethods.includes("SMSVOICE")){
//             var mfaMethod = "SMSVOICE";
//             createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
//         }
//         if(availableMFAMethods.includes("SECONDARY_EMAIL")){
//             var mfaMethod = "SECONDARY_EMAIL";
//             createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
//         }
//         action.goTo(nodeOutcome.SUCCESS)

//     }
//     else{

//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user"+"::"+primaryEmail+"::"+nodeConfig.errorId_AccountCreationFailed);
//         action.goTo(nodeOutcome.ERROR);
//     }




// } catch (error) {
//     nodeLogger.error(transactionid+"::"+timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error in main execution"  +"::"+error);
//     action.goTo(nodeOutcome.ERROR);
// }



// function createUser(userData) {
//     try {
//          var createUserResponse = openidm.create("managed/alpha_user", null, userData);
//           nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"createUserResponse Response::"+createUserResponse )
//           if(createUserResponse){
//           nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Account created successfully for the user"  +"::"+primaryEmail);    
//               return true;
//           }
//         else{
//             return false;
//         }

//     } catch (error) {
//          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Account creation failed for the user"+"::"+primaryEmail+"::"+nodeConfig.errorId_AccountCreationFailed+"::"+error);
//         // nodeLogger.error(nodeConfig.exceptionErrMsg + error);
//         action.goTo(nodeOutcome.ERROR)
//     }

// }

// // createMFAObjects(mfamethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);

// function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber) {
//     try {
//         if ((mfaMethod === "SMSVOICE" && telephoneNumber !=null )) {
//         if(!lookupInMFAObject(usrKOGID, telephoneNumber)) {
//             createMFAObject(usrKOGID,"SMSVOICE",telephoneNumber,"ACTIVE",true);
//          }
//     } 
//     if (mfaMethod === "EMAIL" && primaryEmail !=null ) {
//         if(!lookupInMFAObject(usrKOGID, primaryEmail)) {
//             createMFAObject(usrKOGID,"EMAIL",primaryEmail,"ACTIVE",false);
//          }
//     } 
//     if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail!=null) {
//         logger.error("SECONDARY_EMAIL mfaMethod: "+mfaMethod)
//         logger.error("mfaMethod: "+mfaMethod)
//         createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE",true);
//     } 

//     } catch (error) {
//         // logger.error("Error Occured"+ error)
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects"+"::"+error);
//     }



// }

// function createMFAObject(usrKOGID, method, usrMfaValue, status,isRecoveryOnly) {
//     logger.error("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
//     var mfajsonObj = {
//         'KOGId': usrKOGID,
//         'MFAMethod': method,
//         'MFAValue': usrMfaValue,
//         'MFAStatus': status,
//         'isRecoveryOnly':isRecoveryOnly
//     };
//     openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
// }

// function lookupInMFAObject(usrKOGID, usrMfaValue) {
//     logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
//     var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});
// 	if (mfaMethodResponses.result.length>0){
//        for(i=0;i<mfaMethodResponses.result.length;i++){
//            var mfaMethodResponse = mfaMethodResponses.result[i];
// 		   if(mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue)===0 && 
// 				mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE")===0) {
// 			   return true;
// 		   }
// 	   }
// 	}
// 	return false;
// }
// /**
//  * Generate Unique GUID
//  */
// function generateGUID() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//         const r = Math.random() * 16 | 0;
//         return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
//     });
// }