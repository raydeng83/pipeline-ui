var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication SymantecResponsecodeCheck",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFALoginAuthn.SymantecResponseCodeCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
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
};


// function extractTagValue(xml, tagName) {
//     var tagPattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
//     var match = tagPattern.exec(xml);
//     return match ? match[1] : null;
// }

function extractTagValue(xml, tagName) {
    try {
        var tagPattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
        var match = tagPattern.exec(xml);
        if (match && match[1]) {
            return match[1].trim();
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error extracting tag value: " + error.message);
        return null;
    }
}

// Main execution
try {
    //Printing the response code and response body
    var responsecode = nodeState.get("responsecode");
    var responsebody = nodeState.get("responsebody");
    var CredID = nodeState.get("CredID");
    var OTP = nodeState.get("securityCode");
    var mail = nodeState.get("mail") || "";

    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode :: " + responsecode);
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsebody :: " + responsebody);
    // 2024/10/30 add loggers to print out credID and security code
//    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "CredID :: " + CredID);
//    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "securityCode :: " + OTP);
 
    if (responsecode === null || responsecode === undefined || responsebody === null || responsebody === undefined) {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode or Responsebody is null or undefined.");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid "+mail);
        action.goTo(NodeOutcome.FAILED);
    }
    
    //var otpFromNodeState = getOTPFromNodeState();
    
    logger.debug("Printing the reason code ::::::: " + extractTagValue(responsebody, "ReasonCode"))
    if (extractTagValue(responsebody, "ReasonCode") === "0000") {
         nodeLogger.debug("************* INSIDE 0000 Response Code ****************")
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is validated successfully"+mail);
           nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "OTP Validation completed successfully"+"::"+mail );
        nodeState.putShared("MFAMethod","SYMANTEC")
        action.goTo(NodeOutcome.SUCCESS);
    }
    else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid "+mail);
        action.goTo(NodeOutcome.FAILED);
    }
} catch (e) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in the main execution of reason code check " + e));
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "An unexpected error occurred while performing "+mail);
}