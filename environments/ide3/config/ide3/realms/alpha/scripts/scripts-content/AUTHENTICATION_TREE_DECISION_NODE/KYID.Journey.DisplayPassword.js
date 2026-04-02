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

//added to cater the email or upn entered by the user

function fetchEmailFromUserStore(email) {
    try {
        // Query using 'mail'
        var userQueryResultemail = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + email + '"'
        }, ["mail"]);

        nodeLogger.error("userQueryResultemail: " + JSON.stringify(userQueryResultemail));

        if (userQueryResultemail.result && userQueryResultemail.result.length > 0) {
            var emailFromMail = userQueryResultemail.result[0].mail;
            nodeLogger.error("Email found via 'mail' query: " + emailFromMail);
            return emailFromMail;
        } else {
            // Query using 'frIndexedString1' if 'mail' query fails
            var userQueryResultupn = openidm.query("managed/alpha_user", {
                "_queryFilter": 'frIndexedString1 eq "' + email + '"'
            }, ["mail"]);

            nodeLogger.error("userQueryResultupn: " + JSON.stringify(userQueryResultupn));

            if (userQueryResultupn.result && userQueryResultupn.result.length > 0) {
                var emailViaUPN = userQueryResultupn.result[0].mail;
                nodeLogger.error("Email found via 'frIndexedString1' query: " + emailViaUPN);
                return emailViaUPN;
            } else {
                nodeLogger.error("No email found via either query.");
                return null;
            }
        }
    } catch (error) {
        nodeLogger.error("Error in fetchEmailFromUserStore: " + error);
        return null;
    }
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
        
        
        if (nodeState.get("firstTimeLoginError") !=null){
            // if (requestCookies.get("email")){
            // var email = requestCookies.get("email");
            // logger.error("Setting email in nodeState")
            // nodeState.putShared("mail",email)
            // }

            //Added to cater upn or email entered by user
            if (requestCookies.get("email")) {
                var email = requestCookies.get("email");
                logger.error("Setting email in nodeState");
                
                // Fetch email from user store
                var fetchedEmail = fetchEmailFromUserStore(email);
                if (fetchedEmail) {
                    nodeState.putShared("mail", fetchedEmail);
                } else {
                    nodeLogger.error("Failed to fetch email from user store");
                }
            }
           var error=nodeState.get("firstTimeLoginError")
            
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+ `</div>`);
        }
        
        else if (nodeState.get("isCITDomainPart")!=null){
            var error=nodeState.get("isCITDomainPart")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
        }
    
        else if (nodeState.get("userClaimsAPIError")!=null){
            var error=nodeState.get("userClaimsAPIError")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID() +`</div>`);
        }
    
        else if (nodeState.get("jitUnknownError")!=null){
            var error=nodeState.get("jitUnknownError")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+GetRequestID() +`</div>`);
        }
    
        else if (nodeState.get("jitNotFoundError")!=null){
            var error=nodeState.get("jitNotFoundError");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`); 
        }
    
        else if (nodeState.get("jitInvalidAccountError")!=null){
            var error=nodeState.get("inValidAccountErrorMessage")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
        }
    
        else if (nodeState.get("jitStubAccountError")!=null){
            var error=nodeState.get("jitStubAccountError")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
        }

        else if (nodeState.get("profileApifailErrorMsg")!=null){
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
          }

        else if (nodeState.get("notAllowedToLoginErrorMessage")!=null){
            var error=nodeState.get("notAllowedToLoginErrorMessage")
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
          }
        else if (nodeState.get("stubAccountErrorMessage")!=null){
            var cookieDomain=systemEnv.getProperty("esv.kyid.ky.cookie.domain");
           //callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("stubAccountErrorMessage")+`</div>`);
             if(getLocale() === "es") {
                var error=nodeState.get("stubAccountErrorMessage")
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error
                                                +`<a style="text-align: center;"  href=https://`+cookieDomain+`public/AccountVerification/?ReturnURL=`
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
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+nodeState.get("ptaConnectionFailErrorMessage")+GetRequestID()+`</div>`);
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
                nodeState.putShared("notAllowedToLoginErrorMessage",null)
                action.goTo(nodeOutcome.ERROR);   
                 
             } else {    
                 nodeState.putTransient("password", password);
                 nodeState.putShared("emptyPasswordErrorMessage",null);   
                 nodeState.putShared("firstTimeLoginError", null) 

                if (requestCookies.get("fpemail")) {
                    var email = requestCookies.get("fpemail");
                    nodeLogger.error("Setting email in nodeState");
                    
                    // Fetch email from user store
                    var fetchedEmail = fetchEmailFromUserStore(email);
                    if (fetchedEmail) {
                        nodeState.putShared("mail", fetchedEmail);
                        //nodeState.putShared("username", fetchedEmail);
                        nodeState.putShared("objectAttributes", {"userName": fetchedEmail}); 
                        nodeState.putShared("objectAttributes", {"mail": fetchedEmail}); 
                        nodeLogger.error("reading mail from fetchedEmail " + fetchedEmail);
                    } else {
                        if(nodeState.get("objectAttributes").get("mail") &&  nodeState.get("objectAttributes").get("mail") !=null){ 
                        var mail = nodeState.get("objectAttributes").get("mail");
                        nodeLogger.error("fetching mail from objectAttributes" +mail);
                        nodeState.putShared("mail", mail);
                     }
                        nodeLogger.error("Failed to fetch email from user store");
                    }
                }
                 action.goTo(nodeOutcome.SUCCESS);
             }
}

} catch(error){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+error);
}
