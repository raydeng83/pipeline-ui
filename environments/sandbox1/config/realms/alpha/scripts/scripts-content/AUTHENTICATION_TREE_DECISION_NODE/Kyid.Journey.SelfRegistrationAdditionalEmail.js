/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
nodeState.putShared("0b3b54df-b3b3-4093-a620-a11c50b3c2d1.retryCount",0)

var telephone = nodeState.get("telephoneNumber")
//var mfaresponse= nodeState.get("MFAResponse");
nodeState.putShared("phoneVerified","true")
nodeState.putShared("verifiedTelephone",telephone)



// if(mfaresponse===2){
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_additional_alternate_email")
        callbacksBuilder.textInputCallback("alternate_mail"); 
            callbacksBuilder.confirmationCallback(0, ["Back","Next","Skip"], 1);

    }
    else{
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("Secondary_Email",value);
        nodeState.putShared("Additional_Email",value); ///changes

         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    // callbacksBuilder.textOutputCallback(1, selectedOutcome)
    // var selectedMFAOption = mfaOptions[selectedOutcome];
        if(selectedOutcome===0){
            action.goTo("back");
        }else if(selectedOutcome===1){
            nodeState.putShared("MFAResponse",selectedOutcome);
            //action.goTo("next");
                    action.goTo("email");

        
    }
        else{
            action.goTo("skip");
        }
    }
    
//}