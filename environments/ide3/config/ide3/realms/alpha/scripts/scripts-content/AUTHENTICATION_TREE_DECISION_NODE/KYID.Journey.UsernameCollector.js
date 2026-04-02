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
    MAIL: "mail",
    PHONE: "phone"
};

nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

if (callbacks.isEmpty()) {
    if(nodeState.get("errorMessage")){
     var error = nodeState.get("errorMessage");
    callbacksBuilder.textOutputCallback(1,error);
    }
    
  callbacksBuilder.textOutputCallback(0,"Enter Email or Phone");
  callbacksBuilder.textInputCallback("Enter Email or Phone");
} else {
  var userInput = callbacks.getTextInputCallbacks()[0].trim(); 
    var transactionId = nodeState.get("transactionId")

    if (isValidMail(userInput)){
        nodeState.putShared("username", userInput);
        nodeState.putShared("mail",userInput);
        nodeState.putShared("searchAttribute","mail");
        nodeState.putShared("errorMessage",null);
        action.goTo(nodeOutcome.MAIL);
    }else if(isValidPhone(userInput)){
        nodeState.putShared("username",userInput);
        nodeState.putShared("searchAttribute","telephoneNumber");
        nodeState.putShared("errorMessage",null);
        action.goTo(nodeOutcome.PHONE);
    }else{
      if(isEmail(userInput)){
         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorMail); 
      }else{
         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorPhone);  
      }
       callbacksBuilder.textOutputCallback(0,"Invalid Email or Phone. Please try again");
       callbacksBuilder.textInputCallback("Enter Email or Phone");
    }
}
  

function isValidMail(mail) {
    var mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return mailRegex.test(mail);
}

function isValidPhone(phone) {
    var phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
}

function isEmail(userInput) {
  return userInput.includes("@");
 }

