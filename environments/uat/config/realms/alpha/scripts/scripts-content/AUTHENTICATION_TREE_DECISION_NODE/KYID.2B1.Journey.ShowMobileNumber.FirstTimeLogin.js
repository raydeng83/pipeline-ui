var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var errMsg = {};
var libError = null;
var passStr = "**********";
libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enroll MFA Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ShowMobileNumber.FirstTimeLogin",
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
    DELETE: "deleteprofile"
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

try {
    // Detect if request is for HelpDesk or SelfService
    var userIdParam = requestParameters.get("_id");
    var isHelpDesk = false;
    var usrdetails;

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
        handleUserResponses(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main execution: " + error.message);
}


function requestCallbacks(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled) {
    try {
        // Show validation error if any
        // if (nodeState.get("validationErrorCode") != null) {
        //     var errorMessage = nodeState.get("validationErrorCode");
        //     callbacksBuilder.textOutputCallback(0, errorMessage);
        // }
        // if (nodeState.get("MFAMethodRegisterd") != null) {
        //     var errorMessage = nodeState.get("MFAMethodRegisterd");
        //     callbacksBuilder.textOutputCallback(0, errorMessage);
        // }
        // if (nodeState.get("MFARemovedSuccessMsg") != null) {
        //     var errorMessage = nodeState.get("MFARemovedSuccessMsg");
        //     callbacksBuilder.textOutputCallback(0, errorMessage);
        // }
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
            if ((nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == "true") || nodeState.get("journeyName") === "AppEnrollPrerequisite" || nodeState.get("firsttimeloginjourney") == "true") {
                var selfEnrollOptions = ["true", "false"];
                var promptMessage1 = "enroll_me_in_MFA";
                var promptMessage2 = "select_mfa";

                if (nodeState.get("firsttimeloginjourney") !== "true") {
                    logger.debug("this is not trigerring from first time login journey")
                    callbacksBuilder.choiceCallback(`${promptMessage1}`, selfEnrollOptions, isMFAEnrolled, false);
                }

                if (nodeState.get("firsttimeloginjourney") === "true") {
                    logger.debug("this is from first time login journey")
                    var outputObject = {
                        "pageHeader": "1_DisplayPhoneNumber",
                    };
                    var jsonString = JSON.stringify(outputObject, null, 2);
                    callbacksBuilder.textOutputCallback(0, jsonString);
                }


                if (maskMFAOptions != null) {
                    callbacksBuilder.choiceCallback(`${promptMessage2}`, maskMFAOptions, 0, false);
                } else {
                    callbacksBuilder.textOutputCallback(0, "No_Methods_Registered");
                }
                callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Back"], 1);

            } else {
                logger.debug("SelfService flow");
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
                } else {
                    callbacksBuilder.confirmationCallback(0, ["Save", "Add_Method", "Remove_Method", "Update_Email", "Update_Password", "deleteProfile"], 0);
                }

            }

        }


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


    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallbacks: " + error.message);
    }
}

function handleUserResponses(isHelpDesk, userDetails, maskMFAOptions, isMFAEnrolled) {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.debug("selectedOutcome is -- " + selectedOutcome);
        var choiceOutcome = callbacks.getChoiceCallbacks().get(0)[0];
        logger.debug("choiceOutcome is -- " + choiceOutcome);
        logger.debug("selectedOutcome is -- " + selectedOutcome);

        if ((nodeState.get("journeyName") === "loginPrerequisite" && nodeState.get("loginPrereqEnrollMFA") == "true") || nodeState.get("journeyName") === "AppEnrollPrerequisite") {
            logger.debug("inside the selectedOutcome")
            patchRequestEntry(nodeState.get("prereqID"));
            if (selectedOutcome === 0) { // Save
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                if (isMFAEnrolled === 0) { // MFA Enrolled : true
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
                } else { // MFA not enrolled
                    if (choiceOutcome == 0) {
                        var selfEnrollFlag = "true";
                        updateSelfEnrollFlag(selfEnrollFlag);
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                        action.goTo(NodeOutcome.SAVE);
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

            } else if (selectedOutcome === 3) { // Back
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                nodeState.putShared("validationErrorCode", null);
                action.goTo(NodeOutcome.BACK);
            }

        } else if (nodeState.get("firsttimeloginjourney") == "true") {
            logger.debug("inside the selectedOutcome")

            if (selectedOutcome === 0) { // Continue
                logger.debug("user does not want to change the mobile number registered")
                action.goTo(NodeOutcome.SAVE);
            } else if (selectedOutcome === 1) { // Add Method
                nodeState.putShared("notAllowedtoRemoveMessage", null);
                nodeState.putShared("MFAMethodRegisterd", null);
                nodeState.putShared("MFARemovedSuccessMsg", null);
                nodeState.putShared("validationErrorCode", null);
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
                    var choiceIndex = callbacks.getChoiceCallbacks().get(0)[0];
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
        } else {
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
                            updateSelfEnrollFlag(selfEnrollFlag);
                            nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                            action.goTo(NodeOutcome.SAVE);
                        } else {
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    }
                } else if (selectedOutcome === 1) { // Add Method
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("MFAMethodRegisterd", null);
                    nodeState.putShared("MFARemovedSuccessMsg", null);
                    nodeState.putShared("validationErrorCode", null);
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
                } else if (selectedOutcome === 6) { // delete
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo(NodeOutcome.DELETE);
                }
            } else {
                logger.debug("going to else cosndition")
                if (selectedOutcome === 0) { // Save
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    if (isMFAEnrolled === 0) { // MFA Enrolled
                        logger.debug("going to MFA Enrolled")
                        if (choiceOutcome == 0) { // User chose to enroll
                            //action.goTo(NodeOutcome.RELOAD);
                            //action.goTo(NodeOutcome.ENROLL_MFA);
                            action.goTo(NodeOutcome.SAVE);
                        } else {
                            var selfEnrollFlag = "false";
                            logger.debug("going to MFA de-Enrolled")
                            updateSelfEnrollFlag(selfEnrollFlag);
                            action.goTo(NodeOutcome.RELOAD);
                        }
                    } else { // MFA not enrolled
                        if (choiceOutcome == 0) {
                            var selfEnrollFlag = "true";
                            updateSelfEnrollFlag(selfEnrollFlag);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
                            action.goTo(NodeOutcome.SAVE);
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

                if (selectedOutcome === 5) { // delete
                    nodeState.putShared("notAllowedtoRemoveMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo(NodeOutcome.DELETE);
                }
            }


        }


        // if (nodeState.get("journeyName") === "loginPrerequisite") {
        //     logger.error("prereqID is -- " + nodeState.get("prereqID"));
        //     patchRequestEntry(nodeState.get("prereqID"));
        // }


        // logger.error("choiceOutcome is -- " + choiceOutcome);
        // logger.error("selectedOutcome is -- " + selectedOutcome);

        // if (selectedOutcome === 0) { // Save
        //     nodeState.putShared("notAllowedtoRemoveMessage", null);
        //     if (isMFAEnrolled === 0) { // MFA Enrolled
        //         if (choiceOutcome == 0) { // User chose to enroll
        //             action.goTo(NodeOutcome.RELOAD);
        //         } else {
        //             var selfEnrollFlag = "false";
        //             updateSelfEnrollFlag(selfEnrollFlag);
        //             action.goTo(NodeOutcome.RELOAD);
        //         }
        //     } else { // MFA not enrolled
        //         if (choiceOutcome == 0) {
        //             var selfEnrollFlag = "true";
        //             updateSelfEnrollFlag(selfEnrollFlag);
        //             nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected for self-enroll MFA pre-requisite" + "::" + userDetails.usrmail);
        //             action.goTo(NodeOutcome.ENROLL_MFA);
        //         } else {
        //             action.goTo(NodeOutcome.RELOAD);
        //         }
        //     }
        // } else if (selectedOutcome === 1) { // Add Method
        //     nodeState.putShared("notAllowedtoRemoveMessage", null);
        //     nodeState.putShared("MFAMethodRegisterd", null);
        //     nodeState.putShared("MFARemovedSuccessMsg", null);
        //     nodeState.putShared("validationErrorCode", null);
        //     action.goTo(NodeOutcome.ENROLL_MFA);
        // } else if (selectedOutcome === 2) { // Remove Method
        //     if (mfaOptions != null && mfaOptions.length > 0) {
        //         var recoveryMethodData = [];
        //         var data = null;
        //         logger.error("MFA Option array :: " + mfaOptions);
        //         for (var i = 0; i < mfaOptions.length; i++) {
        //             data = JSON.parse(mfaOptions[i]);
        //             if (data.isRecoveryOnly == true) {
        //                 logger.error("isRecoveryOnly is True");
        //                 recoveryMethodData.push(data);
        //             }
        //         }
        //         var choiceIndex = callbacks.getChoiceCallbacks().get(1)[0];
        //         var selectedMFA = mfaOptions[choiceIndex];
        //         nodeState.putShared("selctedMFAtoRemove", maskMFAOptions[choiceIndex]);
        //         logger.error("Selected MFA Option is " + selectedMFA);
        //         logger.error("Selected Masked MFA Option is " + maskMFAOptions[choiceIndex]);
        //         selectedMFA = JSON.parse(selectedMFA);
        //         if (JSON.stringify(recoveryMethodData).includes(JSON.stringify(selectedMFA)) && recoveryMethodData.length == 1) {
        //             errMsg["code"] = "ERR-MFA-REM-002";
        //             errMsg["message"] = libError.readErrorMessage("ERR-MFA-REM-002");
        //             nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
        //             action.goTo(NodeOutcome.RELOAD);
        //         } else {
        //             nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
        //             nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
        //             nodeState.putShared("MFAMethodRegisterd", null);
        //             nodeState.putShared("validationErrorCode", null);
        //             nodeState.putShared("KOGID", usrKOGID);
        //             action.goTo(NodeOutcome.REMOVE_MFA);
        //         }
        //     } else {
        //         errMsg["message"] = "No_Methods_to_Remove";
        //         nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));
        //         action.goTo(NodeOutcome.RELOAD);
        //     }
        // } else if (selectedOutcome === 3) { // Update Email
        //     logger.error("Enterning into Email change");
        //     nodeState.putShared("notAllowedtoRemoveMessage", null);
        //     nodeState.putShared("validationErrorCode", null);
        //     logger.error("Before Outcome");
        //     nodeState.putShared("usrKOGID", usrKOGID);
        //     nodeState.putShared("isHelpDesk",isHelpDesk);
        //     action.goTo(NodeOutcome.UPDATE_EMAIL);
        // } else if (selectedOutcome === 4) { // Update Password
        //     nodeState.putShared("notAllowedtoRemoveMessage", null);
        //     nodeState.putShared("validationErrorCode", null);
        //     action.goTo(NodeOutcome.UPDATE_PASSWORD);
        // } else if (selectedOutcome === 5) { // Back
        //     nodeState.putShared("notAllowedtoRemoveMessage", null);
        //     nodeState.putShared("validationErrorCode", null);
        //     action.goTo(NodeOutcome.BACK);
        // }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses: " + error.message);
        action.goTo(NodeOutcome.ERROR);
    }
}

function updateSelfEnrollFlag(selfEnrollFlag) {
    try {
        // var userId = existingSession.get("UserId");
        if (nodeState.get("UserId") !== null && nodeState.get("UserId")) {
            var userId = nodeState.get("UserId");
        } else if (existingSession.get("UserId")) {
            var userId = existingSession.get("UserId");
        }
        logger.debug("userid in updateSelfEnrollFlag" + userId)
        if (selfEnrollFlag === "true") {
            logger.debug("selfenrollfalg:: " + selfEnrollFlag)
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
            logger.debug(" auditData " + JSON.stringify(auditData))
            var patchResponse = openidm.patch("managed/alpha_user/" + userId, null, [{
                "operation": "replace",
                "field": "/custom_selfEnrollMFA",
                "value": true
            },
            {
                operation: "replace",
                field: "/custom_updatedDateEpoch",
                value: auditData.updatedDateEpoch
            },
            {
                operation: "replace",
                field: "/custom_updatedByID",
                value: auditData.updatedByID
            },
            {
                operation: "replace",
                field: "/custom_updatedDateISO",
                value: auditData.updatedDate
            },
            {
                operation: "replace",
                field: "/custom_updatedBy",
                value: auditData.updatedBy
            }
            ]);
        } else if (selfEnrollFlag === "false") {
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
            logger.debug(" auditData " + JSON.stringify(auditData))
            logger.debug("selfEnrollFlag = " + selfEnrollFlag + " Type = " + typeof selfEnrollFlag);
            var patchResponse = openidm.patch("managed/alpha_user/" + userId, null, [{
                "operation": "replace",
                "field": "/custom_selfEnrollMFA",
                "value": false
            },
            {
                operation: "replace",
                field: "/custom_updatedDateEpoch",
                value: auditData.updatedDateEpoch
            },
            {
                operation: "replace",
                field: "/custom_updatedByID",
                value: auditData.updatedByID
            },
            {
                operation: "replace",
                field: "/custom_updatedDateISO",
                value: auditData.updatedDate
            },
            {
                operation: "replace",
                field: "/custom_updatedBy",
                value: auditData.updatedBy
            }
            ]);
        }

        return patchResponse != null;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error updateSelfEnrollFlag: " + error.message);
        return false;
    }
}

function getSelfEnrollFlag(usrKOGID) {
    try {
        var userResponse = openidm.query("managed/alpha_user", {
            "_queryFilter": "/userName eq \"" + usrKOGID + "\""
        });
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
        if (nodeState.get("firsttimeloginjourney") == "true") {
            var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", {
                "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND MFAMethod eq "SMSVOICE"'
            });
        } else {
            var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", {
                "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND !(MFAMethod eq "EMAIL")'
            });
        }

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
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND !(MFAMethod eq "SECONDARY_EMAIL") AND !(MFAMethod eq "EMAIL")'
        });
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
                    //entry.MFAValue = "xxx-xxx-" + last4;
                } else if (entry.MFAMethod === "SYMANTEC") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    entry.MFAValue = maskSymantecID(entry.MFAValue);
                    logger.debug("After Masking: " + entry.MFAValue);
                    //var last5 = entry.MFAValue.slice(-5);
                    //entry.MFAValue = "xxxxxx-" + last5;
                } else if (entry.MFAMethod === "FRTOTP") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    logger.debug("Before Masking: " + entry.MFAMethod);
                    entry.MFAValue = "FORGEROCK"
                    entry.MFAMethod = "TOTP"
                    logger.debug("After Masking: " + entry.MFAValue);
                    //var last5 = entry.MFAValue.slice(-5);
                    //entry.MFAValue = "xxxxxx-" + last5;
                } else if (entry.MFAMethod === "FRPUSH") {
                    logger.debug("Before Masking: " + entry.MFAValue);
                    logger.debug("Before Masking: " + entry.MFAMethod);
                    entry.MFAValue = "FORGEROCK"
                    entry.MFAMethod = "PUSH"
                    logger.debug("After Masking: " + entry.MFAValue);
                    //var last5 = entry.MFAValue.slice(-5);
                    //entry.MFAValue = "xxxxxx-" + last5;
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
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
        logger.debug(" auditData " + JSON.stringify(auditData))
        var contentArray = [{
            "operation": "replace",
            "field": "status",
            "value": "COMPLETED"
        },
        {
            "operation": "replace",
            "field": "updatedate",
            "value": dateTime
        },
        {
            "operation": "replace",
            "field": "enddate",
            "value": dateTime
        }, {
            operation: "replace",
            field: "/custom_updateDateEpoch",
            value: auditData.updatedDateEpoch
        },
        {
            operation: "replace",
            field: "/custom_updatedByID",
            value: auditData.updatedByID
        },
        {
            operation: "replace",
            field: "/custom_updateDate",
            value: auditData.updatedDate
        },
        {
            operation: "replace",
            field: "/custom_updatedBy",
            value: auditData.updatedBy
        }
        ];
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, id);
    } catch (error) {
        logger.error("Error in patchRequestEntry: " + error);
    }
}

function getuserDetails(usrDetails) {
    try {
        var userIdentity = openidm.query("managed/alpha_user", {
            "_queryFilter": "/_id eq \"" + usrDetails + "\""
        }, ["userName", "_id", "frIndexedString1", "frIndexedString2", "custom_userType", "accountStatus", "custom_createDateISO", "custom_updatedDateISO", "passwordLastChangedTime", "passwordExpirationTime", "mail"]);
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