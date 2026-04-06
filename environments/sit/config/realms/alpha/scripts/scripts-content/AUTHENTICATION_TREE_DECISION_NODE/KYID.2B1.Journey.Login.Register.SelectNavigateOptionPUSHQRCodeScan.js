
if(callbacks.isEmpty()){
     // var lib = require("KYID.Library.FAQPages");
     // var process ="RegisterMFA";
     // var pageHeader= "1_setup_TOTP";
     // var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
     // logger.error("getFaqTopicId : "+getFaqTopicId);
     //callbacksBuilder.confirmationCallback(0, ["Next","Back"], 0);
      if(nodeState.get("MFARegistered") && nodeState.get("MFARegistered") == "true"){
          callbacksBuilder.confirmationCallback(0, ["Skip this step"], 0); 
      }else{
        action.goTo("true")
     }
      // else{
      //         callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);
      // }
    //  if (getFaqTopicId != null) {
    //     callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
    // }
}
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    
    if(selectedOutcome==0){
        logger.debug("selectedOutcome is in "+ selectedOutcome)
        nodeState.putShared("PUSHQRNode","skip")
        action.goTo("true")
    }
}
