var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "SelfRegistration AccountRecovery",
    script: "Script",
    scriptName: "KYID.2B1.Journey.SelfRegistration.AccountRecoverywithEmailorPhone",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EMAIL: "email",
    PHONE: "phone",
    ERROR: "error",
    BACK: "back"
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
    nodeState.putShared("postrecoverymfa", "true")
    if(callbacks.isEmpty()){

        if(nodeState.get("invalidPhoneNumber")){
            logger.error("inside the invalidphonenumber")
            var invalidPhoneNumber = nodeState.get("invalidPhoneNumber")
            callbacksBuilder.textOutputCallback(2, invalidPhoneNumber);
        }

        callbacksBuilder.textOutputCallback(1, "3_account_recovery")
        callbacksBuilder.textInputCallback("recovery_attribute_value");
        var mfaOptions = ["phone_sms", "alternate_email"];
        var promptMessage = "set_account_recovery_method";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
    }
    else{
        var value = callbacks.getTextInputCallbacks()[0];
        
        nodeState.putShared("recoveryAttribute",value);


      var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
      var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];

      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SelectedOutcome::" + selectedOutcome);

     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "selectedMFA::" + selectedMFA);

  if (selectedOutcome === 1) {
    action.goTo(NodeOutcome.BACK);
  } else if (selectedOutcome === 0) {
    if (selectedMFA === 1) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "inside email");
            var Secondary_Email = value
            var emailPattern= /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if(!emailPattern.test(value)){
                logger.error("Invalid email format")
                 var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
                 nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "email is invalid");
                action.goTo(NodeOutcome.ERROR)
            }else{
                nodeState.putShared("Secondary_Email",Secondary_Email);
                nodeState.putShared("MFAMethod","Secondary_Email");
                action.goTo(NodeOutcome.EMAIL);
            }
       
    } else {
       var phoneNumber = value
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "inside phone");
        nodeState.putShared("telephoneNumber",phoneNumber);
        nodeState.putShared("MFAMethod","sms");
        action.goTo("phone");
        } 
     }
  }
    
