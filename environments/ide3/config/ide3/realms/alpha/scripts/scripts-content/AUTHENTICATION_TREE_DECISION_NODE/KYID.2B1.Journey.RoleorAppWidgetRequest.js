var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "CheckIncomingRequestforRequestAccess",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RoleorAppWidgetRequest",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
    
var NodeOutcome = {
    RoleWidRequest: "enrollRoleWid",
    AppWidRequest: "enrollAppWid"
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

if(requestParameters.get("roleIDinWidget")){
    var roleIDinWidget = requestParameters.get("roleIDinWidget")[0];
    nodeState.putShared("requestedRoleId",roleIDinWidget)
    nodeState.putShared("requestroleType","APP_LIBRARY")
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Role based request");
    action.goTo("enrollRoleWid")
} else {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Application based request");
    action.goTo("enrollAppWid")
}