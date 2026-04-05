/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if (callbacks.isEmpty()) {

    
           callbacksBuilder.textInputCallback("requestBody");
           callbacksBuilder.confirmationCallback(0, ["Next"], 0);
      } else {
        
        var input = callbacks.getTextInputCallbacks().get(0).trim();
        var parsedInput = JSON.parse(input)
        nodeState.putShared("input",input)
        logger.debug("Input is --->"+ input)
        // logger.debug("Input URL is --> "+ parsedInput.url)
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        if(selectedOutcome == 0){
        nodeState.putShared("input",input)
        action.goTo("true")
           
        }

      }


