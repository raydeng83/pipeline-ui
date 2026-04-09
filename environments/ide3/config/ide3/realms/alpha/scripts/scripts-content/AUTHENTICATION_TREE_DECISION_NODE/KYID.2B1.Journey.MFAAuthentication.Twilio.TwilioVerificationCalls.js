var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCalls",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.Twilio.TwilioVerificationCalls",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false",
    MaxSendReached: "MaxSendReached"
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
        var userData = openidm.read("managed/alpha_user/" + userId);
        return userData;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

function getTelephoneNumber() {
    var userId = getUserId();
    var userData = fetchUserData(userId);
   
    var telephoneNumber = null;
    if(nodeState.get("smsvoice") && nodeState.get("smsvoice")!=null){
       telephoneNumber  = nodeState.get("smsvoice")
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the telephone number" + telephoneNumber);
    var cleanedNumber;
    // Check if the number starts with a '+'
    if (telephoneNumber.startsWith('+')) {
        cleanedNumber = telephoneNumber.slice(1);
        
    } else {
        cleanedNumber = telephoneNumber;
    }
    nodeState.putShared("cleanedNumber", cleanedNumber);
    // return telephoneNumber = userData.telephoneNumber
    return cleanedNumber;
}

getTelephoneNumber();
var sidvalue = systemEnv.getProperty("esv.twilio.sid");
var authCode = "Basic "+systemEnv.getProperty("esv.twilio.authorizationcode");
var cleanedNumber = nodeState.get("cleanedNumber")
var apibody = "To=%2B"+cleanedNumber+"&Channel=call";
nodeState.putShared("apibody",apibody.toString());
var nodeStatebody = nodeState.get("apibody")
nodeState.putShared("authzcode",authCode.toString());
var authzcode = nodeState.get("authzcode")
 nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cleanedNumber :::::" + cleanedNumber);


// Define the request options
var requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
     "Authorization": authzcode
                    
    },
   body: nodeStatebody
  };
  
  // Define the request URL
  var requestURL = "https://verify.twilio.com/v2/Services/" + sidvalue  + "/Verifications";
  
  try {
    // Make the HTTP request
    var response = httpClient.send(requestURL, requestOptions).get();
    
    nodeState.putShared("sid", sidvalue)
    var status = JSON.parse(response.text()).status
    if(status === "pending"){
        var sendOTPTimestamp = new Date().toISOString();
        nodeState.putShared("sendOTPTimestamp",sendOTPTimestamp)
        action.goTo(NodeOutcome.SUCCESS);
        }
    else if (status === 429 || status === 403 ){
        action.goTo(NodeOutcome.MaxSendReached);
    }
    else {
            action.goTo(NodeOutcome.FAILED);
        }
             }catch(error){
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Exception occureed ******* " + error)
      
    action.goTo(NodeOutcome.FAILED);

  }


