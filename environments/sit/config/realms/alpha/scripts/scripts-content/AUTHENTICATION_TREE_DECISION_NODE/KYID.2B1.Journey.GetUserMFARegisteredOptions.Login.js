var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.GetUserMFARegisteredOptions.Login",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "success",
    FAILED: "failed"
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

logger.error("inside KYID.2B1.Journey.GetUserMFARegisteredOptions.Login ")

function mapMFAMethod(method) {
    switch (method) {
        case "EMAIL":
            return "EMAIL";
        case "SMSVOICE":
            return "MOBILE";
        case "TOTP":
        case "PUSH":
        case "SYMANTEC":
        case "FRTOTP":
        case "FRPUSH":
            return "AUTHENTICATOR";
        default:
            return method;
    }
}

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User ID: " + userId);
        if(userId!=null){
             return userId;
        }else{
            return null;
        }
       
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
    return ["EMAIL", "SMSVOICE","SYMANTEC","TOTP","PUSH","FRPUSH","FRTOTP"];
}

// Function to build MFA options array with localization
function buildMFAOptionsArray(common, usrMFAData) {
    var mfaOptionsArray = [];
    try {
        for (var i = 0; i < common.length; i++) {
            var mfaMethod = common[i];


        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error building MFA options: " + error.message);
    }

    return mfaOptionsArray;
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


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    var highRiskMFArray = []
    logger.error("usrMFAData is :: " + JSON.stringify(usrMFAData))
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]); 
            }

            if (mfaMethodResponse["MFAStatus"].localeCompare("highRisk") === 0 || mfaMethodResponse["MFAStatus"].localeCompare("highrisk") === 0 || mfaMethodResponse["MFAStatus"].localeCompare("HIGHRISK") === 0) {
                logger.error("highRiskMFArray usrMFAData is :: " + JSON.stringify(usrMFAData.result[i]))
                highRiskMFArray.push(usrMFAData.result[i]); 
            }
        }

        //To get highrisk MFA Methods 
        if(highRiskMFArray && highRiskMFArray.length>0){
            nodeState.putShared("highRiskMFArray", JSON.stringify(highRiskMFArray))
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

// Main execution
// function main() {
//     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);

//     try {
        
//         var userId = getUserId();
//         if (userId) {
//             var userData = fetchUserData(userId);
//             if (userData) {
//                 var usrMFAData = getMFAObject(userData.userName);
//                 logger.deug("usrMFAData : "+usrMFAData);
//                 var mfaResult = usrMFAData.result;
//                 logger.debug("mfaResult : "+mfaResult);
//                 logger.debug("usrMFAData.result.length : "+usrMFAData.result.length);
//                 if(usrMFAData.result.length === 0){       
//                     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KOG ID not found ");
//                     action.goTo(NodeOutcome.FAILED);
//                 }else{
                
//                     var userMFAMethods = getUserMFAMethods(usrMFAData);
//                     logger.debug("userMFAMethods : "+userMFAMethods);
//                     var newMFAOptions = availableMFAOptions();
//                     var common = newMFAOptions.filter(value => userMFAMethods.includes(value));
//                     var tempMap = {};
//                     var mappedCommon = [];
                    
//                     var mapped = common.map(mapMFAMethod);
//                     for (var i = 0; i < mapped.length; i++) {
//                         if (!tempMap[mapped[i]]) {
//                             tempMap[mapped[i]] = true;
//                             mappedCommon.push(mapped[i]);
//                         }
//                     }
//                     nodeLogger.error("Mapped MFA Options: " + JSON.stringify(mappedCommon));
//                     nodeState.putShared("userMFAs", mappedCommon);

//                     action.goTo(NodeOutcome.SUCCESS);
//                 }
//             }
             
//         }
//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main: " + error.message);
//     }

//     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
// }

function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);

    try {

    if(requestHeaders.get("accept-language") && requestHeaders.get("accept-language")!=null){
                logger.debug("requestHeaders is :: " + requestHeaders.get("accept-language"))
                var userLanguageUser = requestHeaders.get("accept-language");
                var userLanguage = userLanguageUser[0];
                if(userLanguage.includes("es-ES")){
                    nodeState.putShared("userLanguage","es")
                }else{
                    nodeState.putShared("userLanguage","en")
                }
        }
        
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                logger.debug("usrMFAData : " + usrMFAData);
                var mfaResult = usrMFAData.result;
                logger.debug("mfaResult : " + mfaResult);
                logger.debug("usrMFAData.result.length : " + usrMFAData.result.length);
                if (usrMFAData.result.length === 0) {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KOG ID not found ");
                    action.goTo(NodeOutcome.FAILED);
                } else {

                    var userMFAMethods = getUserMFAMethods(usrMFAData);
                    logger.debug("userMFAMethods : " + userMFAMethods);
                    var newMFAOptions = availableMFAOptions();
                    var common = newMFAOptions.filter(value => userMFAMethods.includes(value));
                    var tempMap = {};
                    var mappedCommon = [];

                    var mapped = common.map(mapMFAMethod);
                    for (var i = 0; i < mapped.length; i++) {
                        if (!tempMap[mapped[i]]) {
                            tempMap[mapped[i]] = true;
                            mappedCommon.push(mapped[i]);
                        }
                    }
                    nodeLogger.debug("Mapped MFA Options: " + JSON.stringify(mappedCommon));
                    nodeState.putShared("userMFAs", mappedCommon);

                    action.goTo(NodeOutcome.SUCCESS);
                }
            } else {
                nodeState.putShared("errorMessage", nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "user data not found");
                //nodeLogger.debug("error message : " + nodeState.get("errorMessage"));
                action.goTo(NodeOutcome.FAILED);
            }
        }
        else {
            nodeState.putShared("errorMessage", nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "user Id not found");
           // nodeLogger.debug("error message : " + nodeState.get("errorMessage"));
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main: " + error.message);
        nodeState.putShared("errorMessage", nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main: " + error.message);
       // nodeLogger.error("error message : " + nodeState.get("errorMessage"));
        action.goTo(NodeOutcome.FAILED);
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
}
// Trigger main function
main();

