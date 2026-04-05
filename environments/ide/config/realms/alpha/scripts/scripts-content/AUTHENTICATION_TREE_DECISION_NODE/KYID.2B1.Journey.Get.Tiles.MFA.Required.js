var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Required",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Get.Tiles.MFA.required",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};

function main(){
try {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: script started ");
    var isMFA = false;
    var mfaPerformed = false;
    nodeState.putShared("isMasterLogin", "true")
    nodeState.putShared("getTiles", "true")
    nodeLogger.debug("Existing session properties ::=> " + existingSession);
       if (typeof existingSession !== 'undefined') {
            try {
                nodeLogger.debug("Existing session properties ::=> " + existingSession.sessionAssuranceLevelforMFA);
                // if(existingSession.sessionAssuranceLevelforMFA && existingSession.sessionAssuranceLevelforMFA != null){
                //     isMFA = true
                // }else {
                    logger.debug("custom_mfaPerformed is :: "+ nodeState.get("custom_mfaPerformed"))
                    if(nodeState.get("custom_mfaPerformed") && nodeState.get("custom_mfaPerformed") === true){
                        isMFA = true
                    }else{
                        isMFA = false
                    }
                // }
            }catch(error){
                logger.error("Error Occured in Main"+error)
            }
       }

        if(isMFA){
            action.goTo("false")
        }else{
            action.goTo("true")
        }
    }catch(error){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error);
        action.goTo("error")
    }
}

main();