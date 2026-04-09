var mfaresponse= nodeState.get("MFAResponse");

if(mfaresponse===0){
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_phone_sms")
        callbacksBuilder.textInputCallback("Phone SMS");    
    callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);
    }
    else{
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("telephoneNumber",value);
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
 
    if(selectedOutcome===0){
        action.goTo("back");
    }else{
        nodeState.putShared("MFAResponse",selectedOutcome);
        nodeState.putShared("MFAMethod","sms");
    //action.goTo("next");
                action.goTo("phone");

    }
       // action.goTo("phone");
    }

    }else if(mfaresponse===2){
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_alternate_email")
        callbacksBuilder.textInputCallback("Alternate Mail"); 
            callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);

    }
    else{
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("Secondary_Email",value);
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
         // callbacksBuilder.textOutputCallback(1, selectedOutcome)
        // var selectedMFAOption = mfaOptions[selectedOutcome];
        if(selectedOutcome===0){
            action.goTo("back");
        }else{
            nodeState.putShared("MFAResponse",selectedOutcome);
            //action.goTo("next");
                    action.goTo("email");

        
    }
    }
}else if(mfaresponse===1){
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_phone_voice")
        callbacksBuilder.textInputCallback("Phone Voice");  
            callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);

    }
    else{
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("telephoneNumber",value);
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if(selectedOutcome===0){
            action.goTo("back");
        }else{
        nodeState.putShared("MFAResponse",selectedOutcome);
            nodeState.putShared("MFAMethod","voice");
            //action.goTo("next");
                    action.goTo("phone");

        
    }
    }
    
}