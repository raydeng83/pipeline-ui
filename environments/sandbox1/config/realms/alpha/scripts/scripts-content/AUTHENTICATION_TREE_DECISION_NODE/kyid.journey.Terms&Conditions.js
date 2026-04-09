/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(callbacks.isEmpty()){

    callbacksBuilder.confirmationCallback(0, ["Next","Cancel"], 1)
}
else{
    var choice=callbacks.getConfirmationCallbacks()[0];
    choice?action.goTo("cancel"):action.goTo("next")
}