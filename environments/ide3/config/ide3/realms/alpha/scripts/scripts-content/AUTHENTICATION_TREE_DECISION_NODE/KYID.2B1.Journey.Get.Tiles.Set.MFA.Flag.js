var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Set MFA Flag",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Get.Tiles.Set.MFA.Flag",
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
        var response = null;
        var UserId = nodeState.get("_id");
        var jsonArray = [];
    
        var jsonObj = {
            operation: "replace",
            field: "custom_mfaPerformed",
            value: true
        };
        jsonArray.push(jsonObj);
        response = openidm.patch("managed/alpha_user/" + UserId, null, jsonArray);
        nodeLogger.debug("patch response in KYID.2B1.Journey.Get.Tiles.Set.MFA.Flag " + JSON.stringify(response))
        action.goTo("true");
        
    }catch(error){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error);
        action.goTo("false");
    }
}

main();