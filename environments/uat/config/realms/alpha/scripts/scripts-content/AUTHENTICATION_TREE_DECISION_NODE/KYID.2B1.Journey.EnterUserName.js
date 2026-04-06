/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Username Collector",
    script: "Script",
    scriptName: "KYID.Journey.UsernameCollector",
    errorMail: "Invalid email format",
    errorPhone: "Invalid phone number format.",
    timestamp: dateTime
}

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

// Node outcomes
var nodeOutcome = {
    MAIL: "mail"
};

nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

if (callbacks.isEmpty()) {
 if(nodeState.get("errorMessage")){
     var error = nodeState.get("errorMessage");
    callbacksBuilder.textOutputCallback(1,error);
    }
    else if(nodeState.get("apireturnederror"))
    {
        logger.debug("Failed or Inactive status inside username collector" +nodeState.get("apireturnederror"));
         var invalidEmail = nodeState.get("apireturnederror");
         nodeState.putShared("failedOrInactive", null);
         callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+invalidEmail+`</div>`);
    }
    else{
        callbacksBuilder.textOutputCallback(0,"Enter_Email");
    }
  callbacksBuilder.textInputCallback("Enter Email");
  callbacksBuilder.confirmationCallback(0, ["Next"], 0);
} else {
  var userInput = callbacks.getTextInputCallbacks()[0].trim(); 
    var transactionId = nodeState.get("transactionId")

    if (isValidMail(userInput)){
        nodeState.putShared("username", userInput);
        nodeState.putShared("mail",userInput);
        nodeState.putShared("searchAttribute","mail");
        nodeState.putShared("errorMessage",null);
        action.goTo(nodeOutcome.MAIL);
    }else{
      if(isEmail(userInput)){
         nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorMail); 
      }else{
         nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorPhone);  
      }
       var jsonobj = {"pageHeader": "1_Enter_email"};
        if(nodeState.get("appLogo") || nodeState.get("appName")){
                    callbacksBuilder.textOutputCallback(0, `{"applogo": "${nodeState.get("appLogo")}", "appname": "${nodeState.get("appName")}"}`);
        }
       callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        callbacksBuilder.textOutputCallback(0,"Enter_Email");
        callbacksBuilder.textInputCallback("Enter Email");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        var invalidFormat = "Invalid Email. Please try again";
        callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+invalidFormat+`</div>`);
    }
}
  

function isValidMail(mail) {
    var mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return mailRegex.test(mail);
}

function isEmail(userInput) {
  return userInput.includes("@");
 }

