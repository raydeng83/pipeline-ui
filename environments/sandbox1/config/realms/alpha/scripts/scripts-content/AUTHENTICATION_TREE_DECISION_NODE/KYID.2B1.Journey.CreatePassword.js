/**
 * Script: 
 * Description:               
 * Date: 7th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate Password Policy",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ValidatePwdPolicy",
    timestamp: dateTime,
    idmQueryFail: "IDM Query Operation Failed",
    validatePwdSuccess: "Password Validation Successful",
    validatePwdFail: "Password Validation Fail",
    mismatchPassword: "Password Mismatch",
    emptyPassword: "Password is Empty", 
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Next",
    EMPTY: "Empty",
    MISMATCH: "Mismatch",
    INVALID: "InValid",
    BACK: "Back"
};
 
// Declare Global Variables
var firstName = "";
var lastName = "";

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

function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}

// Validate Password Policy
function validatePassword(newpassword) {
    
    var password = newpassword.toLowerCase();
    var firstName = nodeState.get("givenName");
    var lastName = nodeState.get("sn");  
   
    // Minimum length validation
    if (newpassword.length < 8) {
         return false;
    }
 
    // Check for at least one uppercase letter
    var hasUpperCase = /[A-Z]/.test(newpassword);
    if (!hasUpperCase) {
        return false;
    }
 
    // Check for at least one lowercase letter
    var hasLowerCase = /[a-z]/.test(newpassword);
    if (!hasLowerCase) {
        return false;
    }
 
    // Check for at least one number
    var hasNumber = /\d/.test(newpassword);
    if (!hasNumber) {
        return false;
    }

    // Check first name & last name is not included 
    if(password.includes(firstName) || password.includes(lastName)){
            return false;
    }
            
    // If all conditions are met
   else{
       return true;
   }
}



// Main Function
function main() {
    try{
        if (callbacks.isEmpty()) {
    
         if (nodeState.get("inValidPasswordErrorMessage")!=null){
             var error = nodeState.get("inValidPasswordErrorMessage")
             callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
          }
          
        else if (nodeState.get("emptyPasswordErrorMessage")!=null){
              var error = nodeState.get("emptyPasswordErrorMessage")
              callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
          }
          
        else if (nodeState.get("mismatchPasswordErrorMessage")!=null){
             var error = nodeState.get("mismatchPasswordErrorMessage")
             callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
          }

        // else if (nodeState.get("errormessagepwdUpdateFailedinAD")!=null){
        //     var error = nodeState.get("errormessagepwdUpdateFailedinAD")
        //     callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID()+`</div>`);
        //   }
          

            
        callbacksBuilder.passwordCallback("New password", true);
        callbacksBuilder.passwordCallback("Confirm Password", true);   
        callbacksBuilder.confirmationCallback(0, ["Next","Back"], 1)
            
        } else {

          var password = callbacks.getPasswordCallbacks().get(0);
          var newpassword = callbacks.getPasswordCallbacks().get(1);
          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            
         if(selectedOutcome === 0){
             logger.error("user selected next")
            if ((password && password!=null) && (newpassword && newpassword!=null)) {
              nodeState.putShared("inValidPasswordErrorMessage", null)
              nodeState.putShared("emptyPasswordErrorMessage", null)
              nodeState.putShared("mismatchPasswordErrorMessage", null)
              
              if(password.localeCompare(newpassword)==0){
                  logger.error("validatePassword(newpassword): "+validatePassword(newpassword))
                  if(validatePassword(newpassword)){
                      nodeState.putShared("password" , password)
                      nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.validatePwdSuccess);
                      action.goTo(nodeOutcome.SUCCESS);
                      
                  } else {
                      nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.validatePwdFail);
                      action.goTo(nodeOutcome.INVALID);
                  }
                  
              } else {
                  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.mismatchPassword);
                  action.goTo(nodeOutcome.MISMATCH);
              }
              
          } else {
              nodeState.putShared("inValidPasswordErrorMessage", null)
              nodeState.putShared("emptyPasswordErrorMessage", null)
              nodeState.putShared("mismatchPasswordErrorMessage", null)
  
              nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.emptyPassword);
              action.goTo(nodeOutcome.EMPTY);
          }
         
        } else {
            action.goTo(nodeOutcome.BACK);
        }
    
    
    } 
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
    }
}


//Invoke Main Function
main() 
