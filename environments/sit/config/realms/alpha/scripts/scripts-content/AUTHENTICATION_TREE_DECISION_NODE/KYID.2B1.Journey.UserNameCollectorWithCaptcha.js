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
    TRUE: "True"
};

nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

if (callbacks.isEmpty()) {
    if(nodeState.get("errorMessage")){
        var incorrectPasswordError = nodeState.get("errorMessage");
       callbacksBuilder.textOutputCallback(2,incorrectPasswordError);
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
        nodeState.putShared("outcome","mail");

        var query = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+userInput+"\""}, ["_id", "userName"]);
        if (query && query.result && query.result.length === 1) {
        var KOGID = query.result[0].userName
            logger.debug("KOG ID while login is" +KOGID)
            nodeState.putShared("KOGID",KOGID);
        }
        
        //action.goTo(nodeOutcome.TRUE);
        action.goTo(nodeOutcome.TRUE).putSessionProperty('KOGID', KOGID);
    }else if(isValidPhone(userInput)){
        nodeState.putShared("username",userInput);
        nodeState.putShared("searchAttribute","telephoneNumber");
        nodeState.putShared("outcome","phone");
        nodeState.putShared("errorMessage",null);
        action.goTo(nodeOutcome.TRUE);
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

