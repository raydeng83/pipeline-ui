/**
* Function: KYID.Journey.CheckSkipKerberosCookie
* Description: This script is used to check if skip kerberos cookie is present.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 10th Jan 2025
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check Skip Kerberos Cookie",
    script: "Script",
    scriptName: "KYID.Journey.CheckSkipKerberosCookie",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };
 

 //Logging Function
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

function readCookieValueFromSession(appCookieName){

    var matchedCookieValue = null;  // Initialize matchedCookieValue to store the matched cookie value

    // Use requestHeaders.get to get the cookie header
    var cookieHeader = requestHeaders.get("Cookie");
    
    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
        nodeLogger.debug("Cookies present in Request Header are: " + rawCookie);

        var rawCookieParams = rawCookie.split(";");

        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=")+1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();

            // Compare the cookie name with input param
            if (cookie.localeCompare(appCookieName) == 0) {
                nodeLogger.debug("Found matching cookie: " + cookieName[0]);
                
                // Check if cookie value exists
                if (cookieName.length > 1) {
                    //matchedCookieValue = cookieName[1].trim();  // Assign the matched value
                    matchedCookieValue = cookieValue.trim();  // Assign the matched value
                    nodeLogger.debug("Matched cookie value: " + matchedCookieValue);
                } else {
                    nodeLogger.debug("Cookie value for " + targetCookieName + " is empty or malformed.");
                }
            }
         }
      }  else {
            nodeLogger.debug("No cookies found in request headers");
    }
   //} 
    
    return matchedCookieValue;
}


if(systemEnv.getProperty("esv.environment.type") != "" && systemEnv.getProperty("esv.environment.type") != null) {
    envType = systemEnv.getProperty("esv.environment.type"); 
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType);
}  else {
     missingInputs.push(nodeConfig.missingEnvType);
}

/*if (readCookieValueFromSession("SetIdentityAssertionCompleted") != null && readCookieValueFromSession("SetIdentityAssertionCompleted").toLowerCase() == "true") {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: IdentityAssertionCompleted. Skipping Identity Assertion Node.");
    action.goTo('IdentityAssertionCompleted');
} else */if(readCookieValueFromSession("SetSkipKerberos") != null && readCookieValueFromSession("SetSkipKerberos").toLowerCase() == "true") {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: Found SetSkipKerberos cookie as true. Skipping Kerberos.");
    action.goTo('True');
} else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: SetSkipKerberos cookie is false or no SetSkipKerberos cookie is present. Going to Kerberos. ");
    action.goTo('False');
}


