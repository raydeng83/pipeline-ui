/**
 * Script: 
 * Description:               
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Password Node",
    script: "Script",
    scriptName: "KYID.Journey.DisplayPassword",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
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


/*
  Name: getLocale()
  Description: Reads locale value from clocale cookie
  Returns: If clocale cookie present, returns clocale value. 
           Otherwise, returns default "en" as clocale value.
 */
function getLocale() {
    
   var clocale = "en";
   
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   
   return clocale;
}


try{
          
    if (callbacks.isEmpty()) {   
    
        if (nodeState.get("firstTimeLoginError") !=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("firstTimeLoginError")+`</div>`);
        }
        
        else if (nodeState.get("isCITDomainPart")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("isCITDomainPart")+`</div>`);
        }
    
        else if (nodeState.get("userClaimsAPIError")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("userClaimsAPIError")+`</div>`);
        }
    
        else if (nodeState.get("jitUnknownError")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("jitUnknownError")+`</div>`);
        }
    
        else if (nodeState.get("jitNotFoundError")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("jitNotFoundError")+`</div>`);
        }
    
        else if (nodeState.get("jitInvalidAccountError")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("jitInvalidAccountError")+`</div>`);
        }
    
        else if (nodeState.get("jitStubAccountError")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("jitStubAccountError")+`</div>`);
        }

        else if (nodeState.get("profileApifailErrorMsg")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("profileApifailErrorMsg")+`</div>`);
          }
          
        else if (nodeState.get("unregisteredAccountErrorMessage")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("unregisteredAccountErrorMessage")+`</div>`);
          }
          
        else if (nodeState.get("inValidAccountErrorMessage")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("inValidAccountErrorMessage")+`</div>`);
          }
        
        else if (nodeState.get("stubAccountErrorMessage")!=null){
            //callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("stubAccountErrorMessage")+`</div>`);
             if(getLocale() === "es") {
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("stubAccountErrorMessage")
                                                +`<a style="text-align: center;" href="https://ide.kog.ky.gov/public/AccountVerification/?ReturnURL="`
                                                +requestCookies.ReturnURL
                                                +` target="_blank">Haga clic aquí</a>` 
                                                + `</div>`);
              
              } else if(getLocale() === "en") {
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("stubAccountErrorMessage")
                                                +`<a style="text-align: center;" href="https://ide.kog.ky.gov/public/AccountVerification/?ReturnURL="`
                                                +requestCookies.ReturnURL    
                                                +` target="_blank">Click Here</a>`    
                                                +`</div>`);
              }
          } 
          
        else if (nodeState.get("ptaConnectionFailErrorMessage")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("ptaConnectionFailErrorMessage")+`</div>`);
          } 
          
        else if (nodeState.get("ptaAuthenticationFailErrorMessage")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("ptaAuthenticationFailErrorMessage")+`</div>`);
          } 

        else if(nodeState.get("emptyPasswordErrorMessage")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("emptyPasswordErrorMessage")+`</div>`);
          }
        else if(nodeState.get("expiredIntUserPwdUpdate")!=null){
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("expiredIntUserPwdUpdate")+`</div>`);
          }
    
        callbacksBuilder.passwordCallback("Password", false); 
    
    } else {   
        
             var password = callbacks.getPasswordCallbacks().get(0);   
             if (password === null || !password) {   
                nodeState.putShared("firstTimeLoginError", null) 
                nodeState.putShared("isCITDomainPart", null)
                nodeState.putShared("userClaimsAPIError", null)
                nodeState.putShared("jitUnknownError", null)
                nodeState.putShared("jitNotFoundError", null)
                nodeState.putShared("jitInvalidAccountError", null)
                nodeState.putShared("jitStubAccountError", null) 
                nodeState.putShared("profileApifailErrorMsg", null) 
                nodeState.putShared("unregisteredAccountErrorMessage", null) 
                nodeState.putShared("inValidAccountErrorMessage", null) 
                nodeState.putShared("stubAccountErrorMessage", null)
                nodeState.putShared("ptaAuthenticationFailErrorMessage", null)
                nodeState.putShared("emptyPasswordErrorMessage",null)
                nodeState.putShared("expiredIntUserPwdUpdate",null)
                action.goTo(nodeOutcome.ERROR);   
                 
             } else {    
                 nodeState.putTransient("password", password);
                 nodeState.putShared("emptyPasswordErrorMessage",null);   
                 action.goTo(nodeOutcome.SUCCESS);
             }
}

} catch(error){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+error);
}
