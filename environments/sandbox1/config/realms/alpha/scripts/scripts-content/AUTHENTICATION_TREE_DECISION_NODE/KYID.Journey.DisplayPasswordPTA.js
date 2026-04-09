/**
 * Script: 
 * Description:               
 * Date: 26th July 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Password PTA",
    script: "Script",
    scriptName: "KYID.Journey.DisplayPasswordPTA",
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
function GetRequestID(){
    var ReqID = "";
    var RequestIDError="";
        if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null){
             logger.error("Request id is " + requestCookies.get("ReqID"));
             ReqID= requestCookies.get("ReqID");
            if(getLocale()==="es"){
                 RequestIDError = `<br>`+"ID de transacción"+`<br>`+ ReqID
            }
            else{
                RequestIDError = `<br>`+"Transaction ID:"+`<br>`+ ReqID
            }
        }
    return RequestIDError;
}


try{
    if (callbacks.isEmpty()) {   
        
      if (nodeState.get("profileApifailErrorMsg") !=null){
          var error=nodeState.get("profileApifailErrorMsg")
          callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID()+`</div>`);
      }
      
      else if (nodeState.get("unregisteredAccountErrorMessage")!=null){
          var error=nodeState.get("unregisteredAccountErrorMessage")
          callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
      }
      
      else if (nodeState.get("inValidAccountErrorMessage")!=null){
          var error=nodeState.get("inValidAccountErrorMessage")
           callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);

          //callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("inValidAccountErrorMessage")+`</div>`);
      }
      else if (nodeState.get("notAllowedToLoginErrorMessage")!=null){
          var error=nodeState.get("notAllowedToLoginErrorMessage")
           callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
      }
      else if (nodeState.get("stubAccountErrorMessage")!=null){
          var cookieDomain=systemEnv.getProperty("esv.kyid.ky.cookie.domain");
          if(getLocale() === "es") {
                var error=nodeState.get("stubAccountErrorMessage")
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error
                                                +`<a style="text-align: center;" href=https://`+cookieDomain+`public/AccountVerification/?ReturnURL=`
                                                +requestCookies.ReturnURL
                                                +` target="_blank">Haga clic aquí</a>` 
                                                + `</div>`);
              
          } else if(getLocale() === "en") {
                var error=nodeState.get("stubAccountErrorMessage")
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error
                                                +`<a style="text-align: center;" href=https://`+cookieDomain+`public/AccountVerification/?ReturnURL=`
                                                +requestCookies.ReturnURL    
                                                +` target="_blank">Click Here</a>`    
                                                +`</div>`);
          }  
      } 
      
      else if (nodeState.get("ptaConnectionFailErrorMessage")!=null){
          var error=nodeState.get("ptaConnectionFailErrorMessage");
          callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID()+`</div>`);
      } 
      
      else if (nodeState.get("ptaAuthenticationFailErrorMessage")!=null){
         var error=nodeState.get("ptaAuthenticationFailErrorMessage")
          callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
      }

      // else if(nodeState.get("emptyPasswordErrorMessage")!=null){
      //     var error=nodeState.get("emptyPasswordErrorMessage")
      //       callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
      // } 
        else if (nodeState.get("emptyPasswordErrorMessage") != null) {
    var error = nodeState.get("emptyPasswordErrorMessage");
 
    // Use textOutputCallback to display the error message
    callbacksBuilder.textOutputCallback(0, `<div class='error-message' aria-live="assertive" tabindex="-1" role="alert">${error}</div>`);
 
    // Display the password input field
    callbacksBuilder.passwordCallback("Password", false);
 
    // Find the error message element after it has been added to the DOM
    setTimeout(function() {
        var errorMessageDiv = document.querySelector('.error-message');
    var passwordInput = document.querySelector('input[type="password"]');
 
        if (errorMessageDiv) {
            // Shift focus to the error message
            errorMessageDiv.focus();
            // After a short delay, shift focus back to the password input field
            setTimeout(function() {
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 10); // Adjust the delay as needed
        }
    }, 0);
} 

      
     callbacksBuilder.passwordCallback("Password", false); 
    
    } else {   
              
     var password = callbacks.getPasswordCallbacks().get(0);   
     if (password === null || !password) {    
            nodeState.putShared("profileApifailErrorMsg", null)
            nodeState.putShared("unregisteredAccountErrorMessage", null)
            nodeState.putShared("inValidAccountErrorMessage", null)
            nodeState.putShared("notAllowedToLoginErrorMessage", null)
            nodeState.putShared("stubAccountErrorMessage", null)
            nodeState.putShared("ptaConnectionFailErrorMessage", null)
            nodeState.putShared("ptaAuthenticationFailErrorMessage", null) 
            nodeState.putShared("emptyPasswordErrorMessage",null)
            action.goTo(nodeOutcome.ERROR);   
         
     } else {    
         nodeState.putTransient("password", password); 
         nodeState.putShared("emptyPasswordErrorMessage",null)
         action.goTo(nodeOutcome.SUCCESS);
     }

       
    }
}catch(error){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error+"::Email::"+nodeState.get("mail"));  
}
