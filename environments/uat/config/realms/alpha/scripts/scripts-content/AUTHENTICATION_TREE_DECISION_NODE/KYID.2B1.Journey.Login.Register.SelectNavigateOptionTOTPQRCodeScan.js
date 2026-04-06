
if(callbacks.isEmpty()){
     var lib = require("KYID.Library.FAQPages");
     var process ="RegisterMFA";
     var pageHeader= "1_setup_TOTP";
     var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
     logger.debug("getFaqTopicId : "+getFaqTopicId);
     //callbacksBuilder.confirmationCallback(0, ["Next","Back"], 0);
      if(nodeState.get("MFARegistered") && nodeState.get("MFARegistered") == "true"){
          callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip this step",], 0); 
      }else{
              callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);
      }
     if (getFaqTopicId != null) {
        callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
    }
}
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    if(selectedOutcome==1){
        nodeState.putShared("TOTPQRNode","back")
        nodeState.putShared("BackFromTOTP","null")
        action.goTo("true")
    }else if(selectedOutcome === 2){
        nodeState.putShared("TOTPQRNode","skip")
            action.goTo("true");  
    }else{
        nodeState.putShared("TOTPQRNode","next")
        action.goTo("true")
    }
}
