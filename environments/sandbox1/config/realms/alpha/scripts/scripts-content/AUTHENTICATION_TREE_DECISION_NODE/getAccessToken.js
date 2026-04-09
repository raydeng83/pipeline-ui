// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCalls",
    script: "Script",
    scriptName: "GetAccessToken",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
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


// Define the request options
var params = "grant_type=client_credentials" +
             "&client_id=testAccess" +
             "&client_secret=Simple@678" +
             "&scope=fr:idm:*";

var requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
                    
    },
   body: params
  };
  
  // Define the request URL
  var requestURL = "https://openam-commkentsb1-useast1-sandbox.id.forgerock.io/am/oauth2/alpha/access_token";
  
  try {
    // Make the HTTP request
    var response = httpClient.send(requestURL, requestOptions).get();

      nodeLogger.error("Response is ******* " + response.text());
      action.goTo(NodeOutcome.SUCCESS);
    }catch(error){
      nodeLogger.error("Exception occureed ******* " + error);
      action.goTo(NodeOutcome.FAILED);
  }


