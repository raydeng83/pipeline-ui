/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
  var dateTime = new Date().toISOString();

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Email NodeState Another Factor",
      script: "Script",
      scriptName: "KYID.Journey.MFARegitration.UpdateNodeStateForEmailMFAMethod",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      SUCCESS: "true"
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
  };
  
  nodeState.putShared("MFAMethod", "email")
  nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Updated NodeState ForEmail MFA Method");
  outcome = NodeOutcome.SUCCESS;