var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCheck",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.TwilioVerificationCheck.SMS",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another Method",
    EXPIRED: "expired",
    RESEND: "Resend Code",
    FAILED: "false",
    EMPTY_OTP: "BlankOTP"
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

//var DEBUG = "true";

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

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :::::: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}


// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

function getTelephoneNumber() {
    var userId = getUserId()
    var userData = fetchUserData(userId)
    var telephoneNumber = null;
    //return telephoneNumber = userData.telephoneNumber
    //var telephoneNumber = userData.telephoneNumber;
if(nodeState.get("smsvoice") && nodeState.get("smsvoice")!=null){
       telephoneNumber  = nodeState.get("smsvoice")
    }
  
   //nodeLogger.debug("priniting telephone num ::::::::::::::::::::::::" + userData.telephoneNumber);
    nodeLogger.debug("priniting telephone num ::::::::::::::::::::::::" + telephoneNumber);
    var cleanedNumber;
    // Check if the number starts with a '+'
    if (telephoneNumber.startsWith('+')) {
        cleanedNumber = telephoneNumber.slice(1);
        
    } else {
        cleanedNumber = telephoneNumber;
    }
    nodeState.putShared("cleanedNumber", cleanedNumber);
    return telephoneNumber =telephoneNumber
}


function getDisplayMessage() {
    getLocale();
    var clocale = nodeState.get("clocale");
    //var userEmail = nodeState.get("email")
    //var lastLetter = userEmail.split("@")[0]
    //lastLetter = lastLetter.slice(-1)
    var nodeStateNumber = getTelephoneNumber()
    if (clocale === "en") {
        var boldoutput = nodeStateNumber.substring(0, nodeStateNumber.length-10) + " XXX-XXX-" + nodeStateNumber.slice(-4)
        var displayMessage = "A code was sent to " + boldoutput.bold() + ". Enter the code below to verify." + "<br><br>Carrier messaging charges may apply."
    }
    if (clocale === "es") {
        var boldoutput = nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4)
        var displayMessage = "Se envió un código a " + boldoutput.bold() + ". Ingrese el código a continuación para verificar su identidad." + "<br><br>Se pueden aplicar cargos por mensajes del operador."
    }

    return displayMessage
}


// Function to handle callback requests
function requestCallbacks() {
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
        if (clocale === "en") {
             if (nodeState.get("errorMessage_ExpiredOtp") != null) {
                var error =nodeState.get("errorMessage_ExpiredOtp");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }

            if (nodeState.get("resendcodeMessage") != null) {
                var resendcodeMessage =nodeState.get("resendcodeMessage");
                callbacksBuilder.textOutputCallback(1,resendcodeMessage)
            }

            if (nodeState.get("errorMessage_BlankOTP") != null) {
                var error =nodeState.get("errorMessage_BlankOTP");
               // callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            
            callbacksBuilder.textOutputCallback(0, `<div class='page-element'>${getDisplayMessage()}</div>`)
            callbacksBuilder.textInputCallback("Enter Code");
            callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Return to authenticator list"], 0);
        } else if (clocale === "es") {
             
              if (nodeState.get("errorMessage_ExpiredOtp") != null) {
                var error = nodeState.get("errorMessage_ExpiredOtp");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }

            if (nodeState.get("resendcodeMessage") != null) {
                var resendcodeMessage =nodeState.get("resendcodeMessage");
                callbacksBuilder.textOutputCallback(1,resendcodeMessage)
            }

            if (nodeState.get("errorMessage_BlankOTP") != null) {
                var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
            }
            
            callbacksBuilder.textOutputCallback(0, getDisplayMessage())
            callbacksBuilder.textInputCallback("Introducir código");
            callbacksBuilder.confirmationCallback(0, ["Verificar", "Seleccione una de las siguientes opcione", "Verificar con otra cosa"], 0);
        } else {
            // Default or unsupported locale
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Unsupported locale: " + clocale);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);

    }
}


// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getTextInputCallbacks().get(0).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the handle user response callback ::");

        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);


        var expiredPassword = nodeState.get("oneTimePasswordTimestamp")

        if (selectedOutcome === 2) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
            logger.debug("Inside the selected outcome is verify ***********");
            if (!password || password == null) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.EMPTY_OTP);
            } else {
                var timediff = new Date(dateTime) - new Date(nodeState.get("sendOTPTimestamp")) 
                if(timediff >=298800){
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    action.goTo(NodeOutcome.EXPIRED);
                                       
                }
                                      
              else if (verifyOTP(password)) {
                          
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                nodeState.putShared("errorMessage", null)
                 nodeState.putShared("errorMessage_ExpiredOtp", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                 logger.debug("Inside the selected outcome is verify ***********");
                action.goTo(NodeOutcome.VERIFY);
            } else {
                nodeState.putShared("errorMessage_ExpiredOtp", null)
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("errorMessage_BlankOTP", null)
                action.goTo(NodeOutcome.FAILED);
            }
            }
           
        } else if (!password) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.EMPTY_OTP);
        } else {
           nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
           nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
        nodeState.putShared("errorMessage", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        nodeState.putShared("resendcodeMessage", null)
        nodeState.putShared("errorMessage_BlankOTP", null)
        action.goTo(NodeOutcome.FAILED);
    }
}




var sid;

function readFromNodeState() {
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " *** Twilio OTP verification *** ");
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "nodeState " + nodeState);
    sid = nodeState.get("sid")
    if (!sid) {
     nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Twilio sid is null. Routing to FAILED outcome.");
     action.goTo(NodeOutcome.FAILED);
     }
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the sid from node state :" + sid);
    return sid
}

function verifyOTP(otp){
 var sid = nodeState.get("sid")
 logger.debug("Printing the sid value inside the verify OTP function :::: " + sid)
// logger.debug("Printing the verify OTP function :::: " + otp)
   
    //var postData = "To=%2B919893125676&Code=";  
 var cleanedNumber = nodeState.get("cleanedNumber")

 var postData = "To=%2B"+cleanedNumber+"&Code=";
     var otpValue = "";
     otpValue = postData + otp;
   
  
       nodeState.putShared("Twilio_otp", otpValue);
      var twilio_otp =  nodeState.get("Twilio_otp") 
      nodeState.putShared("twilio_otp",twilio_otp);
        var authCode = "Basic "+systemEnv.getProperty("esv.twilio.authorizationcode");
   // logger.debug("Printing the verify authcode function :::: " + authCode)
        nodeState.putShared("authCode",authCode.toString());
      var options = {                             
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
         "Authorization": nodeState.get("authCode")
      },
       body: nodeState.get("twilio_otp")
}

    var requestURL = "https://verify.twilio.com/v2/Services/"+ sid +"/VerificationCheck";
   nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Request URL :::::::::::::::: " + requestURL)
  var response = httpClient.send(requestURL, options).get();      
  // var resp = response.getEntity().getString();
 nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing response dot status *********** " + response.status)
   //logger.debug("******Twilio verification response *********** " + response.text())
    //logger.debug("******Twilio verification response to String *********** " + JSON.stringify(response))
    //logger.debug("******Twilio verification response JSON dot parse *********** " + JSON.parse(response.text()))
     //logger.debug("******Twilio verification response *********** " + JSON.parse(response.text()).status)
    
logger.debug("******Twilio verification response status *********** " + JSON.parse(response.text()).status);
var status = JSON.parse(response.text()).status
logger.debug("Printing the status :::: " + status + "type of " + typeof(status))
 if(status === "approved"){
        return true
    }else{
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
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage", null)
    nodeState.putShared("resendcodeMessage", null)
    action.goTo(NodeOutcome.FAILED);
}