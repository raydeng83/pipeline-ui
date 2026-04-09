var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFALoginAuthn.RiskLevel",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EMAIL: "email",
    SMS: "phone",
    AUTHENTICATOR: "authenticator",
    NO_ACCESS: "noaccess",
    FAILED: "false",
    FIRSTTIMEBACK: "firsttimeback"
};

var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

// Setup
var loggerPrefix = "[MFA Routing Script]";
var riskLevel = nodeState.get("riskLevel") || "LOW";
//var riskLevel = "HIGH";
 var requiredMethod = nodeState.get("appRequiredMFAMethod") || "NA";
//var requiredMethod = "AUTHENTICATOR";
var userMFAs = nodeState.get("userMFAs");

var allFactors = {
    "AUTHENTICATOR": 3,
    "MOBILE": 2,
    "EMAIL": 1,
    "NA": 0
};

var availableWithLevels = [];
for (var i = 0; i < userMFAs.length; i++) {
    var method = userMFAs[i];
    if (allFactors[method]) {
        availableWithLevels.push({ method: method, level: allFactors[method] });
    }
}

// Log input state
logger.debug(loggerPrefix + " Risk Level: " + riskLevel);
logger.debug(loggerPrefix + " App Required MFA Method: " + requiredMethod);
logger.debug(loggerPrefix + " User Registered MFAs: " + JSON.stringify(userMFAs));

var hasRequired = requiredMethod ? userMFAs.indexOf(requiredMethod) !== -1 : true;
logger.debug(loggerPrefix + " Has Required Method: " + hasRequired);

// Build selectedMFAs
var selectedMFAs = [];

if (requiredMethod === "NA") {
    nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
    // Clear registration prompt as app do not required any MFA
    nodeState.putShared("needregistration", null);

    if (riskLevel === "HIGH") {
        var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
        selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
        logger.debug(loggerPrefix + " HIGH risk & requiredMethod=NA. Showing highest level MFA(s): " + JSON.stringify(selectedMFAs));
    } else if (riskLevel === "MEDIUM") {
        // Sort by descending level first , authenticator first
        availableWithLevels.sort(function(a, b) {
            return b.level - a.level;
        });
        
        // Get top 2 unique levels
        var uniqueLevels = [];
        for (var i = 0; i < availableWithLevels.length && uniqueLevels.length < 2; i++) {
            if (!uniqueLevels.includes(availableWithLevels[i].level)) {
                uniqueLevels.push(availableWithLevels[i].level);
            }
        }
        selectedMFAs = availableWithLevels.filter(x => uniqueLevels.includes(x.level)).map(x => x.method);
        logger.debug(loggerPrefix + " MEDIUM risk & requiredMethod=NA. Showing top two highest MFA(s): " + JSON.stringify(selectedMFAs));
    } else { 
        // LOW risk
        selectedMFAs = availableWithLevels.map(x => x.method);
        logger.debug(loggerPrefix + " LOW risk & requiredMethod=NA. Showing all MFA(s): " + JSON.stringify(selectedMFAs));
    }
} else {
if (riskLevel === "HIGH") {
    if (hasRequired) {
        var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
        selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
        logger.debug(loggerPrefix + " HIGH risk. Has required. Showing highest level: " + JSON.stringify(selectedMFAs));
    } else {
        // nodeState.putShared("needregistration", requiredMethod);
        // selectedMFAs = userMFAs;
        // logger.error(loggerPrefix + " HIGH risk. Missing required. Setting needregistration to: " + requiredMethod);
        var requiredLevel = allFactors[requiredMethod];
        var hasStrongerMethod = availableWithLevels.some(function (mfa) {
            return mfa.level > requiredLevel;
        });

        if (!hasStrongerMethod) {
            nodeState.putShared("needregistration", requiredMethod);
             nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
            logger.debug(loggerPrefix + " HIGH risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);
            
        } else {
            logger.debug(loggerPrefix + " HIGH risk. Missing required, but has stronger method. Skipping registration prompt.");
            nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
        }

         // Show only the highest available MFA method, not all
            var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
            selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
        
        //selectedMFAs = userMFAs;
       // logger.error(loggerPrefix + " HIGH risk. Missing required. Setting needregistration to: " + requiredMethod);
    }
} else if (riskLevel === "MEDIUM") {
    if (hasRequired) {
        var reqLevel = allFactors[requiredMethod];
        //keep only those MFA methods whose level is equal to or greater than reqLevel
        selectedMFAs = availableWithLevels.filter(x => x.level >= reqLevel).map(x => x.method);
        logger.debug(loggerPrefix + " MEDIUM risk. Has required. Showing level >= " + reqLevel + ": " + JSON.stringify(selectedMFAs));
    } else {
        // nodeState.putShared("needregistration", requiredMethod);
        // selectedMFAs = userMFAs;
         var requiredLevel = allFactors[requiredMethod];
        var hasStrongerMethod = availableWithLevels.some(function (mfa) {
            return mfa.level > requiredLevel;
        });

        if (!hasStrongerMethod) {
             selectedMFAs = userMFAs;
            nodeState.putShared("needregistration", requiredMethod);
            nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
            logger.debug(loggerPrefix + " MEDIUM risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);
        } else {
              // Show only the highest available MFA method, not all
            var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
            selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
            nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
            logger.debug(loggerPrefix + " MEDIUM risk. Missing required, but has stronger method. Skipping registration prompt.");
        }
        //logger.error(loggerPrefix + " MEDIUM risk. Missing required. Setting needregistration to: " + requiredMethod);
    }
} else {
    if (hasRequired) {
        var reqLevel = allFactors[requiredMethod];
        selectedMFAs = availableWithLevels.filter(x => x.level >= reqLevel).map(x => x.method);
        logger.debug(loggerPrefix + " LOW risk. Has required. Showing level >= " + reqLevel + ": " + JSON.stringify(selectedMFAs));
    } else {
        // nodeState.putShared("needregistration", requiredMethod);
        // selectedMFAs = userMFAs;
        // logger.error(loggerPrefix + " LOW risk. Missing required. Setting needregistration to: " + requiredMethod);
         var requiredLevel = allFactors[requiredMethod];
         var hasStrongerMethod = availableWithLevels.some(function (mfa) {
            return mfa.level > requiredLevel;
        });

        if (!hasStrongerMethod) {
            nodeState.putShared("needregistration", requiredMethod);
            nodeState.putShared("journeyNameReporting","RiskBased") //MFA Reporting
            logger.debug(loggerPrefix + " LOW risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);

        } else {
            logger.debug(loggerPrefix + " LOW risk. Missing required, but has stronger method. Skipping registration prompt.");
        }

        selectedMFAs = userMFAs;
    }
}
}

//Always include i dont have access option irrespective of risk level
if (selectedMFAs.indexOf("i_dont_have_access") === -1) {
    var KOGID = nodeState.get("KOGID") || nodeState.get("userName")
    var usrMFAData = getMFAObject(KOGID);
    var userMFAMethods = getUserMFAMethods(usrMFAData)
    nodeState.putShared("usrMFAData",JSON.stringify(usrMFAData))
    nodeState.putShared("userMFAMethods",JSON.stringify(userMFAMethods))
    
    logger.debug("showRIDP :: " + nodeState.get("showRIDP"))
    logger.debug("alternatemail :: " + JSON.stringify(userMFAMethods))
    
    if(nodeState.get("showRIDP") && nodeState.get("showRIDP") == true ){
        selectedMFAs.push("i_dont_have_access");
    }else if(nodeState.get("showRIDP")!= null && nodeState.get("showRIDP") == false && userMFAMethods.includes("SECONDARY_EMAIL")){
        selectedMFAs.push("i_dont_have_access");
    }
}

nodeState.putShared("mfaOptions", selectedMFAs);

// -------------------- FUNCTIONS --------------------

function requestCallbacks() {
    var lib = require("KYID.Library.FAQPages");
        var process ="MasterLogin";
        var pageHeader= "1_select_method_to_authenticate";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        
    logger.debug(loggerPrefix + " Presenting MFA selection UI to user");

    var displayList = selectedMFAs.map(function (m) {
        if (m === "AUTHENTICATOR") return "AuthenticatorApplication";
        if (m === "MOBILE") return "MobilePhone";
        if (m === "EMAIL") return "Email";
        if (m === "i_dont_have_access") return "I don't have access to any method";
        return m;
    });

    var jsonobj ={};
    var firstName = null;
     var lastName = null;
    var usrmail = null;
    if (nodeState.get("firstName")) {
            firstName = nodeState.get("firstName");
        }
        if (nodeState.get("lastName")) {
            lastName = nodeState.get("lastName");
        }
    if(nodeState.get("mail")){
        usrmail = nodeState.get("mail");
    }
        var firstAndLastName = firstName + " " + lastName
     logger.debug("firstAndLastName " + firstAndLastName);
    if(nodeState.get("firsttimemfaheader") === "firsttimemfaheader") {
         jsonobj = {"pageHeader": "1_firsttime_select_method_to_authenticate"};
    } else {
         jsonobj = {"pageHeader": "1_select_method_to_authenticate",
                    "userName":firstAndLastName,
                    "mail": usrmail
                    };
    }
    //var jsonobj = {"pageHeader": "1_select_method_to_authenticate"};
    callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    
    callbacksBuilder.textOutputCallback(0, "Select a method to authenticate");
    callbacksBuilder.choiceCallback("Select_any_option", displayList, 0, false);
    callbacksBuilder.confirmationCallback(0, ["Next", "Cancel"], 0);
    if (getFaqTopicId != null) {
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
            }
}

function handleResponse() {
    var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

    if (selectedOutcome === 0) {
        var selectedMFA = selectedMFAs[selectedIndex];
        nodeState.putShared("selectedMFA", selectedMFA);
        logger.debug(loggerPrefix + " User confirmed selection: " + selectedMFA);

        if (selectedMFA === "EMAIL") {
            logger.debug("Email is selected");
            action.goTo(NodeOutcome.EMAIL);
             return;
        } else if (selectedMFA === "MOBILE") {
            logger.debug("Mobile is selected");
            action.goTo(NodeOutcome.SMS);
             return;
        } else if (selectedMFA === "AUTHENTICATOR") {
            logger.debug("authenticator is selected");
            action.goTo(NodeOutcome.AUTHENTICATOR);
            return;
        } else if (selectedMFA === "i_dont_have_access") {
            logger.debug("User selected: I don't have access to any method");
             nodeState.putShared("backfromridploginsecurity",null)
            action.goTo(NodeOutcome.NO_ACCESS); 
            return;
        } else {
            action.goTo(NodeOutcome.FAILED);
             return;
        }
    } else {
        if(nodeState.get("firsttimemfaheader") === "firsttimemfaheader"){
            logger.debug(" User cancelled MFA selection from first time login mfa screen");
              nodeState.putShared("backfrommfadisplay","backfrommfadisplay") 
              action.goTo(NodeOutcome.FIRSTTIMEBACK);
            return;
            } else {
             logger.debug(loggerPrefix + " User cancelled MFA selection.");
                action.goTo(NodeOutcome.FAILED);
                 return;
            }
       
    }
}

function main() {
    try {
        if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleResponse();
        }
    } catch (e) {
        logger.error("Main script error: " + e);
        action.goTo(NodeOutcome.FAILED);
    }
}

main();


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}


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

// var dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "NodeMFA Authentication List",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.MFALoginAuthn.RiskLevel",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     EMAIL: "email",
//     SMS: "phone",
//     AUTHENTICATOR: "authenticator",
//     FAILED: "false"
// };

// var nodeLogger = {
//     debug: function (message) {
//         logger.debug(message);
//     },
//     error: function (message) {
//         logger.error(message);
//     }
// };

// // Setup
// var loggerPrefix = "[MFA Routing Script]";
// var riskLevel = nodeState.get("riskLevel");
// //var riskLevel = "MEDIUM";
//  var requiredMethod = nodeState.get("appRequiredMFAMethod");
// //var requiredMethod = "MOBILE";
// var userMFAs = nodeState.get("userMFAs");


// var allFactors = {
//     "AUTHENTICATOR": 3,
//     "MOBILE": 2,
//     "EMAIL": 1,
//     "NA": 0
// };

// var availableWithLevels = [];
// for (var i = 0; i < userMFAs.length; i++) {
//     var method = userMFAs[i];
//     if (allFactors[method]) {
//         availableWithLevels.push({ method: method, level: allFactors[method] });
//     }
// }

// // Log input state
// logger.error(loggerPrefix + " Risk Level: " + riskLevel);
// logger.error(loggerPrefix + " App Required MFA Method: " + requiredMethod);
// logger.error(loggerPrefix + " User Registered MFAs: " + JSON.stringify(userMFAs));

// var hasRequired = requiredMethod ? userMFAs.indexOf(requiredMethod) !== -1 : true;
// logger.error(loggerPrefix + " Has Required Method: " + hasRequired);

// // Build selectedMFAs
// var selectedMFAs = [];

// if (requiredMethod === "NA") {
//     // Clear registration prompt as app do not required any MFA
//     nodeState.putShared("needregistration", null);

//     if (riskLevel === "HIGH") {
//         var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
//         selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
//         logger.error(loggerPrefix + " HIGH risk & requiredMethod=NA. Showing highest level MFA(s): " + JSON.stringify(selectedMFAs));
//     } else if (riskLevel === "MEDIUM") {
//         // Sort by descending level first , authenticator first
//         availableWithLevels.sort(function(a, b) {
//             return b.level - a.level;
//         });
        
//         // Get top 2 unique levels
//         var uniqueLevels = [];
//         for (var i = 0; i < availableWithLevels.length && uniqueLevels.length < 2; i++) {
//             if (!uniqueLevels.includes(availableWithLevels[i].level)) {
//                 uniqueLevels.push(availableWithLevels[i].level);
//             }
//         }
//         selectedMFAs = availableWithLevels.filter(x => uniqueLevels.includes(x.level)).map(x => x.method);
//         logger.error(loggerPrefix + " MEDIUM risk & requiredMethod=NA. Showing top two highest MFA(s): " + JSON.stringify(selectedMFAs));
//     } else { 
//         // LOW risk
//         selectedMFAs = availableWithLevels.map(x => x.method);
//         logger.error(loggerPrefix + " LOW risk & requiredMethod=NA. Showing all MFA(s): " + JSON.stringify(selectedMFAs));
//     }
// } else {
// if (riskLevel === "HIGH") {
//     if (hasRequired) {
//         var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
//         selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
//         logger.error(loggerPrefix + " HIGH risk. Has required. Showing highest level: " + JSON.stringify(selectedMFAs));
//     } else {
//         // nodeState.putShared("needregistration", requiredMethod);
//         // selectedMFAs = userMFAs;
//         // logger.error(loggerPrefix + " HIGH risk. Missing required. Setting needregistration to: " + requiredMethod);
//         var requiredLevel = allFactors[requiredMethod];
//         var hasStrongerMethod = availableWithLevels.some(function (mfa) {
//             return mfa.level > requiredLevel;
//         });

//         if (!hasStrongerMethod) {
//             nodeState.putShared("needregistration", requiredMethod);
//             logger.error(loggerPrefix + " HIGH risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);
//         } else {
//             logger.error(loggerPrefix + " HIGH risk. Missing required, but has stronger method. Skipping registration prompt.");
//         }

//          // Show only the highest available MFA method, not all
//     var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
//     selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
        
//         //selectedMFAs = userMFAs;
//        // logger.error(loggerPrefix + " HIGH risk. Missing required. Setting needregistration to: " + requiredMethod);
//     }
// } else if (riskLevel === "MEDIUM") {
//     if (hasRequired) {
//         var reqLevel = allFactors[requiredMethod];
//         //keep only those MFA methods whose level is equal to or greater than reqLevel
//         selectedMFAs = availableWithLevels.filter(x => x.level >= reqLevel).map(x => x.method);
//         logger.error(loggerPrefix + " MEDIUM risk. Has required. Showing level >= " + reqLevel + ": " + JSON.stringify(selectedMFAs));
//     } else {
//         // nodeState.putShared("needregistration", requiredMethod);
//         // selectedMFAs = userMFAs;
//          var requiredLevel = allFactors[requiredMethod];
//         var hasStrongerMethod = availableWithLevels.some(function (mfa) {
//             return mfa.level > requiredLevel;
//         });

//         if (!hasStrongerMethod) {
//              selectedMFAs = userMFAs;
//             nodeState.putShared("needregistration", requiredMethod);
//             logger.error(loggerPrefix + " MEDIUM risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);
//         } else {
//               // Show only the highest available MFA method, not all
//             var maxLevel = Math.max.apply(null, availableWithLevels.map(x => x.level));
//             selectedMFAs = availableWithLevels.filter(x => x.level === maxLevel).map(x => x.method);
//             logger.error(loggerPrefix + " MEDIUM risk. Missing required, but has stronger method. Skipping registration prompt.");
//         }
//         //logger.error(loggerPrefix + " MEDIUM risk. Missing required. Setting needregistration to: " + requiredMethod);
//     }
// } else {
//     if (hasRequired) {
//         var reqLevel = allFactors[requiredMethod];
//         selectedMFAs = availableWithLevels.filter(x => x.level >= reqLevel).map(x => x.method);
//         logger.error(loggerPrefix + " LOW risk. Has required. Showing level >= " + reqLevel + ": " + JSON.stringify(selectedMFAs));
//     } else {
//         // nodeState.putShared("needregistration", requiredMethod);
//         // selectedMFAs = userMFAs;
//         // logger.error(loggerPrefix + " LOW risk. Missing required. Setting needregistration to: " + requiredMethod);
//          var requiredLevel = allFactors[requiredMethod];
//         var hasStrongerMethod = availableWithLevels.some(function (mfa) {
//             return mfa.level > requiredLevel;
//         });

//         if (!hasStrongerMethod) {
//             nodeState.putShared("needregistration", requiredMethod);
//             logger.error(loggerPrefix + " LOW risk. Missing required and no stronger method. Prompting registration for: " + requiredMethod);
//         } else {
//             logger.error(loggerPrefix + " LOW risk. Missing required, but has stronger method. Skipping registration prompt.");
//         }

//         selectedMFAs = userMFAs;
//     }
// }
// }

// nodeState.putShared("mfaOptions", selectedMFAs);

// // -------------------- FUNCTIONS --------------------

// function requestCallbacks() {
//     var lib = require("KYID.Library.FAQPages");
//         var process ="MasterLogin";
//         var pageHeader= "1_select_method_to_authenticate";
//         var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        
//     logger.error(loggerPrefix + " Presenting MFA selection UI to user");

//     var displayList = selectedMFAs.map(function (m) {
//         if (m === "AUTHENTICATOR") return "AuthenticatorApplication";
//         if (m === "MOBILE") return "MobilePhone";
//         if (m === "EMAIL") return "Email";
//         return m;
//     });
//     var jsonobj = {"pageHeader": "1_select_method_to_authenticate"};
//     callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    
//     callbacksBuilder.textOutputCallback(0, "Select a method to authenticate");
//     callbacksBuilder.choiceCallback("Select_any_option", displayList, 0, false);
//     callbacksBuilder.confirmationCallback(0, ["Next", "Cancel"], 0);
//     if (getFaqTopicId != null) {
//                 callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
//             }
// }

// function handleResponse() {
//     var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
//     var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

//     if (selectedOutcome === 0) {
//         var selectedMFA = selectedMFAs[selectedIndex];
//         nodeState.putShared("selectedMFA", selectedMFA);
//         logger.error(loggerPrefix + " User confirmed selection: " + selectedMFA);

//         if (selectedMFA === "EMAIL") {
//             logger.error("Email is selected");
//             action.goTo(NodeOutcome.EMAIL);
//              return;
//         } else if (selectedMFA === "MOBILE") {
//             logger.error("Mobile is selected");
//             action.goTo(NodeOutcome.SMS);
//              return;
//         } else if (selectedMFA === "AUTHENTICATOR") {
//             logger.error("authenticator is selected");
//             action.goTo(NodeOutcome.AUTHENTICATOR);
//             return;
//         } else {
//             action.goTo(NodeOutcome.FAILED);
//              return;
//         }
//     } else {
//         logger.error(loggerPrefix + " User cancelled MFA selection.");
//         action.goTo(NodeOutcome.FAILED);
//          return;
//     }
// }

// function main() {
//     try {
//         if (callbacks.isEmpty()) {
//             requestCallbacks();
//         } else {
//             handleResponse();
//         }
//     } catch (e) {
//         logger.error("Main script error: " + e);
//         action.goTo(NodeOutcome.FAILED);
//     }
// }

// main();
