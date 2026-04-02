
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

if(requestParameters.get("requestProcessed") && String(requestParameters.get("requestProcessed").get(0)) === "true") {
	outcome="True";
} else {
    var redirectUrl = readCookieValueFromSession("redirectUrl");
    if (redirectUrl.localeCompare("unset")==0) {
		outcome="True";
	} else {
    	var redirect = callbacksBuilder.redirectCallback(redirectUrl+"&requestProcessed=true", null, "GET");
        action.goTo("redirect");
    	outcome="False";
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
                    //matchedCookieValue = cookieName[1].trim();  // Assign the matched value
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