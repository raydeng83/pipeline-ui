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
    scriptName: "KYID.Journey.ValidatePwdPolicy",
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
    SUCCESS: "True",
    EMPTY: "Empty",
    MISMATCH: "Mismatch",
    INVALID: "InValid"
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
    try{    
        if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
            var KOGID = nodeState.get("KOGID");
            var response = openidm.query("managed/alpha_user", { "_queryFilter": "/userName eq \""+KOGID+"\""}, ["givenName","sn"]);
            logger.error("Response: "+JSON.stringify(response));
            if (response.result.length==1) {
                var idmUser = response.result[0];
                if(idmUser.givenName!=null){
                    firstName = idmUser.givenName.toLowerCase();
                }
                if(idmUser.sn!=null){
                    lastName = idmUser.sn.toLowerCase();
                }
            }
        }
    } catch(error){
          nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
    }

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

function GetRequestID(){
    var ReqID = "";
    var RequestIDError="";
        if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null){
            logger.error("Request id is " + requestCookies.get("ReqID"))
             ReqID= requestCookies.get("ReqID")
            if(getLocale()==="es"){
                 RequestIDError = `<br>`+"ID de transacción"+`<br>`+ ReqID
            }
            else{
            RequestIDError = `<br>`+"Transaction ID:"+`<br>`+ ReqID
            }
        }
 

    return RequestIDError
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

        else if (nodeState.get("errormessagepwdUpdateFailedinAD")!=null){
            var error = nodeState.get("errormessagepwdUpdateFailedinAD")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID()+`</div>`);
          }
          callbacksBuilder.textOutputCallback(0,`<div class='page-element'></div>`);

            if (getLocale().localeCompare("en")==0){
             callbacksBuilder.passwordCallback("New password", true);
             callbacksBuilder.passwordCallback("Re-enter password", true);   
            } else {
          callbacksBuilder.passwordCallback("Contraseña nueva", true);
          callbacksBuilder.passwordCallback("Volver a ingresar contraseña", true);
            }
        } else {

          var password = callbacks.getPasswordCallbacks().get(0);
          var newpassword = callbacks.getPasswordCallbacks().get(1);
 
          if ((password && password!=null) && (newpassword && newpassword!=null)) {
              nodeState.putShared("inValidPasswordErrorMessage", null)
              nodeState.putShared("emptyPasswordErrorMessage", null)
              nodeState.putShared("mismatchPasswordErrorMessage", null)
              nodeState.putShared("errormessagepwdUpdateFailedinAD", null)
              
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
              nodeState.putShared("errormessagepwdUpdateFailedinAD", null)
              nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.emptyPassword);
              action.goTo(nodeOutcome.EMPTY);
          }
        } 
    
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
    }
}


//Invoke Main Function
main() 
