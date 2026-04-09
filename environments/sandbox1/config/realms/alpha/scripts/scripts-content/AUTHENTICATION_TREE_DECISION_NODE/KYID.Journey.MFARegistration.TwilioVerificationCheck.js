var DEBUG = "true";

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MFARegistration Twilio Send OTP",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.TwilioVerificationCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another Method",
    RESEND: "Resend Code",
    EXPIRED: "expired",
    FAILED: "false"
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

// Function to get the OTP from node state
function getOTPFromNodeState() {
    try {
        return nodeState.get("objectAttributes").get("description");
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Error retrieving OTP from node state: " + error.message);
        return null;
    }
}
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
   nodeState.putShared("clocale", clocale);
   return clocale;
}

// Function to handle callback requests
function requestCallbacks() {
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
         if (clocale === "en") {
             if (nodeState.get("errorMessage") !=null){
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(2,error)
             }
             var message = "Calling your phone. Enter the code below to verify.\nCarrier messaging charges may apply"
             callbacksBuilder.textOutputCallback(0,message)
             callbacksBuilder.passwordCallback("Enter Code", false);
             callbacksBuilder.confirmationCallback(0, ["Verify", "Resend Code", "Return to authenticator list"], 0);
        } else if (clocale === "es") {
             if (nodeState.get("errorMessage") !=null){
             var error = nodeState.get("errorMessage");
             callbacksBuilder.textOutputCallback(2,error)
             }
            callbacksBuilder.passwordCallback("Llamando a tu teléfono. Ingrese el código a continuación para verificar. \n Es posible que se apliquen cargos por mensajería del operador", false);
            callbacksBuilder.confirmationCallback(0, ["Verificar", "Reenviar Code", "Volver a la lista de autenticadores"], 0);
        } else {
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Unsupported locale: " + clocale);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Error requesting callbacks: " + error.message);

    }
}

function isWithinExpiryTime(passwordTimestamp, passwordExpiryMinutes) {
    // Convert passwordTimestamp to milliseconds
    var passwordDate = new Date(passwordTimestamp * 1000); 

    // Get the current time
    var now = new Date(); 

    // Calculate the expiry time in milliseconds
    var expiryDurationMs = passwordExpiryMinutes * 60 * 1000;

    // Calculate the expiry date
    var expiryDate = new Date(passwordDate.getTime() + expiryDurationMs);

    // Check if the current time is before the expiry date
    var withinExpiryTime = now <= expiryDate;

    // Log debug information
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ `previous: ${passwordDate.toISOString()} \n passwordExpiry (ms): ${expiryDurationMs} \n now: ${now.toISOString()}`);
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ `withinExpiryTime: ${withinExpiryTime}`);
    return withinExpiryTime;
}

// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getPasswordCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Print Outcome Selected :::: " + selectedOutcome);

        //var otpFromNodeState = getOTPFromNodeState();
        var expiredPassword = nodeState.get("oneTimePasswordTimestamp")
        var expiredOTPCheck = isWithinExpiryTime(expiredPassword, 5)
        if(expiredOTPCheck){
            action.goTo(NodeOutcome.EXPIRED);
        }

        if (selectedOutcome === 2) {
            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
            if (verifyOTP(password)) {
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.VERIFY);
            } else {
                action.goTo(NodeOutcome.FAILED);
            }
        } else if (!password) {
            nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Inside the password null condition");

            action.goTo(NodeOutcome.FAILED);
        } else {
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Error handling user responses: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }
}




var jobTitle;
var sid;

  function readFromNodeState(){
        nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Twilio OTP verification");
        nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "nodeState "+ nodeState);
        sid = nodeState.get("sid")
        if (!sid) {
         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio sid is null. Routing to FAILED outcome.");
         action.goTo(NodeOutcome.FAILED);
         }
        nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Printing the sid from node state :"+ sid);
        return sid
  }
  
  function buildRequestOptions(otp){
      var authCode = systemEnv.getProperty("esv.twilio.authorizationcode");
      if (!authCode) {
         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Authorization code is null. Routing to FAILED outcome.");
         action.goTo(NodeOutcome.FAILED);
         }
    return  {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": authCode
              },
        body: "To=%2B917003591155" +   "&Code="+otp
         // URL-encoded body content
      };
}

function verifyOTP(otp){
    var sid = readFromNodeState()
    sid = systemEnv.getProperty("esv.twilio.sid");
    if (!sid) {
         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio sid is null. Routing to FAILED outcome.");
         action.goTo(NodeOutcome.FAILED);
         }
   

    var requestURL ="https://verify.twilio.com/v2/Services/" + sid + "/VerificationCheck" 
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Printing the request URL inside the verify OTP function :: " + requestURL);

  try {

    // Make the HTTP request
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Making the http call ::");
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Printing the build request option ::::::: " + buildRequestOptions(otp).toString());
    var response = httpClient.send(requestURL, buildRequestOptions(otp)).get();
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Got no error from the response http client call");
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Printing the response from the http call to twilio :: " + response);
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Printing the response from the twilio verification check ::" + response.status);
    if(response.status === "approved"){
        return true
    }else{
        return false
    }
}catch(error){
    nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Exception occureed ******* " + error);
      return false
  }
}

// Main execution
try {
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}





