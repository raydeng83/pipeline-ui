/**
* Script: KYID.Journey.IsRequestURLCookiePresent
* Description: This script is used to REquestURL cookie in session.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 6th August 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Is RequestURL cookie Present",
    script: "Script",
    scriptName: "KYID.Journey.IsRequestURLCookiePresent",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "True",
     ERROR: "False"
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


function updateScope(url){
    //var url = readCookieValueFromSession("RequestURL");
    var urlParts = url.split("&");
    for (var i =0; i < urlParts.length; i++) {
        if ( urlParts[i].startsWith("scope=")) {
            urlParts[i] = urlParts[i].replace(" ", "%20").replace(/ /g, "%20");
        }
    }
    return urlParts.join("&");
}

function main(){

    try {
        logger.error("reqUrlBackToLoginCookie value is: "+readCookieValueFromSession("RequestURL"))
        if(readCookieValueFromSession("RequestURL") && readCookieValueFromSession("RequestURL")!=null){
            var url = readCookieValueFromSession("RequestURL");
            var updatedUrl = updateScope(url);
            nodeState.putShared("reqUrlBackToLoginCookie",updatedUrl);
            action.goTo(nodeOutcome.SUCCESS);
        } else {
             action.goTo(nodeOutcome.ERROR);
        }
    
    } catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.ERROR);
    }
}

main();
