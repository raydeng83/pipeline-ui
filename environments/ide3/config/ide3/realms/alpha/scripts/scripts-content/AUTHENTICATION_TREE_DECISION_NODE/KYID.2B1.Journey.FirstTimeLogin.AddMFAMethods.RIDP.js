

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Add MFA Methods",
    script: "Script",
    scriptName: "KYID.2B1.Journey.FirstTimeLogin.AddMFAMethods",
    timestamp: dateTime,
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
    var availableMFAMethods = [];
    var highRiskMFAArray = [];
    var createAlternateEmail = true;
    var createPhoneMFA = true;
    var kogId = nodeState.get("KOGID");
    var phoneArray = [];
    var flowName = nodeState.get("flowName");
    var purpose = "First Time Login";  //MFA Reporting

    logger.debug("flowName in KYID.2B1.Journey.FirstTimeLogin.AddMFAMethods.RIDP " + flowName)
    if(flowName.toLowerCase() != "firsttimelogin"){
        logger.debug("Journey is not First time login, skipping adding recovery methods");
        action.goTo(nodeOutcome.SUCCESS);
    } else if(nodeState.get("highRiskMFArray") && JSON.parse(nodeState.get("highRiskMFArray")).length < 0){
        logger.debug("highRiskMFArray is :: " + nodeState.get("highRiskMFArray"))
        logger.debug("verifiedTelephoneNumber is :: " + nodeState.get("verifiedTelephoneNumber"))
        logger.debug("verifiedAlternateEmail is :: " + nodeState.get("verifiedAlternateEmail"))
        highRiskMFAArray = JSON.parse(nodeState.get("highRiskMFArray"));
        
        if(highRiskMFAArray && Array.isArray(highRiskMFAArray) && highRiskMFAArray.length > 0){
            
            highRiskMFAArray.forEach(function(mfa){
                if(mfa.MFAMethod === "SMSVOICE" && nodeState.get("verifiedTelephoneNumber") && mfa.MFAValue == nodeState.get("verifiedTelephoneNumber").toLowerCase()) {
                        createPhoneMFA = false;
                        phoneArray.push(mfa.MFAValue);
                }else if(mfa.MFAMethod === "SECONDARY_EMAIL" && nodeState.get("verifiedAlternateEmail") && mfa.MFAValue == nodeState.get("verifiedAlternateEmail").toLowerCase()) {
                        createAlternateEmail = false;
                }
            });

            highRiskMFAArray.forEach(function(mfa){
                if(mfa.MFAMethod === "SMSVOICE" && nodeState.get("verifiedTelephoneNumber") && mfa.MFAValue == nodeState.get("verifiedTelephoneNumber").toLowerCase()) {
                        patchMFA(mfa._id,"SMSVOICE",purpose)
                }else if(mfa.MFAMethod === "SECONDARY_EMAIL" && nodeState.get("verifiedAlternateEmail") && mfa.MFAValue == nodeState.get("verifiedAlternateEmail").toLowerCase()) {
                        patchMFA(mfa._id,"SECONDARY_EMAIL",purpose)
                }
                
                /*else if( (nodeState.get("verifiedAlternateEmail") &&  nodeState.get("verifiedAlternateEmail")!=null) || (nodeState.get("verifiedTelephoneNumber") && nodeState.get("verifiedTelephoneNumber")!=null)){
                    if(createAlternateEmail){
                        createMFAObject(kogId, "SECONDARY_EMAIL", nodeState.get("verifiedAlternateEmail").toLowerCase(), "ACTIVE", true);
                    }
                    
                    if(createPhoneMFA && !phoneArray.includes(nodeState.get("verifiedTelephoneNumber").toLowerCase())){
                        createMFAObject(kogId, "SMSVOICE", nodeState.get("verifiedTelephoneNumber").toLowerCase(), "ACTIVE", true);
                    }    
                }
                */
            });

            if( (nodeState.get("verifiedAlternateEmail") &&  nodeState.get("verifiedAlternateEmail")!=null) || (nodeState.get("verifiedTelephoneNumber") && nodeState.get("verifiedTelephoneNumber")!=null)){
                if(createAlternateEmail){
                    createMFAObject(kogId, "SECONDARY_EMAIL", nodeState.get("verifiedAlternateEmail").toLowerCase(), "ACTIVE", true,purpose);
                }
                
                if(createPhoneMFA && !phoneArray.includes(nodeState.get("verifiedTelephoneNumber").toLowerCase())){
                    createMFAObject(kogId, "SMSVOICE", nodeState.get("verifiedTelephoneNumber").toLowerCase(), "ACTIVE", true,purpose);
                }    
            }
        }
        action.goTo(nodeOutcome.SUCCESS);
    }else{
        logger.debug("No high risk MFA methods found in shared state");
        var primaryEmail = null;
        if (nodeState.get("userMail") != null) {
            primaryEmail = nodeState.get("userMail").toLowerCase();
            availableMFAMethods.push("EMAIL");
        }

        var telephoneNumber;
        if (nodeState.get("verifiedTelephoneNumber") != null) {
            telephoneNumber = nodeState.get("verifiedTelephoneNumber").toLowerCase();
            availableMFAMethods.push("SMSVOICE");
        }
        var verifiedAlternateEmail = null;
        if (nodeState.get("verifiedAlternateEmail") != null) {
            verifiedAlternateEmail = nodeState.get("verifiedAlternateEmail").toLowerCase();
            availableMFAMethods.push("SECONDARY_EMAIL");
        }

        var usrKOGID;
        if (nodeState.get("KOGID") != null) {
            usrKOGID = nodeState.get("KOGID");
        }

        logger.debug("usrKOGID " + usrKOGID);
        logger.debug("verifiedAlternateEmail " + verifiedAlternateEmail);
        logger.debug("primaryEmail " + primaryEmail);
        logger.debug("availableMFAMethods " + availableMFAMethods);

        // if(availableMFAMethods.includes("EMAIL")){
        //     var mfaMethod = "EMAIL";
        //     createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
        //     logger.debug("EMAIL MFADONE");
        // }
        if (availableMFAMethods.includes("SMSVOICE")) {
            var mfaMethod = "SMSVOICE";
            logger.debug("going inside SMSVOICE MFA")
            createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber,purpose);
            
            logger.debug("SMSVOICE MFADONE");
        }
        // if(availableMFAMethods.includes("SECONDARY_EMAIL")){
        //     var mfaMethod = "SECONDARY_EMAIL";
        //     createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
        //     logger.debug("SMSVOICE MFADONE");
        // }

        if (availableMFAMethods.includes("SECONDARY_EMAIL")) {
            logger.debug("going inside SECONDARY_EMAIL MFA")
            createOrUpdateSecondaryEmailMFA(usrKOGID, verifiedAlternateEmail,purpose);
        }


        nodeState.putShared("recoveryMethodsAdded", true);
        action.goTo(nodeOutcome.SUCCESS)
    }
} catch (error) {
    nodeState.putShared("validationErrorCode", "Error occured while saving account recovery methods");
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error in main execution" + "::" + error);
    action.goTo(nodeOutcome.SUCCESS);
}

function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber,purpose) {
    try {
        if ((mfaMethod === "SMSVOICE" && telephoneNumber != null)) {
            if (!lookupInMFAObject(usrKOGID, telephoneNumber)) {
                createMFAObject(usrKOGID, "SMSVOICE", telephoneNumber, "ACTIVE", true,purpose);               
                auditLog("VER004","Mobile OTP Validation") //MFA Reporting
            }
        }


        if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail != null) {
            logger.debug("mfaMethod: " + mfaMethod)
            createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true,purpose);
            auditLog("VER003", "Email OTP Validation"); //MFA Reporting
        }
        

    } catch (error) {
        auditLog("VER005", "OTP validation Failure"); //MFA Reporting
        nodeState.putShared("validationErrorCode", "Error occured while saving account recovery methods");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in add recovery methods" + "::" + error);
    }

}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly,purpose) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);


    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
    logger.debug("KYID auditDetail " + auditData)

    var risk = null;
    if(method === "SMSVOICE"){
        var transactionIdLN = nodeState.get("phoneTransactionIdLN")  || "" ;
        var riskIndicators = nodeState.get("phoneRiskIndicator") ? JSON.parse(nodeState.get("phoneRiskIndicator")) : [] ;
        risk = nodeState.get("phoneRisk") || "" ;
        var requestStatus = nodeState.get("phoneRequestStatus") || "" ;
        var riskReasonId = nodeState.get("phoneRiskReason") || "" ;
        var riskReasonID = nodeState.get("phoneRiskReasonId") || "" ;
        var riskReasonDescription = nodeState.get("phoneRiskReasonDescription") || "" ;
        var riskBand = nodeState.get("phoneRiskBand") || "" ;
        var failureReason = nodeState.get("phoneFailureReason") || "" ;
    }else if(method === "SECONDARY_EMAIL"){
        var transactionIdLN = nodeState.get("alternateEmailTransactionIdLN")  || "" ;
        var riskIndicators = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
        risk = nodeState.get("alternateEmailRisk") || "" ;
        var requestStatus = nodeState.get("alternateEmailRequestStatus") || "" ;
        var riskReasonId = nodeState.get("alternateEmailRiskReason") || "" ;
        var riskReasonID = nodeState.get("alternateEmailRiskReasonId") || "" ;
        var riskReasonDescription = nodeState.get("alternateEmailRiskReasonDescription") || "" ;
        var riskBand = nodeState.get("alternateEmailRiskBand") || "" ;
        var failureReason = nodeState.get("alternateEmailFailureReason") || "" ;
    }

    if(risk && risk.toLowerCase() === "high"){
        status = "highrisk"
    }else{
        status = "ACTIVE"
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
        'transactionId': transactionIdLN,
        'risk': risk,
        'requestStatus': requestStatus || "",
        'riskReasonId': riskReasonId || "",
        'riskReasonID': riskReasonID || "",
        'riskReasonDescription': riskReasonDescription || "",
        'riskBand': riskBand || "",
        'failureReason': failureReason || "",
        'riskIndicator': riskIndicators.riskIndicator || riskIndicators.riskIndicator || [],
        'purpose': purpose
    };
    try{
        openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
        //MFA Reporting
        if(method === "SMSVOICE"){
            auditLog("VER004","Mobile OTP Validation") 
        } else if(method === "SECONDARY_EMAIL"){
            auditLog("VER003", "Email OTP Validation"); 
        }
    } catch (error){
        auditLog("VER005", "OTP validation Failure"); //MFA Reporting
        logger.error("Exception in createMFAObject:"+error)
    }
    
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is " + usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function createOrUpdateSecondaryEmailMFA(usrKOGID, verifiedAlternateEmail,purpose) {
    try {
        logger.debug("Checking existing SECONDARY_EMAIL MFA for KOGID: " + usrKOGID);

        //var queryResp = openidm.query("managed/alpha_kyid_mfa_methods", {"_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "SECONDARY_EMAIL"'}, ["*"]);

        var queryResp = openidm.query("managed/alpha_kyid_mfa_methods",{ "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "SECONDARY_EMAIL" AND MFAStatus eq "ACTIVE"'},["*"]);

        var foundActive = false;

        var transactionIdLN = nodeState.get("alternateEmailTransactionIdLN")  || "" ;
        var riskIndicators = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
        var risk = nodeState.get("alternateEmailRisk") || "" ;
        var requestStatus = nodeState.get("alternateEmailRequestStatus") || "" ;
        var riskReasonId = nodeState.get("alternateEmailRiskReason") || "" ;
        var riskReasonID = nodeState.get("alternateEmailRiskReasonId") || "" ;
        var riskReasonDescription = nodeState.get("alternateEmailRiskReasonDescription") || "" ;
        var riskBand = nodeState.get("alternateEmailRiskBand") || "" ;
        var failureReason = nodeState.get("alternateEmailFailureReason") || "" ;

        if (queryResp && queryResp.result.length > 0) {
            for (var i = 0; i < queryResp.result.length; i++) {
                var existingMFA = queryResp.result[i];
                logger.debug("Inspecting existing SECONDARY_EMAIL MFA: " + JSON.stringify(existingMFA));
                var auditDetails = require("KYID.2B1.Library.AuditDetails")
                var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                logger.debug("KYID auditDetail " + JSON.stringify(auditData))
                if (existingMFA.MFAStatus === "ACTIVE") {
                    foundActive = true;
                    if (existingMFA.MFAValue !== verifiedAlternateEmail) {

                    var mfaStatus = "ACTIVE"
                    if(risk !== "high"){
                         mfaStatus = "ACTIVE"
                    }else{
                        mfaStatus = "highrisk"
                    }
                        
                    var patchObj = [
                                    {
                                        "operation": "replace",
                                        "field": "/MFAStatus",
                                        "value": mfaStatus
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/updateDateEpoch",
                                        "value": auditData.updatedDateEpoch
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/updatedByID",
                                        "value": auditData.updatedByID
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/updateDate",
                                        "value": auditData.updatedDate
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/updatedBy",
                                        "value": auditData.updatedBy
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
                                        "value": requestStatus || ""
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/riskReasonId",
                                        "value": riskReasonId || ""
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/riskReasonID",
                                        "value": riskReasonID || ""
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/riskReasonDescription",
                                        "value" : riskReasonDescription || ""
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
                                        "value": riskIndicators.riskIndicator || []
                                    },
                                    {
                                        "operation": "replace",
                                        "field": "/purpose",
                                        "value": purpose || ""
                                    }
                                ];

                        openidm.patch("managed/alpha_kyid_mfa_methods/" + existingMFA._id, null, patchObj);
                        logger.debug("Patched existing ACTIVE SECONDARY_EMAIL MFA with new value");
                    } else {
                        logger.debug("ACTIVE SECONDARY_EMAIL MFA already has the correct value, no update needed");
                    }
                    // Exit loop after updating the first ACTIVE record
                    break;
                }
            }

            if (!foundActive) {
                logger.debug("No ACTIVE SECONDARY_EMAIL MFA found, creating a new one");
                createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true,purpose);
            }
        } else {
            logger.debug("No existing SECONDARY_EMAIL MFA found, creating new one");
            createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true,purpose);
        }
    } catch (error) {
        nodeState.putShared("validationErrorCode", "Error occurred while saving SECONDARY_EMAIL recovery method");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::error in SECONDARY_EMAIL MFA handling::" + error);
    }
}

function patchMFA(mfaId,method,purpose) {
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        var risk = null;
        logger.debug("KYID auditDetail " + JSON.stringify(auditData));
        logger.debug("method is :: " + method);
        logger.debug("typeof phoneRiskIndicator :: " + typeof nodeState.get("phoneRiskIndicator"));

        var riskIndicators = []
    
        
        if(method == "SMSVOICE"){
            logger.debug("inside sms voice")
            var transactionIdLN = nodeState.get("phoneTransactionIdLN")  || "" ;
            //var riskIndicators = nodeState.get("phoneRiskIndicator") ? JSON.parse(nodeState.get("phoneRiskIndicator")) : [] ;
            if(nodeState.get("phoneRiskIndicator") && (typeof nodeState.get("phoneRiskIndicator") == "string")){
                riskIndicators =   nodeState.get("phoneRiskIndicator") || [] ; 
            }else{
                riskIndicators = JSON.parse(nodeState.get("phoneRiskIndicator")) 
            }
            
            risk = nodeState.get("phoneRisk") || "" ;
            var requestStatus = nodeState.get("phoneRequestStatus") || "" ;
            var riskReasonId = nodeState.get("phoneRiskReason") || "" ;
            var riskReasonID = nodeState.get("phoneRiskReasonId") || "" ;
            var riskReasonDescription = nodeState.get("phoneRiskReasonDescription") || "" ;
            var riskBand = nodeState.get("phoneRiskBand") || "" ;
            var failureReason = nodeState.get("phoneFailureReason") || "" ;
        }else if(method == "SECONDARY_EMAIL"){
            var transactionIdLN = nodeState.get("alternateEmailTransactionIdLN")  || "" ;
            //var riskIndicators = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
            risk = nodeState.get("alternateEmailRisk") || "" ;
            var requestStatus = nodeState.get("alternateEmailRequestStatus") || "" ;
            var riskReasonId = nodeState.get("alternateEmailRiskReason") || "" ;
            var riskReasonID = nodeState.get("alternateEmailRiskReasonId") || "" ;
            var riskReasonDescription = nodeState.get("alternateEmailRiskReasonDescription") || "" ;
            var riskBand = nodeState.get("alternateEmailRiskBand") || "" ;
            var failureReason = nodeState.get("alternateEmailFailureReason") || "" ;
        }

        var mfaStatus = "ACTIVE"
        if(risk !== "high"){
            logger.debug("risk in ::"+ risk)
             mfaStatus = "ACTIVE"
        }else{
            mfaStatus = "highrisk"
        }

        var patchObj = [
            {
                "operation": "replace",
                "field": "/MFAStatus",
                "value": mfaStatus
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
                "field": "/riskReasonID",
                "value": riskReasonID || ""
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
                "value": riskIndicators ? riskIndicators.riskIndicator || [] : []
            },
            {
                "operation": "replace",
                "field": "/purpose",
                "value": purpose || ""
            }
            
        ];

        logger.debug("patchObj in patchMFA :: " + JSON.stringify(patchObj))
        openidm.patch("managed/alpha_kyid_mfa_methods/" + mfaId, null, patchObj);
        
    } catch (error) {
        nodeState.putShared("validationErrorCode", "Error occurred while updating existing MFA method");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::error in patching MFA method::" + error);
    }   
}


function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""

               //MFAReporting
                eventDetails["purpose"] = "First Time Login" || "" //Not using the purpose logic as firsttime login journey has multiple journey name

                if(nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney"){
                    eventDetails["action"] = "Add"
                }

                if(message === "OTP validation Failure"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

               if(message === "Email OTP Validation"){
                   logger.error("Email OTP Validation")
                   eventDetails["mfatype"] = "Alternate Email OTP";
                   if(nodeState.get("resendSecondaryotpretryCountforReporting")){
                        logger.error("resendSecondaryotpretryCountforReporting::"+nodeState.get("resendSecondaryotpretryCountforReporting"))
                    var resendSecondaryotpretryCountforReporting = parseInt(nodeState.get("resendSecondaryotpretryCountforReporting")) - 1
                       logger.error("resendSecondaryotpretryCountforReporting minus 1::"+resendSecondaryotpretryCountforReporting)
                       eventDetails["NumberofResendCodes"] = resendSecondaryotpretryCountforReporting
                   } else {
                       logger.error("resendSecondaryotpretryCountforReporting is 0")
                       eventDetails["NumberofResendCodes"] = 0
                   }
               } else {
                   eventDetails["mfatype"] = "Mobile Phone OTP SMS"
                    if(nodeState.get("resendsmsretryCountforReporting")){
                        logger.error("resendsmsretryCountforReporting::"+nodeState.get("resendsmsretryCountforReporting"))
                        var resendsmsretryCountforReporting = parseInt(nodeState.get("resendsmsretryCountforReporting")) - 1
                        logger.error("resendsmsretryCountforReporting minus 1::"+resendsmsretryCountforReporting)
                        eventDetails["NumberofResendCodes"] = resendsmsretryCountforReporting
               } else {
                        logger.error("resendsmsretryCountforReporting is 0")
                        eventDetails["NumberofResendCodes"] = 0
               }
               }
               
    
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
                var userEmail = nodeState.get("mail") || "";
        logger.error("the email from nodestate KYID.2B1.Journey.FirstTimeLogin.AddMFAMethods.RIDP"+nodeState.get("mail"))
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
        logger.error("Failed to log OTP validation failure "+ error)
       // action.goTo(NodeOutcome.SUCCESS);
    }
    
}
