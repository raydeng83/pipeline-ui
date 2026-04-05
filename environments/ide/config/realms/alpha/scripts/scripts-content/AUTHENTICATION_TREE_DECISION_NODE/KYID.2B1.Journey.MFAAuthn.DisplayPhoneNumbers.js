dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthn.DisplayPhoneNumbers",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SMS: "sms",
    VOICE: "voice",
    BACK: "back"
};

// Logger
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); }
};

function getUserId() {
    try {
        
        if(nodeState.get("helpdeskjourney") === "true" && requestParameters.get("_id")){
            var userId = requestParameters.get("_id")[0]
            logger.debug("the userID from nodeState: "+userId)
         } else {
                var userId = nodeState.get("_id");
                logger.debug("the _id from nodeState: "+userId)
        }
         
        nodeLogger.debug("User ID: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error("Error retrieving user ID: " + error.message);
        return null;
    }
}

function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error("Error reading user data: " + error.message);
        return null;
    }
}

function buildMFAOptionsArray(usrMFAData) {
    var mfaOptionsArray = [];

    try {
        var numbers = getUserActiveMFAValue(usrMFAData, "SMSVOICE");
        for (var j = 0; j < numbers.length; j++) {
            var number = numbers[j];
            //var masked = number.substring(0, number.length - 10) + " ***-***-" + number.slice(-4);
            var masked = " ***-***-" + number.slice(-4);
            var message = masked + "|" + number;
            mfaOptionsArray.push(message);
        }
    } catch (e) {
        nodeLogger.error("Error building MFA options: " + e.message);
    }

    return mfaOptionsArray;
}

function processCallbacks(mfa) {
    var mfaOptions = [];
    for (var i = 0; i < mfa.length; i++) {
        mfaOptions.push(mfa[i].split("|")[0]);
    }
    var lib = require("KYID.Library.FAQPages");
    var process ="MasterLogin";
    var pageHeader= "2_Select mobile number";
    try{
         var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    } catch (e){
        logger.error("KYID.2B1.Journey.MFAAuthn.DisplayPhoneNumbers::error in Faq topic")
    }
   

    var promptMessage = "Which_mobile_number_would_you_like_to_use";

    if (callbacks.isEmpty()) {
        var jsonobj = {"pageHeader": "2_Select mobile number"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj))
        callbacksBuilder.textOutputCallback(0, "<div class='page-element'></div>");
        callbacksBuilder.choiceCallback(promptMessage, mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["TextMessage", "VoiceCall","Back"], 0);
        if (getFaqTopicId != null) {
                
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
            }
    } else {
        var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
        var confirmationChoice = callbacks.getConfirmationCallbacks().get(0);
        var phoneNumber = mfa[selectedIndex].split("|")[1];

        nodeState.putShared("smsvoice", phoneNumber);

        nodeState.putShared("telephoneNumber", phoneNumber);
        
        if(confirmationChoice === 2) {
            action.goTo(NodeOutcome.BACK);
        }
        else if (confirmationChoice === 0) {
            nodeState.putShared("MFAMethod","sms")
            action.goTo(NodeOutcome.SMS);
        } else {
            nodeState.putShared("MFAMethod","voice")
            action.goTo(NodeOutcome.VOICE);
        }
    }
    
}

function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try {
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Data: " + userData);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                var arrayWithMessages = buildMFAOptionsArray(usrMFAData);

                if (arrayWithMessages && arrayWithMessages.length > 0) {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User has registered MFA options.");
                    processCallbacks(arrayWithMessages);
                } else {
                    nodeState.putShared("blankmsg", null);
                    action.goTo(NodeOutcome.FAILED);
                }
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in main execution: " + error.message);
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
}

function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
        });
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: " + mfaMethodResponses);
        return mfaMethodResponses;
    } catch (error) {
        nodeLogger.error("Error in obtaining MFA data for the user: " + error.message);
    }
}

function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = [];
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"] === "ACTIVE" && mfaMethodResponse["MFAMethod"] === usrMFAType) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;
}

// Main execution
main();
// dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "NodeMFA Authentication List",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.MFAAuthn.DisplayPhoneNumbers",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     SMS: "sms",
//     VOICE: "voice"
// };

// // Logger
// var nodeLogger = {
//     debug: function (message) { logger.debug(message); },
//     error: function (message) { logger.error(message); }
// };

// function getUserId() {
//     try {
//         var userId = nodeState.get("_id");
//         nodeLogger.error("User ID: " + userId);
//         return userId;
//     } catch (error) {
//         nodeLogger.error("Error retrieving user ID: " + error.message);
//         return null;
//     }
// }

// function fetchUserData(userId) {
//     try {
//         return openidm.read("managed/alpha_user/" + userId);
//     } catch (error) {
//         nodeLogger.error("Error reading user data: " + error.message);
//         return null;
//     }
// }

// function buildMFAOptionsArray(usrMFAData) {
//     var mfaOptionsArray = [];

//     try {
//         var numbers = getUserActiveMFAValue(usrMFAData, "SMSVOICE");
//         for (var j = 0; j < numbers.length; j++) {
//             var number = numbers[j];
//             var masked = number.substring(0, number.length - 10) + " ***-***-" + number.slice(-4);
//             var message = masked + "|" + number;
//             mfaOptionsArray.push(message);
//         }
//     } catch (e) {
//         nodeLogger.error("Error building MFA options: " + e.message);
//     }

//     return mfaOptionsArray;
// }

// function processCallbacks(mfa) {
//     var mfaOptions = [];
//     for (var i = 0; i < mfa.length; i++) {
//         mfaOptions.push(mfa[i].split("|")[0]);
//     }

//     var promptMessage = "Which_mobile_number_would_you_like_to_use";

//     if (callbacks.isEmpty()) {
//         callbacksBuilder.textOutputCallback(0, "<div class='page-element'></div>");
//         callbacksBuilder.choiceCallback(promptMessage, mfaOptions, 0, false);
//         callbacksBuilder.confirmationCallback(0, ["TextMessage", "VoiceCall"], 0);
//     } else {
//         var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
//         var confirmationChoice = callbacks.getConfirmationCallbacks().get(0);
//         var phoneNumber = mfa[selectedIndex].split("|")[1];

//         nodeState.putShared("smsvoice", phoneNumber);

//         nodeState.putShared("telephoneNumber", phoneNumber);
//         //action.goTo(confirmationChoice === 0 ? NodeOutcome.SMS : NodeOutcome.VOICE);
//         if (confirmationChoice === 0) {
//             nodeState.putShared("MFAMethod","sms")
//             action.goTo(NodeOutcome.SMS);
//         } else {
//             nodeState.putShared("MFAMethod","voice")
//             action.goTo(NodeOutcome.VOICE);
//         }
//     }
// }

// function main() {
//     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
//     try {
//         var userId = getUserId();
//         if (userId) {
//             var userData = fetchUserData(userId);
//             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Data: " + userData);
//             if (userData) {
//                 var usrMFAData = getMFAObject(userData.userName);
//                 var arrayWithMessages = buildMFAOptionsArray(usrMFAData);

//                 if (arrayWithMessages && arrayWithMessages.length > 0) {
//                     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User has registered MFA options.");
//                     processCallbacks(arrayWithMessages);
//                 } else {
//                     nodeState.putShared("blankmsg", null);
//                     action.goTo(NodeOutcome.FAILED);
//                 }
//             }
//         }
//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in main execution: " + error.message);
//     }
//     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
// }

// function getMFAObject(usrKOGID) {
//     try {
//         var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
//             "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
//         });
//         nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: " + mfaMethodResponses);
//         return mfaMethodResponses;
//     } catch (error) {
//         nodeLogger.error("Error in obtaining MFA data for the user: " + error.message);
//     }
// }

// function getUserActiveMFAValue(usrMFAData, usrMFAType) {
//     var mfaValueArray = [];
//     if (usrMFAData.result.length > 0) {
//         for (var i = 0; i < usrMFAData.result.length; i++) {
//             var mfaMethodResponse = usrMFAData.result[i];
//             if (mfaMethodResponse["MFAStatus"] === "ACTIVE" && mfaMethodResponse["MFAMethod"] === usrMFAType) {
//                 mfaValueArray.push(mfaMethodResponse["MFAValue"]);
//             }
//         }
//     }
//     return mfaValueArray;
// }

// // Main execution
// main();