var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCalls",
    script: "Script",
    scriptName: "kyid.selfRegistrationSMS.js",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false",
	MaxSendReached: "MaxSendReached"
};

function getTelephoneNumber() {
    var objectAttributes = nodeState.get("objectAttributes");
    var telephoneNumber = objectAttributes.get("telephoneNumber");
   var cleanedNumber;
    
    // Check if the number starts with a '+'
    if (telephoneNumber.startsWith('+')) {
        cleanedNumber = telephoneNumber.slice(1);
        
    } else {
        cleanedNumber = telephoneNumber;
    }
    nodeState.putShared("cleanedNumber", cleanedNumber);
    return cleanedNumber;
}

getTelephoneNumber();
var sidvalue = systemEnv.getProperty("esv.twilio.sid");
logger.error("------------------sid value---------------------"+sidvalue)
var authCode = "Basic "+systemEnv.getProperty("esv.twilio.authorizationcode");
logger.error("------------------authz value---------------------"+authCode)
logger.error("printing sid value "+ sidvalue)
logger.error("printing authz code value "+ authCode)
var cleanedNumber = nodeState.get("cleanedNumber")
logger.error("------------------clean num------------------"+cleanedNumber)
var apibody = "To=%2B"+cleanedNumber+"&Channel=sms";
nodeState.putShared("apibody",apibody.toString());
var nodeStatebody = nodeState.get("apibody")
nodeState.putShared("authzcode",authCode.toString());
var authzcode = nodeState.get("authzcode")
// nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cleanedNumber :::::" + cleanedNumber);

// callbacksBuilder.textOutputCallback(1,"Enter the OTP here");
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
    
    // Log the response for debugging
    logger.error("Printing the response ::::: " + response);
    nodeState.putShared("sid", sidvalue)
    var status = JSON.parse(response.text()).status
    logger.error("Printing the status in /verifications ******* " + status)
    if(status === "pending"){
    action.goTo(NodeOutcome.SUCCESS)
    }
	else if (status === 429 || status === 403){
	action.goTo(NodeOutcome.MaxSendReached)
	}
	
	else{
        action.goTo(NodeOutcome.FAILED)
    }
     }catch(error){
      // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Exception occureed ******* " + error)
      
    action.goTo(NodeOutcome.FAILED)

  }
