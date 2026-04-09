var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFARegistration TwilioVerificationCalls",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance_PhoneRegistration.MFARegistration.Twilio.SMSGenerator",
    timestamp: dateTime,
    errorId_InvalidPhoneNumber:"errorID::KYID011",
    errorId_MaxLimitExceed:"errorID::KYID012",
    errorId_SMSFailed:"errorID::KYID013",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    INVALIDNUMBER: "InvalidNumber",
    FAILED: "false",
    MaxSendReached: "MaxSendReached",
    ERROR:"error"
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
    },
    info: function (message) {
        logger.info(message);
    }
}

function getTelephoneNumber() {
    var telephoneNumber = nodeState.get("telephoneNumber");
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the telephone number" + telephoneNumber);
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
var sidvalue = systemEnv.getProperty("esv.twilio.sid.2b");
var authCode = "Basic " + systemEnv.getProperty("esv.twilio.authorizationcode");
var cleanedNumber = nodeState.get("cleanedNumber")
var apibody = "To=%2B" + cleanedNumber + "&Channel=sms";
nodeState.putShared("apibody", apibody.toString());
var nodeStatebody = nodeState.get("apibody")
nodeState.putShared("authzcode", authCode.toString());
var authzcode = nodeState.get("authzcode")
nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cleanedNumber :::::" + cleanedNumber);


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
var requestURL = "https://verify.twilio.com/v2/Services/" + sidvalue + "/Verifications";

try {
    // Make the HTTP request
    var response = httpClient.send(requestURL, requestOptions).get();
    // Log the response for debugging
    // logger.debug("Printing the response ::::: " + response);
    nodeState.putShared("sid", sidvalue)
    var status = JSON.parse(response.text()).status
    var sendOTPTimestamp = new Date().toISOString();
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Printing the status of verification" + status)
    if (status === "pending") {
        nodeState.putShared("sendOTPTimestamp",sendOTPTimestamp)
         nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Phone SMS OTP Notification sent successfully to" +nodeState.get("telephoneNumber") )
        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"OTP  sent successfully to " +nodeState.get("telephoneNumber") )
        nodeState.putShared("otpDeliveryMethod","SMS");
         action.goTo(NodeOutcome.SUCCESS);
    } else if (status === 400) {
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Invalid Phone Number" +"::"+nodeConfig.errorId_InvalidPhoneNumber+"::"+nodeState.get("telephoneNumber") )
        action.goTo(NodeOutcome.INVALIDNUMBER);
    }
    else if (status === 429) {
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Max Limit Exceed" +"::"+nodeConfig.errorId_MaxLimitExceed+"::"+nodeState.get("telephoneNumber") )
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Twilio: Maximum number of concurrent API requests has been reached" +"::"+nodeState.get("mail") )
        action.goTo(NodeOutcome.MaxSendReached);
    }
    else if (status === 403) {
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Max Limit Exceed" +"::"+nodeConfig.errorId_MaxLimitExceed+"::"+nodeState.get("telephoneNumber") )
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName+"Twilio:Status code 403 forbidden error"+"::"+nodeState.get("mail") )
        action.goTo(NodeOutcome.MaxSendReached);
    }
    else {
        nodeState.putShared("sendOTPTimestamp",sendOTPTimestamp)
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Send Phone SMS OTP Notification Failed for"  +"::"+nodeState.get("telephoneNumber")+"::"+ nodeConfig.errorId_SMSFailed+"::"+response);
        nodeState.putShared("phoneOTPFailed","true");
        action.goTo(NodeOutcome.SUCCESS);
    }
} catch (error) {
     var sendOTPTimestamp = new Date().toISOString();
     nodeState.putShared("sendOTPTimestamp",sendOTPTimestamp)
     nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Send Phone SMS OTP Notification Failed for"  +"::"+nodeState.get("telephoneNumber")+"::"+ nodeConfig.errorId_SMSFailed+"::"+error);
     nodeState.putShared("phoneOTPFailed","true");
     action.goTo(NodeOutcome.SUCCESS);

}



