var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.MFALoginAuthn.Main",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EMAIL: "email",
    PRIMARY_SECONDARY_EMAIL: "primary and secondary email",
    SMS: "sms",
    AUTHENTICATOR: "authenticator",
    HELPDESK: "helpdesk",
    FAILED: "false"
};

// Logger Function
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};


// Function to get user ID from node state
function getUserId() {
    try {
         if(nodeState.get("helpdeskjourney") === "true" && requestParameters.get("_id")){
            var userId = requestParameters.get("_id")[0]
            logger.debug("the userID from nodeState: "+userId)
         } else {
                var userId = nodeState.get("_id");
                logger.debug("the _id from nodeState: "+userId)
        }
           
        
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

function availableMFAOptions() {
    return ["EMAIL","SMSVOICE","SYMANTEC","TOTP","PUSH","PRIMARY_SECONDARY_EMAIL","FRTOTP","FRPUSH"];
}

// Function to build MFA options array with localization
function buildMFAOptionsArray(common, usrMFAData) {
    var mfaOptionsArray = [];
    var messages = {
        en: {
            EMAIL: "Email",
            PRIMARY_SECONDARY_EMAIL:"PrimarySecondaryEmail",
            SMSVOICE: "MobilePhone",
            AUTHENTICATOR: "AuthenticatorApplication",
			IDPROOFING:"IdProofing"	,
            HELPDESK:"I don't have access"
        }
    };
    var authenticatorOptionAdded = false;
    try {
        for (var i = 0; i < common.length; i++) {
            var mfaMethod = common[i];

            logger.debug("alternatemail from nodestate : "+nodeState.get("alternatemail"));
           // nodeState.putShared("alternatemail",null);
           // if(nodeState.get("alternatemail") == null && mfaMethod === "EMAIL")){
			   if(mfaMethod === "EMAIL"){
						if(nodeState.get("alternatemail") == null){
						logger.debug("alternatemail null: "+nodeState.get("alternatemail"));
						mfaMethod = "EMAIL";
						var email = nodeState.get("mail");
						var emailMessage = messages["en"][mfaMethod];
						mfaOptionsArray.push(emailMessage + "|EMAIL");
					}else if(!(nodeState.get("alternatemail") == null)){
						logger.debug("alternatemail not null : "+nodeState.get("alternatemail"));
						// if(!(nodeState.get("alternatemail") == null)){
						mfaMethod = "PRIMARY_SECONDARY_EMAIL";
						var primarysecondaryemailMessage = messages["en"][mfaMethod];
						nodeState.putShared("primary_secondary_email",true);
						mfaOptionsArray.push(primarysecondaryemailMessage + "|PRIMARY_SECONDARY_EMAIL");
				}

            } /*else if(!(nodeState.get("alternatemail") == null)){
                logger.debug("alternatemail not null : "+nodeState.get("alternatemail"));
               // if(!(nodeState.get("alternatemail") == null)){
                mfaMethod = "PRIMARY_SECONDARY_EMAIL";
                    var primarysecondaryemailMessage = messages["en"][mfaMethod];
                    nodeState.putShared("primary_secondary_email",true);
                    mfaOptionsArray.push(primarysecondaryemailMessage + "|PRIMARY_SECONDARY_EMAIL");
               // }
                
            }*/ else if (mfaMethod === "SMSVOICE") {
                var phoneNumbers = getUserActiveMFAValue(usrMFAData, "SMSVOICE");
                // for (var j = 0; j < phoneNumbers.length; j++) {
                //     var phoneMessage = messages["en"][mfaMethod];
                //     mfaOptionsArray.push(phoneMessage + "|" + "SMSVOICE");
                // }

                var phoneMessage = messages["en"][mfaMethod];
                 mfaOptionsArray.push(phoneMessage + "|" + "SMSVOICE");
                
            } else if (["SYMANTEC", "TOTP", "PUSH","FRTOTP","FRPUSH"].includes(mfaMethod)) {
                if (!authenticatorOptionAdded) {
                    var authMessage = messages["en"]["AUTHENTICATOR"];
                    mfaOptionsArray.push(authMessage + "|AUTHENTICATOR");
                    authenticatorOptionAdded = true;
                }
            }
            // else if (mfaMethod === "SYMANTEC" || mfaMethod === "TOTP" || mfaMethod === "PUSH") {
            //     var authMessage = messages["en"][mfaMethod];
            //     mfaOptionsArray.push(authMessage + "|AUTHENTICATOR");
            // }
        }
		var idProofingMessage = messages["en"]["IDPROOFING"];
        if(nodeState.get("showRIDP") && nodeState.get("showRIDP") == true){
            mfaOptionsArray.push(idProofingMessage + "|" + "IdProofing");		// Removing RIDP Option for 2/6				
        }
                  									 
																			  
		if(nodeState.get("firstTimePasswordReset")!=null && nodeState.get("firstTimePasswordReset")=="true"){
             
            var helpdeskMessage = messages["en"]["HELPDESK"];
			mfaOptionsArray.push(helpdeskMessage + "|HELPDESK");
        }
		

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error building MFA options: " + error.message);
    }

    return mfaOptionsArray;
}


// Function to handle callbacks and set the action
function processCallbacks(mfaArray,getFaqTopicId) {
    var mfaOptions = mfaArray.map(option => option.split("|")[0]);
    logger.debug("mfaArray inside processCallbacks : "+mfaArray);
    try {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Processing callbacks");

        // callbacksBuilder.textOutputCallback(0, "Select a method to authenticate");
            
                if (callbacks.isEmpty()) {
                        var jsonobj = {"pageHeader": "2_Select a method to authenticate"};
                        logger.debug("jsonobj : "+jsonobj);
                        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));         

                //Below code is used only for helpdesk purpose. When helpdesk user verifies end user mfa
                if (requestParameters.get("_id")) {
                var usrFullName = "";
                var usrMail = "";
            
                var firstName = nodeState.get("firstName") || "";
                var lastName = nodeState.get("lastName") || "";
                var email = nodeState.get("email") || "";
            
                if (firstName || lastName) {
                    usrFullName = firstName + " " + lastName;
                    callbacksBuilder.textOutputCallback(0, usrFullName);
                }
            
                if (email) {
                    usrMail = email;
                    callbacksBuilder.textOutputCallback(0, usrMail);
                }
            }
            
            callbacksBuilder.choiceCallback("Select_any_option", mfaOptions, 0, false);
            callbacksBuilder.confirmationCallback(0, ["Next", "Cancel"], 0);
            //FAQ topic logic
            if (getFaqTopicId != null) {
            callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
                logger.debug("getFaqTopicId : "+getFaqTopicId);
            }
            
        } else {
            var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

//             var selectedIndex = callbacks.getChoiceCallbacks().get(0).getSelectedIndexes()[0];
// var selectedOutcome = callbacks.getConfirmationCallbacks().get(0).getSelectedIndex();
            
            if (selectedOutcome === 0) { 
                logger.debug("next is selected")
                var selectedLabel = mfaOptions[selectedIndex];
                var selectedFull = mfaArray.find(item => item.startsWith(selectedLabel));
                var selectedMethod = selectedFull.split("|")[1];

                nodeState.putShared("blankmsg", null);
                if(selectedLabel === "IdProofing"){
                    nodeState.putShared("journeyName","forgotPassword")
                    action.goTo("idProofing")
                    
                }
				else if (selectedMethod === "EMAIL") {
                    logger.debug("Email is selected")
                    action.goTo(NodeOutcome.EMAIL);
                } else if(selectedMethod === "PRIMARY_SECONDARY_EMAIL"){
                    logger.debug("primary secondary Email is selected");
                    
                    action.goTo(NodeOutcome.PRIMARY_SECONDARY_EMAIL);
                    
                }else if (selectedMethod === "SMSVOICE") {
                    action.goTo(NodeOutcome.SMS);
                } else if (selectedMethod === "AUTHENTICATOR") {
                    action.goTo(NodeOutcome.AUTHENTICATOR);
                } 
                else if (selectedMethod === "HELPDESK"){
                    action.goTo(NodeOutcome.HELPDESK);
                }
                else {
                    action.goTo(NodeOutcome.FAILED);
                }
            } else {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::User cancelled");
                 nodeState.putShared("usercancel", "true");
                action.goTo(NodeOutcome.FAILED);
            }
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error processing callbacks: " + error.message);
        nodeState.putShared("blankmsg", null);
        action.goTo(NodeOutcome.FAILED);
    }
}


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}


// function getUserMFAMethods(usrMFAData) {
//     var mfaOptionsArray = []
//     if (usrMFAData.result.length > 0) {
//         for (var i = 0; i < usrMFAData.result.length; i++) {
//             var mfaMethodResponse = usrMFAData.result[i];
//             if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
//                 mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]); 
//             }
//         }
//     }
//     return mfaOptionsArray;
// }


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    nodeState.putShared("alternatemail", null);
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            nodeLogger.debug("Printing the mfaMethodResponse ::::::::::::: " + mfaMethodResponse)
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]);
                var mfaMethod = usrMFAData.result[i].MFAMethod;
                if (mfaMethod === "EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("collectedPrimaryEmail", mfaValue);
                }

                if (mfaMethod === "SECONDARY_EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("alternatemail", mfaValue);
                }

            }
        }
    }
    return mfaOptionsArray;
}



function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) === 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;
																																																									 
																	   
}

// Function to create MFA object for user with primary email as fallback
function createFallbackEmailMFA(usrKOGID, userMail) {
    try {
        nodeLogger.debug("Creating fallback EMAIL MFA for user: " + usrKOGID + " with email: " + userMail);
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
        nodeLogger.debug("Successfully created fallback EMAIL MFA for user: " + usrKOGID);
        return true;
    } catch (error) {
        nodeLogger.error("Error creating fallback EMAIL MFA: " + error.message);
        return false;
    }
}

// Main execution
function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);

    try {
        //help topic logic
         var lib = require("KYID.Library.FAQPages");
        var process = "forgot_password";
        var pageHeader = "2_Select a method to authenticate";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader, process);
        logger.debug("getFaqTopicId 1: "+getFaqTopicId);
        
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                logger.debug("usrMFAData : "+usrMFAData);
                var mfaResult = usrMFAData.result;
                logger.debug("mfaResult : "+mfaResult);
                logger.debug("usrMFAData.result.length : "+usrMFAData.result.length);
                if(usrMFAData.result.length === 0){
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No MFA methods found for user");
                    // Fallback: Create EMAIL MFA using user's primary email
                    if (userData.mail != null && typeof userData.mail != "undefined") {
                        nodeLogger.debug("Creating fallback EMAIL MFA using primary email: " + userData.mail);
                        var mfaCreated = createFallbackEmailMFA(userData.userName, userData.mail);
                        if (mfaCreated) {
                            // Re-fetch MFA data after creating fallback
                            usrMFAData = getMFAObject(userData.userName);
                            nodeLogger.debug("Re-fetched MFA data after fallback creation: " + usrMFAData);
                        } else {
                            nodeLogger.error("Failed to create fallback EMAIL MFA");
                            action.goTo(NodeOutcome.FAILED);
                            return;
                        }
                    } else {
                        nodeLogger.error("No primary email available for fallback MFA");
                        action.goTo(NodeOutcome.FAILED);
                        return;
                    }
                }

                var userMFAMethods = getUserMFAMethods(usrMFAData);
                logger.debug("userMFAMethods : "+userMFAMethods);
                var newMFAOptions = availableMFAOptions();
                var common = newMFAOptions.filter(value => userMFAMethods.includes(value));
                logger.debug("common : "+common);
                var arrayWithMessages = buildMFAOptionsArray(common, usrMFAData);
                logger.debug("arrayWithMessages : "+arrayWithMessages);

                if (arrayWithMessages && arrayWithMessages.length > 0) {
                    processCallbacks(arrayWithMessages,getFaqTopicId);
                } else {
                    nodeState.putShared("blankmsg", null);
                    action.goTo(NodeOutcome.FAILED);
                }
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main: " + error.message);
    }

    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
}

// Trigger main function
main();

