/**
* Script: KYID.Journey.FetchRequestIdFromRequestURL"
* Description: This script is used to fetch requestID from RequestURL.
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
    nodeName: "Fetch RequestId From Request URL",
    script: "Script",
    scriptName: "KYID.Journey.FetchRequestIdFromRequestURL",
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

function fetchRequestId(url){
    if(url.includes("ReqID")){
        var reqIDArray=url.split("?");
        var reqIDTemp = reqIDArray[2].split("&");
        var reqID = reqIDTemp[0].split("=")[1];
        nodeState.putShared("ReqID",reqID);
    }
    else{
        nodeState.putShared("ReqID","");
    }
    
}

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
            nodeLogger.debug("No cookies found in request headers");
    }
   //} 
    
    return matchedCookieValue;
}

function main(){

    try {
        if(requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {
            var url= decodeURIComponent(requestParameters.get("goto").get(0));
            fetchRequestId(url);
            action.goTo(nodeOutcome.SUCCESS);
        } else {
            nodeState.putShared("ReqID","");
            action.goTo(nodeOutcome.SUCCESS);
        }
        
    
    } catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.SUCCESS);
    }
}

main();
