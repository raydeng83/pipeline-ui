// /*
//   - Data made available by nodes that have already executed are available in the sharedState variable.
//   - The script should set outcome to either "true" or "false".
//  */

// outcome = "true";


    if (callbacks.isEmpty()) {

      logger.debug("Inside Callback is Empty")

        logger.debug("After User Prereq Patch")
        var header = { "pageHeader": "Account_Reviewed_Successfully" }
        logger.debug("Header is --> " + JSON.stringify(header))
        callbacksBuilder.textOutputCallback(0, JSON.stringify(header));
        callbacksBuilder.textOutputCallback(0, "Context=loginPrereq");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
      

    } else {
      logger.debug("Inside Else part of Callback")
      var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
      logger.debug("selectedOutcome is " + selectedOutcome)
      if (selectedOutcome === 0) {
        logger.debug("Select Outcome is 0")
        action.goTo("true")
      }
    }