/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Route to LoginES",
    script: "Script",
    scriptName: "KYID.Journey.BackToLoginES",
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
                    matchedCookieValue = cookieValue.trim();  // Assign the matched value
                    nodeLogger.debug("Matched cookie value: " + matchedCookieValue);
                } else {
                    nodeLogger.debug("Cookie value for " + targetCookieName + " is empty or malformed.");
                }
            }
         }
      }  else {
            nodeLogger.error("No cookies found in request headers");
    }
   //} 
    
    return matchedCookieValue;
}

try {
    // logger.error("Request URL Value is ---" +readCookieValueFromSession("RequestURL"))
    var RequestURL= readCookieValueFromSession("RequestURL")
    if(nodeState.get("TransactionSessionOver") === "True" && RequestURL.includes("composite_advice")){
       var ReturnURL=readCookieValueFromSession("ReturnURL")
        var link =ReturnURL;
        var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"URL has TransactionID and Transaction session has maxed out"+ link); 
        action.goTo("redirect");
    }
    else {
    RequestURL = RequestURL.replace(/\\/g, '')
    // logger.error("Request URL Value is Cleaned One ---" +RequestURL)
    var subString = "TransactionConditionAdvice";
     if (RequestURL.includes(subString)) {
    RequestURL = RequestURL.replace(subString, `"${subString}"`);
    }
    if (RequestURL === undefined || !RequestURL || RequestURL === null ) {
        var vlink = nodeState.get("reqUrlBackToLoginCookie")
        var link= vlink+"&clocale=es&locale=es";
     nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+link); 
     var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
     action.goTo("redirect");
    } else {
        var link = RequestURL+"&locale=es&clocale=es"
     nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
     var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
     action.goTo("redirect");
    }
    }
     
} catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
 }