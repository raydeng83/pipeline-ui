/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if (callbacks.isEmpty()) {
        var successMsg = "Your email address has been updated"
        callbacksBuilder.textOutputCallback(0,successMsg);
      } else {
          logger.error("Success Email Message has not been dispalyed")
      }
outcome = "true";
