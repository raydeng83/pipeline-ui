var message = nodeState.get("prereqcompeletedJSONObj");
if (callbacks.isEmpty()) {
 callbacksBuilder.textOutputCallback(0,message);
 callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
 }
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    if(selectedOutcome == 0){
        action.goTo("True")
    }
    
    
}

