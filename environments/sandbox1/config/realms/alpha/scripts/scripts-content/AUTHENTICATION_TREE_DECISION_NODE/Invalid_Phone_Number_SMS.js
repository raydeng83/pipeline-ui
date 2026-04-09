/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("Invalid Phone Number");
var MFAMethod= "sms";
if (callbacks.isEmpty()) {
callbacksBuilder.textOutputCallback(1,"invalid_mobile_number")
    nodeState.putShared(MFAMethod,"sms");
   // nodeState.remove("telephoneNumber")
    callbacksBuilder.textInputCallback("Phone SMS");  
            callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);
    }
    else{
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
         if (selectedOutcome === 0) {
                nodeState.putShared("chooseanothermethod", "true")
                 action.goTo("back");
          } else {
             var value=callbacks.getTextInputCallbacks()[0];
            logger.error("*****phnval****"+value);
            nodeState.putShared("telephoneNumber",value);
    
    action.goTo("next");
  }

        
       // action.goTo("true");
    }  