var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
//var auditLib = require("KYID.2B1.Library.UserActivityAuditLogger");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var patchPreReq = require("KYID.2B1.Library.GenericUtils");
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName);
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var updateSelfEnrollFlagResult = false;

logger.debug("requestHeader :: " + JSON.stringify(requestHeaders))

var browser = requestHeaders.get("user-agent");
var os = requestHeaders.get("sec-ch-ua-platform");
var passStr="**********";
var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";



// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enroll MFA Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.EnrollMFA",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    ENROLL_MFA: "EnrollMFA",
    RELOAD: "NotEnrollMFA",
    REMOVE_MFA: "RemoveMFA",
    UPDATE_EMAIL: "UpdateEmail",
    UPDATE_PASSWORD: "UpdatePassword",
    BACK: "back",
    ERROR: "error",
    SAVE: "save",
    DELETE: "deleteprofile",
    REVIEWED: "accountreviewed"
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

function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""

               if(message === "Enroll MFA Failure" || message === "Enrolled for MFA" || message === "DeEnroll MFA"){   //MFA Reporting
                    eventDetails["purpose"] = "Self Enrollment"
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
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log password reset initiation "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

try {
    // Detect if request is for HelpDesk or SelfService
    var userId = nodeState.get("userId") || null

    var userIdParam = requestParameters.get("_id");
    var isHelpDesk = false;
    var usrdetails;

    nodeState.putShared("flowName","SetupMFA")
    if (userIdParam && userIdParam.length > 0) {
        isHelpDesk = true;
        usrdetails = userIdParam[0]; // HelpDesk: use provided _id
    } else {
        // if(existingSession.get("UserId")){
        //     usrdetails = existingSession.get("UserId");
        // }else{
        //     usrdetails = nodeState.get("UserId");
        // }
        if (nodeState.get("UserId") !== null && nodeState.get("UserId")) {
            usrdetails = nodeState.get("UserId");
        } else if (existingSession.get("UserId")) {
            usrdetails = existingSession.get("UserId");
        }

        if (!usrdetails) {
            throw new Error("Unable to determine user context");
        }
    }

    // Fetch user details
    var userDetails = getuserDetails(usrdetails);
    if (!userDetails) {
        throw new Error("User details not found for ID: " + usrdetails);
    }

    // Extract user info
    var usrKOGID = userDetails.usrName;

    logger.debug("usrKOGID: " + usrKOGID);
    nodeState.putShared("userId", userId);

    // Check MFA registration
    var userIsMFAEnrolled = getSelfEnrollFlag(usrKOGID);
    logger.debug("userIsMFAEnrolled::" + userIsMFAEnrolled)
    var mfaOptions = getMFAMethods(usrKOGID);
    var maskMFAOptions = maskMFAMethods(mfaOptions);

    // Determine MFA enrolled status
    var isMFAEnrolled = 1; // default
    if (userIsMFAEnrolled === true) {
        isMFAEnrolled = 0;
    } else {
        isMFAEnrolled = 1;
    }

    // Decide whether to show callbacks or handle responses
    if (callbacks.isEmpty()) {
        requestCallbacks(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled);
    } else {
        handleUserResponses(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled, userEmail, eventDetails);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main execution: " + error.message);
}


function requestCallbacks(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled) {
    try {
        // Show validation error if any
        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode");
            callbacksBuilder.textOutputCallback(0, errorMessage);
        }
        if (nodeState.get("MFAMethodRegisterd") != null) {
            var errorMessage = nodeState.get("MFAMethodRegisterd");
            callbacksBuilder.textOutputCallback(0, errorMessage);
        }
        if (nodeState.get("MFARemovedSuccessMsg") != null) {
            var errorMessage = nodeState.get("MFARemovedSuccessMsg");
            callbacksBuilder.textOutputCallback(0, errorMessage);
        }
        if (isHelpDesk) {
            logger.debug("HelpDesk flow");
            nodeState.putShared("isHelpDesk", isHelpDesk);
            logger.debug("isHelpDesk:" + isHelpDesk);
            var combinedOutput = {
                "LoginDetails": {
                    "email": userDetails.usrmail,
                    "password": passStr
                    // "enroll_me_in_MFA": isMFAEnrolled === 0 ? false : true
                },
                "AccountDetails": {
                    "KYID ID": userDetails.usrID,
                    "KOG ID": userDetails.usrName,
                    "UPN": userDetails.usrUpn,
                    "Login": userDetails.usrLogon,
                    "Account_Type": userDetails.usrType,
                    "Status": userDetails.usrStatus
                },
                "AccountDates": {
                    "Account creation date": userDetails.usrCreationDate,
                    "Last modified": userDetails.usrUpdatedDate,
                    "Password last modified": userDetails.usrPwdChngTime,
                    "Password expiration": userDetails.usrPwdExpTime
                }
            };
            var combinedOutputString = JSON.stringify(combinedOutput, null, 2);
            callbacksBuilder.textOutputCallback(0, combinedOutputString);
            var selfEnrollOptions = ["true", "false"];
            var promptMessage1 = "enroll_me_in_MFA";
            var promptMessage2 = "select_mfa";

            callbacksBuilder.choiceCallback(`${promptMessage1}`, selfEnrollOptions, isMFAEnrolled, false);
            if (maskMFAOptions != null) {
                callbacksBuilder.choiceCallback(`${promptMessage2}`, maskMFAOptions, 0, false);
            } else {
                callbacksBuilder.textOutputCallback(0, "No_Methods_Registered");
            }
            callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password"], 0);
        } else {
            // SelfService
            logger.error("the journeyName KYID.2B1.Journey.Login.Register.EnrollMFA"+nodeState.get("journeyName")) //MFA Reporting
             logger.error("the journeyNameReporting KYID.2B1.Journey.Login.Register.EnrollMFA"+nodeState.get("journeyNameReporting")) //MFA Reporting
            logger.error("the loginPrereqEnrollMFA KYID.2B1.Journey.Login.Register.EnrollMFA"+nodeState.get("loginPrereqEnrollMFA")) //MFA Reporting
            if ((nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == "true") || nodeState.get("journeyName") === "AppEnrollPrerequisite" || nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName") === "MFARecovery") {
                logger.debug("RIDP-168")
                var selfEnrollOptions = ["true", "false"];
                var promptMessage1 = "enroll_me_in_MFA";
                var promptMessage2 = "select_mfa";

                if (nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName") === "MFARecovery") {
                    var outputObject = {
                        "pageHeader": "1_RIDP_login_and_security",
                    }
                    callbacksBuilder.textOutputCallback(0, JSON.stringify(outputObject));
                }

                if (nodeState.get("journeyName") != "RIDP_LoginMain" && nodeState.get("journeyName") != "MFARecovery") {
                    logger.debug("this is not RIDP flow")
                    callbacksBuilder.choiceCallback(`${promptMessage1}`, selfEnrollOptions, isMFAEnrolled, false);
                }

                //callbacksBuilder.choiceCallback(`${promptMessage1}`, selfEnrollOptions, isMFAEnrolled, false);
                if (maskMFAOptions != null) {
                    callbacksBuilder.choiceCallback(`${promptMessage2}`, maskMFAOptions, 0, false);
                } else {
                    callbacksBuilder.textOutputCallback(0, "No_Methods_Registered");
                }
                logger.debug("JourneyNameinIf:" + nodeState.get("journeyName"))
                callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Back"], 0);

                if (nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName") === "MFARecovery") {
                    var lib = require("KYID.Library.FAQPages");
                    var process ="ManageMFA";
                    var pageHeader= "1_RIDP_login_and_security";
                    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
                
                    if(getFaqTopicId!= null){
                            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
                        }
                }

            }
            else {
                logger.debug("RIDP-SelfService flow");
                var outputObject = {
                    "pageHeader": "1_login_and_security",
                    "LoginDetails": {
                        "email": nodeState.get("mail"),
                        "password": passStr
                        // "enroll_me_in_MFA": isMFAEnrolled === 0 ? false : true
                    }
                };
                var jsonString = JSON.stringify(outputObject, null, 2);
                callbacksBuilder.textOutputCallback(0, jsonString);
                var selfEnrollOptions = ["true", "false"];
                var promptMessage1 = "enroll_me_in_MFA";
                var promptMessage2 = "select_mfa";

                callbacksBuilder.choiceCallback(`${promptMessage1}`, selfEnrollOptions, isMFAEnrolled, false);
                if (maskMFAOptions != null) {
                    callbacksBuilder.choiceCallback(`${promptMessage2}`, maskMFAOptions, 0, false);
                } else {
                    callbacksBuilder.textOutputCallback(0, "No_Methods_Registered");
                }
                // Navigation options
                //callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password"], 0);
                if (nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == null) {
                    callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password", "Back", "deleteProfile"], 0);
                } 
                else if (nodeState.get("prereqtype") && nodeState.get("prereqtype") === "accountreview") {
                    callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password", "deleteProfile", "Reviewed"], 0);
                }
                else {
                    //MFA Reporting
                    if(nodeState.get("journeyNameReporting") !== "loginPrerequisite" && nodeState.get("journeyNameReporting") !== "ApplicationEnrollment"){
                        nodeState.putShared("journeyNameReporting","SelfMFAManagement") //MFA Reporting
                    } 
                    callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password", "deleteProfile"], 0);

                    //FAQ Topic
                    var lib = require("KYID.Library.FAQPages");
                    var process ="LoginSecurity";
                    var pageHeader= "1_login_and_security";
                    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
                
                    if(getFaqTopicId!= null){
                            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
                        }
                }

            }

        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallbacks: " + error.message);
    }
}

function handleUserResponses(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled, userEmail, eventDetails) {
    try {
        logger.debug("eventdetails is :: " + JSON.stringify(eventDetails))
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


        logger.debug("sessionDetails is :: " + JSON.stringify(sessionDetails))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var choiceOutcome = callbacks.getChoiceCallbacks().get(0)[0];
        logger.debug("choiceOutcome is -- " + choiceOutcome);
        logger.debug("selectedOutcome is -- " + selectedOutcome);
        
        if ((nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == "true") || nodeState.get("journeyName") === "AppEnrollPrerequisite" || nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName") === "MFARecovery") {
            logger.debug("inside the selectedOutcome")

            if (nodeState.get("prereqID")) {
                patchRequestEntry(nodeState.get("prereqID"));
            }

            if (selectedOutcome === 0) { // Save
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                if (nodeState.get("journeyName") === "RIDP_LoginMain") {
                    action.goTo(NodeOutcome.SAVE);

                }
                else if (isMFAEnrolled === 0) { // MFA Enrolled : true
                    if (choiceOutcome == 0) { // User chose to enroll, choosinh true in enroll
                        logger.debug("User chose to enroll")
                        //action.goTo(NodeOutcome.RELOAD);
                        action.goTo(NodeOutcome.SAVE);
                    } else {
                        var selfEnrollFlag = "false";
                        logger.debug("User chose to  remove enroll")
                        updateSelfEnrollFlag(selfEnrollFlag);
                        action.goTo(NodeOutcome.RELOAD);
                    }
                } else {// MFA not enrolled
                    if (choiceOutcome == 0) {
                        var selfEnrollFlag = "true";
                        updateSelfEnrollFlagResult = updateSelfEnrollFlag(selfEnrollFlag);
                        if (!updateSelfEnrollFlagResult)
                        {
                            auditLog("MFA004", "Enroll MFA Failure");
                            action.goTo(NodeOutcome.ERROR);
                        }
                        else{
                        auditLog("MFA003", "Enrolled for MFA");
                        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                        //auditLib.auditLogger("MFA0003", sessionDetails, "Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
                        //auditLog("MFA003", "Enrolled for MFA");
                        //auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                        action.goTo(NodeOutcome.SAVE);
                        }
                    } else {
                        logger.debug("reload the page")
                        action.goTo(NodeOutcome.RELOAD);
                    }
                }
            } else if (selectedOutcome === 1) { // Add Method
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                nodeState.putShared("MFAMethodRegisterd", null);
                nodeState.putShared("MFARemovedSuccessMsg", null);
                nodeState.putShared("validationErrorCode", null);
                logger.debug("Printing auditLogger " + sessionDetails.sessionRefId)
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                //auditLib.auditLogger("MFA0003",sessionDetails,"Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                //auditLog("MFA003", "Enrolled for MFA");
               // auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                action.goTo(NodeOutcome.ENROLL_MFA);
            } else if (selectedOutcome === 2) { // Remove Method
                if (mfaOptions != null && mfaOptions.length > 0) {
                    var recoveryMethodData = [];
                    var data = null;
                    logger.debug("MFA Option array :: " + mfaOptions);
                    for (var i = 0; i < mfaOptions.length; i++) {
                        data = JSON.parse(mfaOptions[i]);
                        if (data.isRecoveryOnly == true) {
                            logger.debug("isRecoveryOnly is True");
                            recoveryMethodData.push(data);
                        }
                    }

                    if (nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName") === "MFARecovery") {
                        var choiceIndex = callbacks.getChoiceCallbacks().get(0)[0];
                    } else {
                        var choiceIndex = callbacks.getChoiceCallbacks().get(1)[0];
                    }

                    var selectedMFA = mfaOptions[choiceIndex];
                    nodeState.putShared("selctedMFAtoRemove", maskMFAOptions[choiceIndex]);
                    logger.debug("Selected MFA Option is " + selectedMFA);
                    logger.debug("Selected Masked MFA Option is " + maskMFAOptions[choiceIndex]);
                    selectedMFA = JSON.parse(selectedMFA);
                    if (JSON.stringify(recoveryMethodData).includes(JSON.stringify(selectedMFA)) && recoveryMethodData.length == 1) {
                        errMsg["code"] = "ERR-MFA-REM-002";
                        errMsg["message"] = libError.readErrorMessage("ERR-MFA-REM-002");
                        nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                        action.goTo(NodeOutcome.RELOAD);
                    } else {
                        nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
                        nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
                        nodeState.putShared("MFAMethodRegisterd", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("KOGID", usrKOGID);
                        action.goTo(NodeOutcome.REMOVE_MFA);
                    }
                } else {
                    errMsg["message"] = "No_Methods_to_Remove";
                    nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                    action.goTo(NodeOutcome.RELOAD);
                }

            } else if (selectedOutcome === 3) { // Back
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                nodeState.putShared("validationErrorCode", null);
                action.goTo(NodeOutcome.BACK);
            }

        }


        else {
            if (nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == null) {
                logger.debug("prereqID is -- " + nodeState.get("prereqID"));
                patchRequestEntry(nodeState.get("prereqID"));

                if (selectedOutcome === 0) { // Save
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    if (isMFAEnrolled === 0) { // MFA Enrolled is true
                        if (choiceOutcome == 0) { // User chose to enroll
                            //action.goTo(NodeOutcome.RELOAD);
                            //action.goTo(NodeOutcome.ENROLL_MFA);
                            action.goTo(NodeOutcome.SAVE);
                        } else {
                            var selfEnrollFlag = "false";
                            updateSelfEnrollFlag(selfEnrollFlag);
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    } else { // MFA not enrolled
                        if (choiceOutcome == 0) {
                            var selfEnrollFlag = "true";
                            updateSelfEnrollFlagResult = updateSelfEnrollFlag(selfEnrollFlag);
                        if (!updateSelfEnrollFlagResult)
                        {
                            auditLog("MFA004", "Enroll MFA Failure");
                            action.goTo(NodeOutcome.ERROR);
                        }
                        else{
                            auditLog("MFA003", "Enrolled for MFA");
                            var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                            // auditLib.auditLogger("MFA0003",sessionDetails,"Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                            //auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                            action.goTo(NodeOutcome.SAVE);
                        }
                        } else {
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    }
                } else if (selectedOutcome === 1) { // Add Method
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("MFAMethodRegisterd", null);
                    nodeState.putShared("MFARemovedSuccessMsg", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("Printing auditLogger " + sessionDetails.sessionRefId)
                    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                    //auditLib.auditLogger("MFA0003",sessionDetails,"Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    //auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                    //auditLog("MFA003", "Enrolled for MFA");
                    action.goTo(NodeOutcome.ENROLL_MFA);
                } else if (selectedOutcome === 2) { // Remove Method
                    if (mfaOptions != null && mfaOptions.length > 0) {
                        var recoveryMethodData = [];
                        var data = null;
                        logger.debug("MFA Option array :: " + mfaOptions);
                        for (var i = 0; i < mfaOptions.length; i++) {
                            data = JSON.parse(mfaOptions[i]);
                            if (data.isRecoveryOnly == true) {
                                logger.debug("isRecoveryOnly is True");
                                recoveryMethodData.push(data);
                            }
                        }
                        var choiceIndex = callbacks.getChoiceCallbacks().get(1)[0];
                        var selectedMFA = mfaOptions[choiceIndex];
                        nodeState.putShared("selctedMFAtoRemove", maskMFAOptions[choiceIndex]);
                        logger.debug("Selected MFA Option is " + selectedMFA);
                        logger.debug("Selected Masked MFA Option is " + maskMFAOptions[choiceIndex]);
                        selectedMFA = JSON.parse(selectedMFA);
                        logger.debug("recoveryMethodData.length is --> " + recoveryMethodData.length);
                        if (JSON.stringify(recoveryMethodData).includes(JSON.stringify(selectedMFA)) && recoveryMethodData.length === 1) {
                            errMsg["code"] = "ERR-MFA-REM-002";
                            errMsg["message"] = libError.readErrorMessage("ERR-MFA-REM-002");
                            nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                            action.goTo(NodeOutcome.RELOAD);
                        } else {
                            nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
                            nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
                            nodeState.putShared("MFAMethodRegisterd", null);
                            nodeState.putShared("validationErrorCode", null);
                            nodeState.putShared("KOGID", usrKOGID);
                            action.goTo(NodeOutcome.REMOVE_MFA);
                        }
                    } else {
                        errMsg["message"] = "No_Methods_to_Remove";
                        nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                        action.goTo(NodeOutcome.RELOAD);
                    }
                } else if (selectedOutcome === 3) { // Update Email
                    logger.debug("Enterning into Email change");
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("Before Outcome");
                    nodeState.putShared("usrKOGID", usrKOGID);
                    nodeState.putShared("isHelpDesk", isHelpDesk);
                    action.goTo(NodeOutcome.UPDATE_EMAIL);
                } else if (selectedOutcome === 4) { // Update Password
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("isHelpDesk", isHelpDesk);
                    action.goTo(NodeOutcome.UPDATE_PASSWORD);
                }
                if (selectedOutcome === 5) { // Back
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo(NodeOutcome.BACK);
                }

                else if (selectedOutcome === 6) { // delete
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("userId", usrKOGID);
                    action.goTo(NodeOutcome.DELETE);
                }
            }
            else {
                logger.debug("going to else cosndition")
                if (selectedOutcome === 0) { // Save
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    if (isMFAEnrolled === 0) { // MFA Enrolled
                        logger.debug("going to MFA Enrolled")
                        if (choiceOutcome == 0) { // User chose to enroll
                            //action.goTo(NodeOutcome.RELOAD);
                            //action.goTo(NodeOutcome.ENROLL_MFA);
                            if (nodeState.get("prereqtype") === "selfenroll" && nodeState.get("preRequisiteId") !== null && nodeState.get("requestedUserAccountId") !== null) {
                                var preRequisiteId = nodeState.get("preRequisiteId");
                                var requestedUserAccountId = nodeState.get("requestedUserAccountId")
                                logger.debug("preRequisiteId:: " + preRequisiteId)
                                logger.debug("requestedUserAccountId:: " + requestedUserAccountId)
                                var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                                logger.debug("isPatched :: " + JSON.stringify("isPatched"))
                            }
                            action.goTo(NodeOutcome.SAVE);
                        } else {
                            var selfEnrollFlag = "false";
                            logger.debug("going to MFA de-Enrolled")
                            updateSelfEnrollFlag(selfEnrollFlag);
                            auditLog("MFA de-Enrolled", "DeEnroll MFA"); //MFA Reporting
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    } else { // MFA not enrolled
                        if (choiceOutcome == 0) {
                            var selfEnrollFlag = "true";
                            var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                            //auditLib.auditLogger("MFA0003",sessionDetails,"Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                            
                            //auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                           updateSelfEnrollFlagResult = updateSelfEnrollFlag(selfEnrollFlag);
                             if (!updateSelfEnrollFlagResult)
                            {
                            auditLog("MFA004", "Enroll MFA Failure");
                            action.goTo(NodeOutcome.ERROR);
                            }
                        else{
                            auditLog("MFA003", "Enrolled for MFA");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                            if (nodeState.get("prereqtype") === "selfenroll" && nodeState.get("preRequisiteId") !== null && nodeState.get("requestedUserAccountId") !== null) {
                                var preRequisiteId = nodeState.get("preRequisiteId");
                                var requestedUserAccountId = nodeState.get("requestedUserAccountId")
                                logger.debug("preRequisiteId:: " + preRequisiteId)
                                logger.debug("requestedUserAccountId:: " + requestedUserAccountId)
                                var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId)
                                logger.debug("isPatched :: " + JSON.stringify("isPatched"))
                            }
                            action.goTo(NodeOutcome.SAVE);
                        }
                        } else {
                            logger.debug("No action.Reload")
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    }
                } else if (selectedOutcome === 1) { // Add Method
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("MFAMethodRegisterd", null);
                    nodeState.putShared("MFARemovedSuccessMsg", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("Printing auditLogger " + sessionDetails.sessionRefId)
                    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                    //auditLib.auditLogger("MFA0003", sessionDetails, "Enroll for MFA", eventDetails, usrdetails, usrdetails, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
                    //auditLog("MFA003", "Enrolled for MFA");
                    //auditLib.auditLog("MFA003","Enroll for MFA", nodeState, requestHeaders);
                    action.goTo(NodeOutcome.ENROLL_MFA);
                } else if (selectedOutcome === 2) { // Remove Method
                    if (mfaOptions != null && mfaOptions.length > 0) {
                        var recoveryMethodData = [];
                        var data = null;
                        logger.debug("MFA Option array :: " + mfaOptions);
                        for (var i = 0; i < mfaOptions.length; i++) {
                            data = JSON.parse(mfaOptions[i]);
                            if (data.isRecoveryOnly == true) {
                                logger.debug("isRecoveryOnly is True");
                                recoveryMethodData.push(data);
                            }
                        }
                        var choiceIndex = callbacks.getChoiceCallbacks().get(1)[0];
                        var selectedMFA = mfaOptions[choiceIndex];
                        nodeState.putShared("selctedMFAtoRemove", maskMFAOptions[choiceIndex]);
                        logger.debug("Selected MFA Option is " + selectedMFA);
                        logger.debug("Selected Masked MFA Option is " + maskMFAOptions[choiceIndex]);
                        selectedMFA = JSON.parse(selectedMFA);
                        if (JSON.stringify(recoveryMethodData).includes(JSON.stringify(selectedMFA)) && recoveryMethodData.length == 1) {
                            errMsg["code"] = "ERR-MFA-REM-002";
                            errMsg["message"] = libError.readErrorMessage("ERR-MFA-REM-002");
                            nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                            action.goTo(NodeOutcome.RELOAD);
                        } else {
                            nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
                            nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
                            nodeState.putShared("MFAMethodRegisterd", null);
                            nodeState.putShared("validationErrorCode", null);
                            nodeState.putShared("KOGID", usrKOGID);
                            action.goTo(NodeOutcome.REMOVE_MFA);
                        }
                    } else {
                        errMsg["message"] = "No_Methods_to_Remove";
                        nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
                        action.goTo(NodeOutcome.RELOAD);
                    }
                } else if (selectedOutcome === 3) { // Update Email
                    logger.debug("Enterning into Email change");
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("Before Outcome");
                    nodeState.putShared("usrKOGID", usrKOGID);
                    nodeState.putShared("isHelpDesk", isHelpDesk);
                    action.goTo(NodeOutcome.UPDATE_EMAIL);
                } else if (selectedOutcome === 4) { // Update Password
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("isHelpDesk", isHelpDesk);
                    action.goTo(NodeOutcome.UPDATE_PASSWORD);
                }

                else if (selectedOutcome === 5) { // delete
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("userId", usrKOGID);
                    action.goTo(NodeOutcome.DELETE);
                }
                else if (selectedOutcome === 6) { // Account Reviewed - Login Prerequisite
                    logger.debug("Account Reviewed - Login Prerequisite")
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    var preRequisiteId = nodeState.get("preRequisiteId");
                    var requestedUserAccountId = nodeState.get("requestedUserAccountId")
                    var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                    action.goTo(NodeOutcome.REVIEWED);

                }
            }
        }


    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses: " + error.message);
        action.goTo(NodeOutcome.ERROR);
    }
}


function updateSelfEnrollFlag(selfEnrollFlag) {
    try {
        var userId = null

        if (nodeState.get("UserId") !== null && nodeState.get("UserId")) {
            userId = nodeState.get("UserId");
        } else if (existingSession.get("UserId")) {
            var userId = existingSession.get("UserId");
        }
        logger.debug("userid in updateSelfEnrollFlag" + userId)
        //logger.debug("selfEnrollFlag = "+selfEnrollFlag+" Type = "+typeof selfEnrollFlag);
        if (selfEnrollFlag === "true") {
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
             logger.debug(" auditData " + JSON.stringify(auditData))
            logger.debug("selfenrollfalg:: " + selfEnrollFlag)
            var jsonArray = []
            var selfEnrollPatchJSON =  {}
            selfEnrollPatchJSON = { "operation": "replace", "field": "/custom_selfEnrollMFA", "value": true }
            jsonArray.push(selfEnrollPatchJSON)
            if(auditData.updatedDateEpoch){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedByID){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedDate){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedBy){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy}
                jsonArray.push(selfEnrollPatchJSON)
            }
            
            
            // var patchResponse = openidm.patch("managed/alpha_user/" + userId, null, [
            //     { "operation": "replace", "field": "/custom_selfEnrollMFA", "value": true },
            //     {operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch},
            //     {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID},
            //     {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate},
            //     {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy}
            // ]);
            var patchResponse = openidm.patch("managed/alpha_user/" + userId, null, jsonArray);
            logger.debug("patchResponse" +patchResponse);
           /* if(patchResponse._id){
            auditLog("MFA003", "Enrolled for MFA");
            }
            else{
            auditLog("MFA004", "Enroll MFA Failure");
            }
            */
        }
        else if (selfEnrollFlag === "false") {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
              logger.debug(" auditData " + JSON.stringify(auditData))
            logger.debug("selfEnrollFlag = " + selfEnrollFlag + " Type = " + typeof selfEnrollFlag);
            var jsonArray = []
            var selfEnrollPatchJSON =  {}
            selfEnrollPatchJSON = { "operation": "replace", "field": "/custom_selfEnrollMFA", "value": false }
            jsonArray.push(selfEnrollPatchJSON)
            if(auditData.updatedDateEpoch){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedByID){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedDate){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate}
                jsonArray.push(selfEnrollPatchJSON)
            }
            if(auditData.updatedBy){
                selfEnrollPatchJSON = {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy}
                jsonArray.push(selfEnrollPatchJSON)
            }
            
            // var patchResponse = openidm.patch("managed/alpha_user/" + userId, null, [
            //     { "operation": "replace", "field": "/custom_selfEnrollMFA", "value": false },
            //      {operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch},
            //     {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID},
            //     {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate},
            //     {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy}
            // ]);
            var patchResponse = openidm.patch("managed/alpha_user/" + userId, null,jsonArray );
        }

        return patchResponse != null;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error updateSelfEnrollFlag: " + error.message);
        return false;
    }
}

function getSelfEnrollFlag(usrKOGID) {
    try {
        var userResponse = openidm.query("managed/alpha_user", { "_queryFilter": "/userName eq \"" + usrKOGID + "\"" });
        logger.debug("userResponse::" + userResponse)
        if (userResponse.result && userResponse.result.length > 0) {
            nodeState.putShared("mail", userResponse.result[0].mail);
            var selfEnrollFlag = userResponse.result[0].custom_selfEnrollMFA;
            logger.debug("selfEnrollFlag:::" + selfEnrollFlag)
            if (selfEnrollFlag) {
                return selfEnrollFlag;
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error getSelfEnrollFlag: " + error.message);
    }
    return null;
}

function getMFAMethods(usrKOGID) {
    try {
        var MFAMethods = [];
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND !(MFAMethod eq "EMAIL")' });
        if (mfaMethodResponses.result.length > 0) {
            for (var i = 0; i < mfaMethodResponses.result.length; i++) {
                var item = mfaMethodResponses.result[i];
                var isRecoveryOnly = item.isRecoveryOnly || false;
                var MFAMethod = item.MFAMethod;
                var MFAValue = item.MFAValue;
                var finalItem = {
                    "MFAMethod": MFAMethod,
                    "MFAValue": MFAValue,
                    "isRecoveryOnly": isRecoveryOnly
                };
                MFAMethods.push(JSON.stringify(finalItem));
                nodeState.putShared("MFARegistered", "true");
            }
            return MFAMethods;
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error getMFAMethods: " + error.message);
        return null;
    }
}

function isMFARegistered(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND !(MFAMethod eq "SECONDARY_EMAIL") AND !(MFAMethod eq "EMAIL")' });
        if (mfaMethodResponses.result.length > 0) {
            nodeState.putShared("MFARegistered", "true");
            return true;
        } else {
            updateSelfEnrollFlag("false");
            return false;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error isMFARegistered: " + error.message);
        return false;
    }
}

function maskSymantecID(symid) {


    const len = symid.length;
    // Mask 6 digits before the last 4
    const prefixLength = symid.length - 8;
    const prefixSection = symid.slice(0, prefixLength);
    const maskedSection = 'x'.repeat(4);
    const unmaskedSection = symid.slice(-4);

    //return countryCode + prefixSection + maskedSection + unmaskedSection;
    return prefixSection + "-" + maskedSection + "-" + unmaskedSection;
}

function maskPhoneNumber(phone) {


    const len = phone.length;
    // Mask 6 digits before the last 4
    const prefixLength = phone.length - 10;
    const prefixSection = phone.slice(0, prefixLength); // Keep first 2 digits after country code do +2
    const maskedSection = 'x'.repeat(3);
    const unmaskedSection = phone.slice(-4);

    //return countryCode + prefixSection + maskedSection + unmaskedSection;
    return prefixSection + "-" + maskedSection + "-" + maskedSection + "-" + unmaskedSection;
}

function maskEmail(email) {
    var lastLetter = email.split("@")[0];
    lastLetter = lastLetter.slice(-2);
    var maskedEmail = email[0] + "****" + lastLetter + "@" + email.split("@")[1];
    return maskedEmail;
}

function maskMFAMethods(mfaOptions) {
    try {
        var data = [];
        if (mfaOptions) {
            for (var i = 0; i < mfaOptions.length; i++) {
                var entry = JSON.parse(mfaOptions[i]);
                if (entry.MFAMethod === "SMSVOICE") {
                    //var last4 = entry.MFAValue.slice(-4);
                    logger.debug("Before Masking: " + entry.MFAValue);
                    entry.MFAValue = maskPhoneNumber(entry.MFAValue);
                    logger.debug("After Masking: " + entry.MFAValue);
                } else if (entry.MFAMethod === "SECONDARY_EMAIL") {
                    entry.MFAValue = maskEmail(entry.MFAValue);
                } else if (entry.MFAMethod === "SYMANTEC") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    entry.MFAValue = maskSymantecID(entry.MFAValue);
                    logger.debug("After Masking: " + entry.MFAValue);
                }
                else if (entry.MFAMethod === "FRTOTP") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    logger.debug("Before Masking: " + entry.MFAMethod);
                    entry.MFAValue = "FORGEROCK"
                    entry.MFAMethod = "TOTP"
                    logger.debug("After Masking: " + entry.MFAValue);
                }
                else if (entry.MFAMethod === "FRPUSH") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    logger.debug("Before Masking: " + entry.MFAMethod);
                    entry.MFAValue = "FORGEROCK"
                    entry.MFAMethod = "PUSH"
                    logger.debug("After Masking: " + entry.MFAValue);
                }
                data.push(JSON.stringify(entry));
            }
            return data;
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error maskMFAMethods: " + error.message);
        return null;
    }
}

function patchRequestEntry(id) {
    try {
        var contentArray = [
            { "operation": "replace", "field": "status", "value": "COMPLETED" },
            { "operation": "replace", "field": "updatedate", "value": dateTime },
            { "operation": "replace", "field": "enddate", "value": dateTime },
            
        ];
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, id);
    } catch (error) {
        logger.error("Error in patchRequestEntry: " + error);
    }
}

function getuserDetails(usrDetails) {
    try {
        var userIdentity = openidm.query("managed/alpha_user", { "_queryFilter": "/_id eq \"" + usrDetails + "\"" }, ["userName", "_id", "frIndexedString1", "frIndexedString2", "custom_userType", "accountStatus", "custom_createDateISO", "custom_updatedDateISO", "passwordLastChangedTime", "passwordExpirationTime", "mail"]);
        if (userIdentity.result && userIdentity.result.length > 0) {
            var user = userIdentity.result[0];
            return {
                usrUpn: user.frIndexedString1,
                usrLogon: user.frIndexedString2,
                usrType: user.custom_userType,
                usrStatus: user.accountStatus,
                usrID: user._id,
                usrName: user.userName,
                usrmail: user.mail,
                usrCreationDate: user.custom_createDateISO,
                usrUpdatedDate: user.custom_updatedDateISO,
                usrPwdChngTime: user.passwordLastChangedTime,
                usrPwdExpTime: user.passwordExpirationTime
            };
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error("Error getUserDetails: " + error.message);
        return null;
    }
}