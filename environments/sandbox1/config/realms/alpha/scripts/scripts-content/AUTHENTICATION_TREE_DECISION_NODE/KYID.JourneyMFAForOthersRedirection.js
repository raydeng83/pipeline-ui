/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "KYID.JourneyMFAForOthersRedirection",
    script: "Script",
    scriptName: "KYID.JourneyMFAForOthersRedirection",
    timestamp: dateTime,
    end: "Node Execution Completed"
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

// Function to get the email ID from request parameters
function getEmailId() {
    try {
        var emailId = requestParameters.get("email");
        if (!emailId || !emailId[0]) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email ID not provided.");
        }
        return emailId[0]; // Return the first item if it's an array
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving email ID: " + error.message);
    }
}

// Function to decode and clean the email ID
function decodeAndCleanEmail(emailId) {
    try {
        var decodedEmail = decodeURIComponent(emailId);
        var emailParts = decodedEmail.split('"');
        return emailParts.length > 1 ? emailParts[1] : emailParts[0];
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error decoding email ID: " + error.message);
        return null;
    }
}

var clocale = requestCookies.get("clocale");


try {
        var emailId = getEmailId();
        if (emailId.includes("%20")){
             emailId = emailId.replace(/%20/g, '+');
            }
         nodeState.putShared("clocale",clocale);
      if (clocale == null){
            clocale = "en";
        }
        if (emailId) {
            var email = decodeAndCleanEmail(emailId);
            if (email) {
    
         var url = systemEnv.getProperty("esv.kyid.tenant.fqdn");
        var journeyName = systemEnv.getProperty("esv.mfaforothersjourneyname");
         var kogurl = url + "/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=" + journeyName + "&email=" +  encodeURIComponent(email) + "&clocale=" + clocale + "&locale=" + clocale + "&ForceAuth=true";
       
         var link=kogurl;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
         var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
         action.goTo("redirect");  
            }
            else{
                 nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+ "Email Not Found" ); 
            }

                   
        }
    else {
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+ "Email Not Found" ); 

        
    }
     
   } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
   }
 
