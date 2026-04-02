if(callbacks.isEmpty()){
    callbacksBuilder.confirmationCallback(0, ["Submit","Resend","Back",], 0);
}
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    if(selectedOutcome==1){
        nodeState.putShared("PushResend","PushResend")
        action.goTo("true")
    } else if (selectedOutcome==2){
        nodeState.putShared("anotherFactor","anotherFactor")
        action.goTo("true")
    }
    else{
        nodeState.putShared("PUSHVerifyNode","next")
        action.goTo("true")
    }
}