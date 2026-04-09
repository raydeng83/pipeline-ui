/**
 * Script: KYID.Journey.CheckIdentityAssertionHasRun
 * Description: This script is used to check if Identity Assertion Node has talked to IG
 * Date: 23rd April 2025
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check if Identity Assertion Node has run",
    script: "Script",
    scriptName: "KYID.Journey.CheckIdentityAssertionHasRun",
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


// Check if the IdentityAssertionHasRun cookie is present and not empty
var identityAssertionHasRunCookie = readCookieValueFromSession("identityAssertionHasRunCookie");
 if(identityAssertionHasRunCookie!=null && identityAssertionHasRunCookie == "true")  {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ":: Identity Assertion Node has run. Falling back to form login." );
     
    action.goTo("True");
} else {
    action.goTo("False");
}