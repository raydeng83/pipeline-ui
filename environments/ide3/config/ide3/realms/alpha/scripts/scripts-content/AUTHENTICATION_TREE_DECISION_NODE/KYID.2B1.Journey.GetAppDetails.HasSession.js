 var spUrl = null;
 var ReturnURL = null;
 try{
logger.debug("reqIDCookies :: => "+ JSON.stringify(nodeState.get("reqIDCookies")))
 // spUrl = readCookieValueFromSession("ReturnURL");
                // if(nodeState.get("reqIDCookies")){
                //     var reqIDCookies = nodeState.get("reqIDCookies");  
                //     //var ReturnURL = reqIDCookies.ReturnURL || null;
                //     if(reqIDCookies.rprealm && reqIDCookies.rprealm!=null){
                //         ReturnURL = reqIDCookies.rprealm ;
                //     }else{
                //         ReturnURL = reqIDCookies.ReturnURL;
                //     }
                //     spUrl = getDomainAndFirstSegment(ReturnURL);
                // }
                 if(nodeState.get("reqIDCookies")){
                    var reqIDCookies = nodeState.get("reqIDCookies");  
                    //var ReturnURL = reqIDCookies.ReturnURL || null;
                    if(reqIDCookies.rprealm && reqIDCookies.rprealm!=null){
                         ReturnURL = reqIDCookies.rprealm ;
                    }else if(reqIDCookies.ReturnURL && reqIDCookies.ReturnURL!=null){
                         ReturnURL = reqIDCookies.ReturnURL;
                    }
                    if(ReturnURL && ReturnURL!= null){
                      spUrl = getDomainAndFirstSegment(ReturnURL);  
                    }
                    else{
                       spUrl = null; 
                    }
                    
                }else{
                    spUrl = null;
                }
                if (spUrl) {
                    logger.debug("spUrl from cookie hasSession: " + spUrl);
                    var query = { "_queryFilter": 'forgerockAppId sw "' + spUrl + '" or applicationURL sw "' + spUrl + '"' };
                    var businessRecord = getBusinessAppRecord(query);
                    if (!businessRecord && systemEnv.getProperty("esv.kyid.portal.name")) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }
                // 2. Try EntityID from nodeState
                else if (nodeState.get("EntityID")) {
                    spUrl = nodeState.get("EntityID");
                    var query = { "_queryFilter": 'forgerockAppId sw "' + spUrl + '" or applicationURL sw "' + spUrl + '"' };
                    var businessRecord = getBusinessAppRecord(query);
                    if (!businessRecord && systemEnv.getProperty("esv.kyid.portal.name")) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }
                // 3. Fallback to default portal
                else if (systemEnv.getProperty("esv.kyid.portal.name")) {
                    defaultAppName = systemEnv.getProperty("esv.kyid.portal.name");
                    var query = {"_queryFilter": '/name eq "' + defaultAppName + '"'};
                    var businessRecord = getBusinessAppRecord(query);
                    if (!businessRecord) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }

                // Set kogAppName and appLogo if found
                if (businessRecord) {
                    kogAppName = businessRecord.name || null;
                    appLogo = businessRecord.logoFileName || businessRecord.logoURL || null;
                    nodeState.putShared("appName",kogAppName)
                    nodeState.putShared("appLogo",appLogo)
                   logger.debug("appName when hasSession: " + kogAppName);
                    logger.debug("appLogo when hasSession: " + appLogo);
                } else {
                    logger.debug("missingAppURL" + ":: No business application record found");
                }
                action.goTo("true")
            } catch (e) {
                logger.error("idmQueryFail in catch exception" + "::" + e);
                action.goTo("true")
            }


function readCookieValueFromSession(appCookieName){
 
    var matchedCookieValue = null;  // Initialize matchedCookieValue to store the matched cookie value
 
    // Use requestHeaders.get to get the cookie header
    var cookieHeader = requestHeaders.get("Cookie");
    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
        logger.debug("Cookies present in Request Header are when hasSession: " + rawCookie);
 
        var rawCookieParams = rawCookie.split(";");
 
        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=")+1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();
 
            // Compare the cookie name with input param
            if (cookie.localeCompare(appCookieName) == 0) {
                logger.debug("Found matching cookie when hasSession: " + cookieName[0]);
                // Check if cookie value exists
                if (cookieName.length > 1) {
                    //matchedCookieValue = cookieName[1].trim();  // Assign the matched value
                    matchedCookieValue = cookieValue.trim();  // Assign the matched value
                    logger.debug("Matched cookie value when hasSession: " + matchedCookieValue);
                } else {
                    logger.debug("Cookie value for " + targetCookieName + " is empty or malformed when hasSession.");
                }
            }
         }
      }  else {
           logger.debug("No cookies found in request headers when hasSession");
    }
   //} 
    return matchedCookieValue;
}

function getBusinessAppRecord(query) {
                var records = openidm.query("managed/alpha_kyid_businessapplication", query, ["*"]);
                if (records && records.resultCount > 0) {
                    return records.result[0];
                }
                return null;
            }

function getDomainAndFirstSegment(url) {
    var match = url.match(/^(https?:\/\/[^\/]+\/[^\/]+)(\/.*)?$/);
    if (match) {
        return match[1];
    }
    // If there's no path segment, return domain root without trailing slash
    match = url.match(/^(https?:\/\/[^\/]+)\/?$/);
    if (match) {
        return match[1];
    }
    return url;
}

 function getDefaultBusinessAppRecord() {
                var defaultAppName = systemEnv.getProperty("esv.kyid.portal.name");
                if (!defaultAppName) return null;
                var query = { "_queryFilter": '/name eq "' + defaultAppName + '"' };
                var record = getBusinessAppRecord(query);
                return record;
            }

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