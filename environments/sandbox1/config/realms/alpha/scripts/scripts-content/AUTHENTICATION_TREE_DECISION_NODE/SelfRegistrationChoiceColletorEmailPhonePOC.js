
nodeState.putShared("d9731e5e-dc2a-415c-9a28-712fd125f84d.retryCount",0)
nodeState.putShared("58aeb01c-a205-4ef8-8be3-cd36434b0d81.retryCount",0)
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)

nodeState.putShared("af47d116-cfa9-4c84-831c-29846147ae3e.retryCount",0)
nodeState.putShared("7816a4c2-804c-42dc-a355-ed6929b0cedd.retryCount",0)

nodeState.putShared("f978088e-3b21-4e84-bf72-5c9f335c2cc1.retryCount",0)//alt email verify
nodeState.putShared("19e7c3dc-d4cf-4a28-bc7e-4541b2b9ad5d.retryCount",0)//alt email resend
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)
nodeState.putShared("7023b477-c304-4d8a-abad-157bfc24273b.retryCount",0)
nodeState.putShared("a53e9a78-d13a-4cfa-87b7-c99aa705397a.retryCount",0)
nodeState.putShared("d9731e5e-dc2a-415c-9a28-712fd125f84d.retryCount",0)





// var mfaresponse= nodeState.get("MFAResponse");
 if(callbacks.isEmpty()){
        if(nodeState.get("invalidPhoneNumber")){
            logger.error("inside the invalidphonenumber")
            var invalidPhoneNumber = nodeState.get("invalidPhoneNumber")
            callbacksBuilder.textOutputCallback(2, invalidPhoneNumber);
        }
     
        callbacksBuilder.textOutputCallback(1, "2_phone_number")
        callbacksBuilder.textInputCallback("mobile_phone_number");    
    //callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);
     
 
    
    }else{
        var value=callbacks.getTextInputCallbacks()[0];
     nodeState.putShared("telephoneNumber",value);
     logger.error("-----------------------value--------------"+value)
var phoneVerified =  nodeState.get("phoneVerified")
     logger.error("-----------------------phoneVerified--------------"+phoneVerified)
     

  

     
     
     
        // var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    
 
  //  if(selectedOutcome===0){
        //action.goTo("back");
   // }else{
       // nodeState.putShared("MFAResponse",selectedOutcome);
        //nodeState.putShared("MFAMethod","sms");
        //nodeState.putShared("MFAMethod","voice");

    //action.goTo("next");
               // action.goTo("phone");

    }
       // action.goTo("phone");
  //  }

    
//}
/*else if(mfaresponse===1){
    if(callbacks.isEmpty()){
        callbacksBuilder.textOutputCallback(1, "3_phone_voice")
        callbacksBuilder.textInputCallback("Phone Voice");  
            //callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);

    }
    else{
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("telephoneNumber",value);
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if(selectedOutcome===0){
            //action.goTo("back");
        }else{
        nodeState.putShared("MFAResponse",selectedOutcome);
            nodeState.putShared("MFAMethod","voice");
            action.goTo("next");
                   // action.goTo("phone");

        
    }
    }
    */




var mfaOptions = ["phone_sms", "phone_voice"];
var promptMessage = "set_account_recovery_method";

var mail = nodeState.get("objectAttributes").get("mail");
nodeState.putShared("mail", mail);
var sn = nodeState.get("objectAttributes").get("sn");
nodeState.putShared("sn", sn);
var givenName = nodeState.get("objectAttributes").get("givenName");
nodeState.putShared("givenName", givenName);

if (callbacks.isEmpty()) {
  // callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>")
  callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);

  //callbacksBuilder.textInputCallback("hello", "dhjdj");

  // callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>") ;
  // callbacksBuilder.textInputCallback("Email/Phone");
  // callbacksBuilder.textInputCallback("Phone");

  callbacksBuilder.confirmationCallback(0, ["Back", "Next","Skip"], 1);
} else {
  // var output = callbacks.getTextInputCallbacks().get(0).toUpperCase().trim();
   
  var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
  var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];
  // callbacksBuilder.textOutputCallback(1, selectedOutcome)
  // var selectedMFAOption = mfaOptions[selectedOutcome];
  if (selectedOutcome === 0) {
    action.goTo("back");
  } else if(selectedOutcome === 1){
    if(phoneVerified == "true")
       {
           logger.error("-----------------------inside phoneVerified--------------"+nodeState.get("phoneVerified"))
        var verifiedTelephone = nodeState.get("verifiedTelephone")
           if(value === verifiedTelephone)
           {
                logger.error("----------------------- verifiedTelephone--------------"+nodeState.get("verifiedTelephone"))
               action.goTo("dontVerify");
           }
           
       }
      else{
      if(selectedMFA===0){
         nodeState.putShared("MFAMethod","sms");

      }
      else{
        nodeState.putShared("MFAMethod","voice");

      }
    //nodeState.putShared("MFAResponse", selectedMFA);
     
    action.goTo("next");}
  }
    else{
        logger.error("*****************passing skip**********************")
            action.goTo("skip");

    }}


    /*
  if (selectedOutcome === 2) {
    if (selectedMFAOption.includes("Email")) {
            var Secondary_Email = callbacks.getTextInputCallbacks().get(0);

       nodeState.putShared("Secondary_Email",Secondary_Email)
       nodeState.putShared("MFAMethod","Secondary_Email");
      action.goTo("email");
    } else if (selectedOutcome === 0) {
             outcome = "email";
       var phoneNumber = callbacks.getTextInputCallbacks().get(0).toUpperCase();
       nodeState.putShared("telephoneNumber",phoneNumber);
       nodeState.putShared("MFAMethod","sms");

      action.goTo("phone");
    } else {
        var phoneNumber = callbacks.getTextInputCallbacks().get(0).toUpperCase();
       nodeState.putShared("telephoneNumber",phoneNumber);
       nodeState.putShared("MFAMethod","voice");

      action.goTo("phone");
    }
  }*/
  //     // callbacksBuilder.textOutputCallback(1, selectedOutcome);
  //     // }
  //         //     else{
  //         //       // outcome = "email";
  //         // var phoneNumber = callbacks.getTextInputCallbacks().get(0)[0];
  //         // nodeState.putShared("telephoneNumber",phoneNumber)
  //         // nodeState.putShared("MFAMethod","Phone");

  //         // action.goTo("phone");

  //         // }



// else if(mfaresponse===2){
//     if(callbacks.isEmpty()){
//         callbacksBuilder.textOutputCallback(1, "3_alternate_email")
//         callbacksBuilder.textInputCallback("Alternate Mail"); 
//             //callbacksBuilder.confirmationCallback(0, ["Back","Next"], 1);

//     }
    // else{
//         var value=callbacks.getTextInputCallbacks()[0];
//         nodeState.putShared("Secondary_Email",value);
//          var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
//          callbacksBuilder.textOutputCallback(1, selectedOutcome)
//          var selectedMFAOption = mfaOptions[selectedOutcome];
//         if(selectedOutcome===0){
//             //action.goTo("back");
//         }else{
//             nodeState.putShared("MFAResponse",selectedOutcome);
//             //action.goTo("next");
//                     action.goTo("email");

        
//     }
//     }
    

