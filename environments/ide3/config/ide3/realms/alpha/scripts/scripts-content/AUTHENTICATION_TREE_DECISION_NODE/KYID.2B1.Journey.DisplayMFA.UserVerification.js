var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

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
    EMAIL: "email",
    PHONE: "phone",
    SYMANTEC: "symantec",
    TOTP: "totp",
    PUSH:"push",
    BACK:"back",
    ERROR:"error"
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
    // Check MFA registration
    var userId = getUserId();
    var userData = null;
    var usrKOGID = null;
    var usrLastLogonMethod = null;
    
    logger.debug("the userId fetched: "+userId)
    if (userId) {
        userData = fetchUserData(userId);
        logger.debug("the userData fetched is: "+userData)
        usrKOGID = userData.userName
        usrLastLogonMethod = userData.custom_lastlogonMFAmethod
    }

var mfaData = getMFAMethods(usrKOGID);

// Fallback: if no ACTIVE MFA records found, create EMAIL MFA using primary email
if (mfaData === null) {
    var userMail = userData ? userData.mail : null;
    if (userMail) {
        nodeLogger.error(transactionid + "::No ACTIVE MFA found for user. Creating fallback EMAIL MFA using primary email.");
        var created = createFallbackEmailMFA(usrKOGID, userMail);
        if (created) {
            mfaData = getMFAMethods(usrKOGID);
        }
    }
    if (mfaData === null) {
        nodeLogger.error(transactionid + "::No MFA available and fallback EMAIL MFA creation failed or no primary email.");
        action.goTo(NodeOutcome.ERROR);
    }
}

var mfaOptions = mfaData ? mfaData.displayOptions : [];
// unmasked values used for comparison
var unmaskedValues = mfaData ? mfaData.unmaskedOptions : [];

var maskMFAOptions = maskMFAMethods(mfaOptions, userData);
    
    var userDetails = getuserDetails(userId)
  //  var mfaOptions = getMFAMethods(usrKOGID);
    //var maskMFAOptions = maskMFAMethods(mfaOptions, userData);
       logger.debug("maskMFAOptions: "+maskMFAOptions)
   // var defaultIndex = usrLastLogonMethod ? 0 : -1;
   var defaultIndex = 0;
   //lastlogon
    if (maskMFAOptions && usrLastLogonMethod) {
        logger.debug("usrLastLogonMethod: " + usrLastLogonMethod);

        var methodType = null;
        var methodValue = null;

        if (usrLastLogonMethod.indexOf("|") > -1) {
           
            var parts = usrLastLogonMethod.split("|");
            methodType = parts[0] ? parts[0].trim().toUpperCase() : "";
            methodValue = parts[1] ? parts[1].trim() : "";
             logger.debug("methodType:::"+methodType+methodValue)
        } else {
            methodType = usrLastLogonMethod.trim().toUpperCase();
            methodValue = userData && userData.custom_lastlogonMFAMethodValue ? userData.custom_lastlogonMFAMethodValue.trim() : "";
            logger.debug("methodType:::=>"+methodType+methodValue)
        }

        logger.debug("methodType: " + methodType + " | methodValue: " + methodValue);

        for (var i = 0; i < maskMFAOptions.length; i++) {
            var entry = JSON.parse(maskMFAOptions[i]);
            var entryMethod = entry.MFAMethod ? entry.MFAMethod.toUpperCase() : "";
            //var entryValue = entry.unmaskedValue || entry.MFAValue || "";
          // var entryValue = unmaskedValues[i] || ""; //PA:

            // PA: CHANGE: use originalIndex to lookup correct unmasked value (handles email merging)
           var entryValue = unmaskedValues[(typeof entry.originalIndex !== 'undefined' ? entry.originalIndex : i)] || "";
            
            logger.debug(i + "::rawMethod::" + entryMethod + "::rawValue::" + entryValue);

            var numStored = entryValue.replace(/[^\d]/g, "");
            var numUsed = methodValue.replace(/[^\d]/g, "");

            logger.debug(i + "::numStored::" + numStored + "::numUsed::" + numUsed);
            
            if ((methodType === "MOBILE" || methodType === "SMSVOICE") && entryMethod === "SMSVOICE") {
                if (numStored === numUsed || numStored.endsWith(numUsed) || numUsed.endsWith(numStored)) {
                    defaultIndex = i;
                    logger.debug("Default selection set to MOBILE MFA (number match) at index: " + i);
                    break;
                }
            } else if (
                (methodType === "EMAIL" && entryMethod === "EMAIL") ||
                (methodType === "PRIMARYSECONDARYEMAIL" && (entryMethod === "PRIMARYSECONDARYEMAIL" || entryMethod === "SECONDARY_EMAIL" )) ||
                (methodType === "SYMANTEC" && entryMethod === "SYMANTEC") ||
                (methodType === "TOTP" && (entryMethod === "TOTP" || entryMethod === "FRTOTP" )) ||
                (methodType === "PUSH" && (entryMethod === "PUSH" || entryMethod === "FRPUSH" ))
            ) {
                defaultIndex = i;
               logger.debug("Default selection set to " + methodType + " MFA at index: " + i);
                break;
            }
        }

        logger.debug("Final defaultIndex resolved to: " + defaultIndex);
    }

    if (callbacks.isEmpty()) {
        requestCallbacks(userDetails, maskMFAOptions, defaultIndex,usrLastLogonMethod);
    } else {
        handleUserResponses(userDetails, maskMFAOptions);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main execution: " + error.message);
}

function getUserId() {
    try {
      var userId = requestParameters.get("_id")[0]
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User ID: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}                        


function requestCallbacks(userDetails, maskMFAOptions, defaultIndex,usrLastLogonMethod) {
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
        
                var promptMessage1 = "select_an_option_to_verify";
        
                var outputObject = {
                        "pageHeader": "1_user_verification_mfa_display",
                    }
                    callbacksBuilder.textOutputCallback(0, JSON.stringify(outputObject));

        var useremail = nodeState.get("mail")
        var userfirstname = nodeState.get("givenName")
        var userlastname = nodeState.get("lastName")
        var userfullname = userfirstname + " " + userlastname
         callbacksBuilder.textOutputCallback(0, "full name: " +userfullname);
        callbacksBuilder.textOutputCallback(0, "email: " +useremail);

        // Determine if last logon MFA method is MOBILE but without number
            var lastLogonMFAEnabled = false;
            
            if (usrLastLogonMethod === "MOBILE") {
                // MOBILE without number
                lastLogonMFAEnabled = false;
                logger.debug("Last logon MFA is MOBILE without number — setting lastLogonMFAEnabled = false");
            } else if ((usrLastLogonMethod && usrLastLogonMethod.startsWith("MOBILE|")) || (usrLastLogonMethod && usrLastLogonMethod === "PUSH") || (usrLastLogonMethod && usrLastLogonMethod === "TOTP") || (usrLastLogonMethod && usrLastLogonMethod === "SYMANTEC") || (usrLastLogonMethod && usrLastLogonMethod === "PRIMARYSECONDARYEMAIL")) {
                // MOBILE with number
                lastLogonMFAEnabled = true;
            } else {
                // Any other valid MFA type remains same
                lastLogonMFAEnabled = false;
            }

                // Output the result
                callbacksBuilder.textOutputCallback(0, "lastLogonMFAEnabled: " + lastLogonMFAEnabled);
        
                if (maskMFAOptions != null) {
                    //callbacksBuilder.choiceCallback(`${promptMessage1}`, maskMFAOptions, 0, false);
                    callbacksBuilder.choiceCallback(`${promptMessage1}`, maskMFAOptions, defaultIndex, false);
                } else {
                    callbacksBuilder.textOutputCallback(0, "No_Methods_Registered");
                }
                //logger.error("JourneyNameinIf:"+nodeState.get("journeyName"))
                callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);

              //FAQ topic
                    var lib = require("KYID.Library.FAQPages");
                    var process ="UserVerificationMFA";
                    var pageHeader= "1_user_verification_mfa_display";
                    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
                
                    if(getFaqTopicId!= null){
                            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
                        }
                
            }  
 catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallbacks: " + error.message);
    }
}

// function handleUserResponses(userDetails, maskMFAOptions) {
//     try {
//       var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
//       var choiceOutcome = callbacks.getChoiceCallbacks().get(0)[0];
       

//         logger.error("choiceOutcome is -- " + choiceOutcome);

//         logger.error("selectedOutcome is TBD.DisplayMFA-- " + selectedOutcome);

//         if (selectedOutcome === 0) { // Next
//             if (mfaOptions && mfaOptions.length > 0) {
//                 logger.error("the mfaOptions in array is:: "+mfaOptions)
//                // var selectedMFA = JSON.parse(mfaOptions[choiceOutcome]);

//                 var selectedMFA = JSON.parse(maskMFAOptions[choiceOutcome]);
                
//                 nodeState.putShared("selctedMFAtoAuthentication", maskMFAOptions[choiceOutcome]);
//                 nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
//                 nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
//                 nodeState.putShared("MFAMethodRegisterd", null);
//                 nodeState.putShared("validationErrorCode", null);

//                 // var usrKOGID = userDetails.usrName || null;
//                 // nodeState.putShared("KOGID", usrKOGID);

//                 logger.error("Selected MFA: " + selectedMFA.MFAMethod + " with value " + selectedMFA.MFAValue);

//                 if (selectedMFA.MFAMethod === "EMAIL") {
//                     logger.error("email is selected");
//                     action.goTo("email");
//                     logger.error(" after email is selected");
//                    return;
//                 } 
//                 else if (selectedMFA.MFAMethod === "SMSVOICE") {
//                     var origIndex = selectedMFA.originalIndex;
//                     var origPhoneNumber = unmaskedValues[origIndex];
                    
//                     nodeState.putShared("selectedphonenumber", origPhoneNumber);
//                     //nodeState.putShared("selectedphonenumber",selectedMFA.MFAValue)
//                     action.goTo(NodeOutcome.PHONE);
//                     return;
//                 } else if (selectedMFA.MFAMethod === "SYMANTEC") {
//                     action.goTo(NodeOutcome.SYMANTEC);
//                     return;
//                 } else if (selectedMFA.MFAMethod === "TOTP") {
//                     action.goTo(NodeOutcome.TOTP);
//                     return;
//                 } else if (selectedMFA.MFAMethod === "PUSH") {
//                     nodeState.putShared("helpdeskjourney","true")
//                     action.goTo(NodeOutcome.PUSH);
//                     return;
//                 } else if (selectedMFA.MFAMethod === "PRIMARYSECONDARYEMAIL") {
//                     logger.error("primarysecondaryemail is selected");
//                     nodeState.putShared("primary_secondary_email",true);
//                     action.goTo("primarysecondaryemail");
//                     return;
//                 }                
//                 else {
//                     action.goTo(NodeOutcome.ERROR);
//                     return;
//                 }
//             } else {
//                 logger.error("No MFA array");
//             }
//         } else if (selectedOutcome === 1) { // Back
//             nodeState.putShared("notAllowedtoRemoveMessage", null);
//             nodeState.putShared("validationErrorCode", null);
//             action.goTo(NodeOutcome.BACK);
//         }
//     } catch (error) {
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" +
//             nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
//             nodeConfig.script + "::" + nodeConfig.scriptName + "::" +
//             nodeConfig.begin + "::" + "error in handleUserResponses: " + error.message);
//         action.goTo(NodeOutcome.ERROR);
//     }
// }
function handleUserResponses(userDetails, maskMFAOptions) {
    try {
        // ConfirmationCallback → number
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        // ChoiceCallback → int[][]
        // First [0] → first ChoiceCallback
        // Second [0] → selected index
        var choiceOutcome = callbacks.getChoiceCallbacks()[0][0];

        logger.debug("choiceOutcome index -- " + choiceOutcome);
        logger.debug("selectedOutcome -- " + selectedOutcome);

        if (selectedOutcome === 0) { // Next
            if (!maskMFAOptions || !maskMFAOptions[choiceOutcome]) {
                logger.debug("Invalid MFA selection index:  " + choiceOutcome);
            }

            var selectedMFA = JSON.parse(maskMFAOptions[choiceOutcome]);

            nodeState.putShared("selctedMFAtoAuthentication", maskMFAOptions[choiceOutcome]);
            nodeState.putShared("removeMfaMethod", selectedMFA.MFAMethod);
            nodeState.putShared("removeMFAValue", selectedMFA.MFAValue);
            nodeState.putShared("MFAMethodRegisterd", null);
            nodeState.putShared("validationErrorCode", null);

            logger.debug(
                "Selected MFA: " +
                selectedMFA.MFAMethod +
                " | " +
                selectedMFA.MFAValue
            );
            nodeState.putShared("optedMFAMethod", selectedMFA.MFAValue);

            if (selectedMFA.MFAMethod === "EMAIL") {
                action.goTo("email");
                return;

            } else if (selectedMFA.MFAMethod === "SMSVOICE") {
                var origIndex = selectedMFA.originalIndex;
                nodeState.putShared("selectedphonenumber", unmaskedValues[origIndex]);
                logger.debug("the selected phone num is"+unmaskedValues[origIndex])
                action.goTo(NodeOutcome.PHONE);
                return;

            } else if (selectedMFA.MFAMethod === "SYMANTEC") {
               action.goTo(NodeOutcome.SYMANTEC);
                return;

            } else if (selectedMFA.MFAMethod === "TOTP" || selectedMFA.MFAMethod === "FRTOTP") {
                action.goTo(NodeOutcome.TOTP);
                return;

            } else if (selectedMFA.MFAMethod === "PUSH" || selectedMFA.MFAMethod === "FRPUSH") {
                nodeState.putShared("helpdeskjourney", "true");
                action.goTo(NodeOutcome.PUSH);
                return;

            } else if (selectedMFA.MFAMethod === "PRIMARYSECONDARYEMAIL") {
                nodeState.putShared("primary_secondary_email", true);
                action.goTo("primarysecondaryemail");
                return;

            } else {
                action.goTo("error");
                return;
            }

        } else if (selectedOutcome === 1) { // Back
            nodeState.putShared("notAllowedtoRemoveMessage", null);
            nodeState.putShared("validationErrorCode", null);
            node

        }
    } catch (e){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error getMFAMethods: " + e.message);
        return null;
    }
}


function createFallbackEmailMFA(usrKOGID, userMail) {
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails");
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState);
        var mfajsonObj = {
            'KOGId': usrKOGID,
            'MFAMethod': 'EMAIL',
            'MFAValue': userMail,
            'MFAStatus': 'ACTIVE',
            'isRecoveryOnly': false,
            'createDate': auditData.createdDate,
            'createDateEpoch': auditData.createdDateEpoch,
            'createdBy': auditData.createdBy,
            'createdByID': auditData.createdByID,
            'updateDate': auditData.updatedDate,
            'updateDateEpoch': auditData.updatedDateEpoch,
            'updatedBy': auditData.updatedBy,
            'updatedByID': auditData.updatedByID
        };
        openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
        nodeLogger.error(transactionid + "::createFallbackEmailMFA: Successfully created fallback EMAIL MFA for KOGID: " + usrKOGID);
        return true;
    } catch (error) {
        nodeLogger.error(transactionid + "::createFallbackEmailMFA: Error creating fallback EMAIL MFA: " + error.message);
        return false;
    }
}

function getMFAMethods(usrKOGID) {
    try {
        var displayOptions = [];    
        var unmaskedOptions = []; 
        
        var MFAMethods = [];
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE"' });
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
               // STORE TRUE VALUE SEPARATELY (not sent to display choice callback)
                unmaskedOptions.push(MFAValue);

                // ---- DISPLAY VERSION SENT TO CHOICE CALLBACK ----
                displayOptions.push(JSON.stringify(finalItem));

                nodeState.putShared("MFARegistered","true");
            }
             return {
                displayOptions: displayOptions,
                unmaskedOptions: unmaskedOptions
            };
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error getMFAMethods: " + error.message);
        return null;
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

function maskEmail(email){
    var lastLetter = email.split("@")[0];
    lastLetter = lastLetter.slice(-2);
    var maskedEmail = email[0] + "****" + lastLetter + "@" + email.split("@")[1];
    return maskedEmail;
}


function maskMFAMethods(mfaOptions, userData) {
    try {
        var data = [];
        var emailIndex = -1;
        var secondaryIndex = -1;

        var emailEntry = null;
        var secondaryEntry = null;

        if (!mfaOptions || mfaOptions.length === 0) {
            return null;
        }

        // mask and store items preserving index
        for (var i = 0; i < mfaOptions.length; i++) {
            var entry = JSON.parse(mfaOptions[i]);

           entry.originalIndex = i;   //PA:keep original index so we can map to unmaskedValues later
            
            if (entry.MFAMethod === "EMAIL") {
                entry.MFAValue = maskEmail(entry.MFAValue);
                emailEntry = entry;
                emailIndex = i;
                continue;

            } else if (entry.MFAMethod === "SECONDARY_EMAIL") {
                nodeState.putShared("alternatemail", entry.MFAValue);
                entry.MFAValue = maskEmail(entry.MFAValue);
                secondaryEntry = entry;
                secondaryIndex = i;
                continue;

            } else if (entry.MFAMethod === "SMSVOICE") {
                entry.MFAValue = maskPhoneNumber(entry.MFAValue);

            } else if (entry.MFAMethod === "SYMANTEC") {
                entry.MFAValue = maskSymantecID(entry.MFAValue);

            } else if (entry.MFAMethod === "TOTP" && entry.MFAValue === "GOOGLE") {
                entry.MFAValue = "GOOGLE";

            } else if (entry.MFAMethod === "TOTP" && entry.MFAValue === "MICROSOFT") {
                entry.MFAValue = "MICROSOFT";

            } else if ((entry.MFAMethod === "TOTP" || entry.MFAMethod === "FRTOTP") && (entry.MFAValue === "FORGEROCK" || entry.MFAValue === "DEVICE")) {
                entry.MFAMethod = "TOTP";
                entry.MFAValue = "FORGEROCK";

            } else if (entry.MFAMethod === "PUSH" || entry.MFAMethod === "FRPUSH") {
                entry.MFAValue = "FORGEROCK";
                entry.MFAMethod = "PUSH";
            }

            data[i] = JSON.stringify(entry);
        }

        // ---- MERGE EMAIL / SECONDARY_EMAIL ----
        if (emailEntry && secondaryEntry) {
            var isRecoveryOnly = emailEntry.isRecoveryOnly || secondaryEntry.isRecoveryOnly;

            var mergedEntry = {
                MFAMethod: "PRIMARYSECONDARYEMAIL",
                MFAValue: "Primary: " + emailEntry.MFAValue +
                          " & Secondary: " + secondaryEntry.MFAValue,
                PrimaryEmail: emailEntry.MFAValue,
                SecondaryEmail: secondaryEntry.MFAValue,
                isRecoveryOnly: isRecoveryOnly
            };

            // Replace whichever index appeared FIRST in original array
            var insertIndex = Math.min(emailIndex, secondaryIndex);
            mergedEntry.originalIndex = insertIndex; // PA:ensure merged entry also maps to original index
            
            data[insertIndex] = JSON.stringify(mergedEntry);

            // Remove the other entry index
            var removeIndex = Math.max(emailIndex, secondaryIndex);
            delete data[removeIndex];

        } else if (emailEntry && !secondaryEntry) {
            data[emailIndex] = JSON.stringify(emailEntry);

        } else if (secondaryEntry && !emailEntry) {
            data[secondaryIndex] = JSON.stringify(secondaryEntry);
        }

        data = data.filter(function (x) { return x !== undefined; });

        return data;

    } catch (error) {
        nodeLogger.error("Error maskMFAMethods: " + error.message);
        return null;
    }
}

function patchRequestEntry(id) {
    try {
        var contentArray = [
            { "operation": "replace", "field": "status", "value": "COMPLETED" },
            { "operation": "replace", "field": "updatedate", "value": dateTime },
            { "operation": "replace", "field": "enddate", "value": dateTime }
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
