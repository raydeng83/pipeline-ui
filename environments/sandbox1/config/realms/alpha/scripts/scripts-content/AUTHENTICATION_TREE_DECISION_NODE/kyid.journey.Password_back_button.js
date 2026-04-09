/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if (callbacks.isEmpty()) {
  // callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>")
  callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);

  //callbacksBuilder.textInputCallback("hello", "dhjdj");

  // callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>") ;
  // callbacksBuilder.textInputCallback("Email/Phone");
  // callbacksBuilder.textInputCallback("Phone");

  callbacksBuilder.confirmationCallback(0, ["Back"],["Next"],1);
}
else{
      var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    if (selectedOutcome === 0) {
    action.goTo("back");
  }
    else{
        action.goto("next")
    }
}