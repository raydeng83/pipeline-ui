var dateTime = new Date().toISOString();
var differentemailretrylimit = nodeState.get("differentemailretrylimit")
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "User Input Divert",
    script: "Script",
    scriptName: "KKYID.2B1.Journey.Registration_Acceptance.chooseAnotherMethod",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    BACK: "back",
    NEXT:"next"
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
    }
}

try {

    if(differentemailretrylimit === "true")
        {
            action.goTo(NodeOutcome.NEXT);
        }
else if(nodeState.get("anotherFactor") !=null){
    if(nodeState.get("anotherFactor") == "anotherFactor" ) {
       action.goTo(NodeOutcome.BACK);
    }
        
else{
        nodeState.putShared("anotherFactor",null);
        
        nodeState.putShared("verifiedPrimaryEmail",nodeState.get("collectedPrimaryEmail"));
        logger.debug("Verified Primary Email is "+nodeState.get("verifiedPrimaryEmail"));
        action.goTo(NodeOutcome.NEXT);
    }
    
}
    // else if(differentemailretrylimit === "true")
    //     {
    //         action.goTo(NodeOutcome.NEXT);
    //     }
else{
    nodeState.putShared("verifiedPrimaryEmail",nodeState.get("collectedPrimaryEmail"));
    logger.debug("Verified Primary Email is "+nodeState.get("verifiedPrimaryEmail"));
    nodeState.putShared("anotherFactor",null);
    action.goTo(NodeOutcome.NEXT);
}

    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ":: " +error );
}

