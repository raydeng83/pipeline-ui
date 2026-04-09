var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.EnterPhoneNumber",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    BACK: "back",
    SKIP: "skip",
    DONTVERIFY: "dontverify",
    NEXT: "next"
};

/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};


 if(callbacks.isEmpty()){
        if(nodeState.get("invalidPhoneNumber")){
            logger.error("inside the invalidphonenumber")
            var invalidPhoneNumber = nodeState.get("invalidPhoneNumber")
            callbacksBuilder.textOutputCallback(2, invalidPhoneNumber);
        }
     
        callbacksBuilder.textOutputCallback(1, "2_phone_number")
        callbacksBuilder.textInputCallback("mobile_phone_number");    
  
    } else {
        var value=callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("telephoneNumber",value);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "the telephonenumber entered by user" +value);
       
       if(nodeState.get("phoneVerified")){
        var phoneVerified =  nodeState.get("phoneVerified")
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "reading the phonenumber from phoneVerified" +phoneVerified);
       }

 }
var mfaOptions = ["phone_sms", "phone_voice"];
var promptMessage = "set_account_recovery_method";

//var mail = nodeState.get("objectAttributes").get("mail");
var mail = nodeState.get("mail");
nodeState.putShared("mail", mail);

var sn = nodeState.get("sn")
//var sn = nodeState.get("objectAttributes").get("sn");
nodeState.putShared("sn", sn);

var givenName = nodeState.get("givenName")

//var givenName = nodeState.get("objectAttributes").get("givenName");
nodeState.putShared("givenName", givenName);

if (callbacks.isEmpty()) {
  
  callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
  //callbacksBuilder.confirmationCallback(0, ["Back", "Next","Skip"], 1);
  callbacksBuilder.confirmationCallback(0, ["Next", "Back","Skip"], 1);
  
} else {
  
   
  var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
  var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];

  if (selectedOutcome === 1) {
    action.goTo(NodeOutcome.BACK);
  } else if(selectedOutcome === 0){
    if(phoneVerified == "true")
       {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "phoneVerified is true");
        var verifiedTelephone = nodeState.get("verifiedTelephone")

        if(value === verifiedTelephone)
           {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "going to dontVerify");
            action.goTo(NodeOutcome.DONTVERIFY);
           }
           
       }
      else{
      if(selectedMFA===0){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "user selected SMS");
         nodeState.putShared("MFAMethod","sms");

      }
      else{
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "user selected Voice");
        nodeState.putShared("MFAMethod","voice");
      }

      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "either sms or voice selected"); 
      action.goTo(NodeOutcome.NEXT);
}
  }
    else{
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Going to Skip");
        action.goTo(NodeOutcome.SKIP);

    }}
    