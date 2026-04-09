var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Old JWT in Query Param",
    script: "Script",
    scriptName: "KYID.Journey.CheckOldJWTQueryParam",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

//Logging Function
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

var oldAssertionJwt = requestParameters.get("jwt");


// Check if the JWT is present and not empty
if (oldAssertionJwt && oldAssertionJwt[0]) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ":: Found old JWT from IG. Falling back to form login." );
    
    action.goTo("True");
} else {
    action.goTo("False");
}

