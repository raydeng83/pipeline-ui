/**
* Function: KYID.Journey.Initialize
* Description: This script is used to initialize key session-related parameters such as expiration times.
* Param(s):
* Input:
*                              
* Returns: 
•	Success: Initialization completed successfully.
•	Error: An exception occurred during initialization.

* Date: 22nd December 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Initialize Journey",
    script: "Script",
    scriptName: "KYID.Journey.Initialize",
    timestamp: dateTime,
    exceptionErrMsg: "Error calculating redirect time: ",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "success",
    ERROR: "error"    
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

function readCookieValueFromSession(appCookieName) {
    

    var matchedCookieValue = null;  // Initialize matchedCookieValue to store the matched cookie value

    // Use requestHeaders.get to get the cookie header
    var cookieHeader = requestHeaders.get("Cookie");

    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
       // nodeLogger.debug("Cookies present in Request Header are: " + rawCookie);

        var rawCookieParams = rawCookie.split(";");

        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=") + 1);
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
    } else {
        nodeLogger.debug("No cookies found in request headers");
    }
    //} 

    return matchedCookieValue;
}

try {
    
    var WSFEDTimeOut= systemEnv.getProperty("esv.wsfed.session.timeout.value");
    // var WSFEDTimeOut= 40;
    var SAMLTimeOut= systemEnv.getProperty("esv.saml.session.timeout.value");
    var authnSessionMaxTime = SAMLTimeOut * 60 *1000;
    var langCookie = "es"
    if (requestCookies.get("UserLanguagePreference") && requestCookies.get("UserLanguagePreference") != null) {
        if (requestCookies.get("UserLanguagePreference") === "es-MX") {
            langCookie = "es"
        }
        else {
            langCookie = "en"
        }
    }
    else {
        langCookie = "en"

    }
      //getSessionId()
    
    if(requestParameters.get("goto")){
        var goto = requestParameters.get("goto").get(0)
        if (goto.includes("redirect_uri")) {
            var authnSessionCurrentTime = Date.now();
            var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;
        }

    else{ 
   

    if (readCookieValueFromSession("rp-realm") != null) {
        if (requestCookies.get("getIssuerTime")) {
            var getIssuerTime = requestCookies.get("getIssuerTime")
            var getIssuerTimeUnixTime = new Date(getIssuerTime).getTime();
            var authnSessionRedirectTime = getIssuerTimeUnixTime + WSFEDTimeOut * 60 * 1000;
        }
        else {
           var authnSessionCurrentTime = Date.now();
            var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;
          
        }


    }

    else if (requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && readCookieValueFromSession("rp-realm") == null) {
        if (requestCookies.get("getIssuerTime")) {
            var getIssuerTime = requestCookies.get("getIssuerTime")
            var getIssuerTimeUnixTime = new Date(getIssuerTime).getTime();
            var authnSessionRedirectTime = getIssuerTimeUnixTime + SAMLTimeOut * 60 * 1000;
        }
        else {
          var authnSessionCurrentTime = Date.now();          
         var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;

        }
    }

    else {
            var authnSessionCurrentTime = Date.now();
            var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;
    }
}
    }
    else{
            var authnSessionCurrentTime = Date.now();
            var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;
    }


    // Retrieve the authnSessionRedirectTime check interval in miliseconds   
    var authnSessionCheckInterval = 1000;

    // Get the redirect URL   
    var url = systemEnv.getProperty("esv.kyid.tenant.fqdn");
    // var journeyName = systemEnv.getProperty("esv.mfaforselfjourneyname");
    var journeyName = "kyid_BackToApplicationRouter"

    // var authnSessionRedirectUrl = String(systemEnv.getProperty('esv.default.app.url')).trim(); 
    var authnSessionRedirectUrl = String(url + "/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=" + journeyName + "&locale=" + langCookie + "&clocale=" + langCookie).trim();

    // Store the calculated values in nodeState for later use   
    nodeState.putShared("authnSessionRedirectTime", authnSessionRedirectTime);
    nodeState.putShared("authnSessionRedirectUrl", authnSessionRedirectUrl);
    nodeState.putShared("authnSessionCheckInterval", authnSessionCheckInterval);
    // Log debug information   
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "authnSessionCurrentTime" + "::" + authnSessionCurrentTime);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "authnSessionMaxTime" + "::" + authnSessionMaxTime);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "authnSessionRedirectTime" + "::" + authnSessionRedirectTime);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "authnSessionRedirectUrl" + "::" + authnSessionRedirectUrl);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "authnSessionCheckInterval" + "::" + authnSessionCheckInterval);
    action.goTo(nodeOutcome.SUCCESS);

} catch (error) {
    // Handle errors   
    // nodeState.putShared( "errorMessage ", error.toString());   
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.exceptionErrMsg + "::" + error);
    action.goTo(nodeOutcome.ERROR);
} 