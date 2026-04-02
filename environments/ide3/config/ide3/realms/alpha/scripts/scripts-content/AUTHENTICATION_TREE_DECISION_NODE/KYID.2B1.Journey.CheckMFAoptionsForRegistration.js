var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check MFA Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckMFAoptionsForRegistration",
    timestamp: dateTime,
      end: "Node Execution Completed"
};

var NodeOutcome = {
    REGISTERED:"Registered",
    NOT_REGISTERED:"NotRegistered"
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

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
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
    return ["SMSVOICE","SYMANTEC","TOTP","PUSH"];
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
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]); 
            }
        }
    }
    return mfaOptionsArray;
}


// Main execution
function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);

    try {
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                logger.debug("usrMFAData : "+usrMFAData);
                var mfaResult = usrMFAData.result;
                logger.debug("RegisteredmfaResult : "+mfaResult);
                logger.debug("usrMFAData.result.length : "+usrMFAData.result.length);
                if(usrMFAData.result.length === 0){       
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KOG ID not found ");
                    action.goTo(NodeOutcome.NOT_REGISTERED);
                }else{
                
                    var userMFAMethods = getUserMFAMethods(usrMFAData);
                    logger.debug("userMFAMethods : "+userMFAMethods);
                    var mandatoryMFAOptions = availableMFAOptions();
                    var common = mandatoryMFAOptions.filter(value => userMFAMethods.includes(value));
                    logger.debug("common : "+common);
                    if(common.length>0){
                        logger.debug("PrintingRegisteredMFAForSelfEnroll:"+JSON.stringify(common))
                        action.goTo(NodeOutcome.REGISTERED);
                    }

                    else{
                        logger.debug("MandatoryMFAmethods are not registered")
                        action.goTo(NodeOutcome.NOT_REGISTERED);
                    }          
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

