/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

try {
      if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(0, "You have successfully set up the required security method.")
            callbacksBuilder.confirmationCallback(0, ["Continue", "Return to authenticator list"], 0);
      }else{
          
      }
} catch (error) {

    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);

}
