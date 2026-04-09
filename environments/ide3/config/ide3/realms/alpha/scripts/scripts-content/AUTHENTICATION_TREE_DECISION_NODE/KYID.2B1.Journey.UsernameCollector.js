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
    scriptName: "KYID.2B1.Journey.UsernameCollector",
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
    MAIL: "True"
};

//FAQ topic
    var lib = require("KYID.Library.FAQPages");
    var process ="ForgotPassword";
    var pageHeader= "1_Enter your primary email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

   
nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);
nodeState.putShared("firstTimePasswordReset",null)

if (callbacks.isEmpty()) {
    if(nodeState.get("errorMessage")){
        var error = nodeState.get("errorMessage");
        callbacksBuilder.textOutputCallback(1,error);
    }
    var jsonobj = {"pageHeader": "1_Enter your primary email"};
    logger.debug("jsonobj : "+jsonobj);
    callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    callbacksBuilder.textInputCallback("Enter Primary Email");

    if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
    
}else{
    var sessionFlag=nodeState.get("Session");
    /*if(sessionFlag==="true"){
    var email=nodeState.get("mail")
    callbacksBuilder.textOutputCallback(1,email);
    }*/
   
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
        //action.goTo(nodeOutcome.PHONE);
    }else{
      if(isEmail(userInput)){
          nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorMail); 
      }else{
          nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorPhone);  
      }
      callbacksBuilder.textOutputCallback(0,"Invalid Email. Please try again");
      callbacksBuilder.textInputCallback("Enter Email");

        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
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

