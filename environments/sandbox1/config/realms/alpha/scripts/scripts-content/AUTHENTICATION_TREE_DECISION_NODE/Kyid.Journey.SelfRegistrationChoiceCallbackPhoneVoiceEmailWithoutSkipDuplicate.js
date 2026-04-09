/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// var value=callbacks.getTextInputCallbacks()[0]

// if (emailPattern.test(value)){
//     notestate.putShared("Secondary_Email",value);
//     notestate.putShared("MFAMethod","Secondary_Email");
//     action.goTo("email");
// }else if(phonePattern.test(value)){
//     notestate.putShared("telephoneNumber",value);
//     notestate.putShared("MFAMethod","sas");
//     action.goTo("phone");
    
// }else{
//     Logger.error("--------------------invalid inpur------------------")
//     action.goTo("error");
// }

nodeState.putShared("d9731e5e-dc2a-415c-9a28-712fd125f84d.retryCount",0)
nodeState.putShared("58aeb01c-a205-4ef8-8be3-cd36434b0d81.retryCount",0)
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)
nodeState.putShared("28f253a1-9cb2-4276-aacd-b0c8949be6b1.retryCount",0)

nodeState.putShared("af47d116-cfa9-4c84-831c-29846147ae3e.retryCount",0)
nodeState.putShared("7816a4c2-804c-42dc-a355-ed6929b0cedd.retryCount",0)

nodeState.putShared("f978088e-3b21-4e84-bf72-5c9f335c2cc1.retryCount",0)//alt email verify
nodeState.putShared("19e7c3dc-d4cf-4a28-bc7e-4541b2b9ad5d.retryCount",0)//alt email resend
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)
nodeState.putShared("7023b477-c304-4d8a-abad-157bfc24273b.retryCount",0)
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)
nodeState.putShared("d9731e5e-dc2a-415c-9a28-712fd125f84d.retryCount",0)
nodeState.putShared("5ed4e668-390f-4b5a-b5ef-47e8e7cb0ed3.retryCount",0)
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_account_recovery")
        callbacksBuilder.textInputCallback("recovery_attribute_value");
        var mfaOptions = ["phone_sms", "alternate_email"];
        var promptMessage = "set_account_recovery_method";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Back", "Next"], 1);
    }
    else{
        var value = callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("recoveryAttribute",value);


      var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
      var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];

        logger.error("-----------------------------------------------------selectedOutcome--------------------------------"+selectedOutcome)
        logger.error("-----------------------------------------------------selectedMFA--------------------------------"+selectedMFA)
  // callbacksBuilder.textOutputCallback(1, selectedOutcome)
  // var selectedMFAOption = mfaOptions[selectedOutcome];
  if (selectedOutcome === 0) {
    action.goTo("back");
  } else if (selectedOutcome === 1) {
    if (selectedMFA === 1) {
        logger.error("-----------------------------------------------------In Alternalte emwil--------------------------------")
            var Secondary_Email = value
            var emailPattern= /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if(!emailPattern.test(value)){
                logger.error("Invalid email format")
                 var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
                    logger.error(transactionid+"Input Invalid"+"Email is INVALID")
                action.goTo("error")
            }else{
                nodeState.putShared("Secondary_Email",Secondary_Email);
                nodeState.putShared("MFAMethod","Secondary_Email");
                action.goTo("email");
            }
       
    } else {
       var phoneNumber = value
        logger.error("-----------------------------------------------------In phome --------------------------------")
        var phonePattern= /^\+\d{9,}$/;
        if(!phonePattern.test(value)){
                logger.error("Invalid email format")
             var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
             logger.error(transactionid+"Input Invalid"+"Phone_No is INVALID")
                action.goTo("error")
        }else{
            nodeState.putShared("telephoneNumber",phoneNumber);
            nodeState.putShared("MFAMethod","sms");
            action.goTo("phone");
        } 
     }
  }
    }
