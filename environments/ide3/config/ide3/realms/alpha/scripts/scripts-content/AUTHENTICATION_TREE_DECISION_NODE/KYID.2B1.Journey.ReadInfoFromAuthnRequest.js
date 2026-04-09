/**
 * Script: KYID.Journey.ReadInfoFromAuthnRequest
 * Description: This script is used to read information from login request.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get Info from Request",
    script: "Script",
    scriptName: "KYID.Journey.ReadInfoFromAuthnRequest",
    timestamp: dateTime,
    appRecords: "App metadata records",
    getHeaderName: "Trying to get headername for getXForwardedForAndStoreInSessionProperty",
    headerNotFound: "X-forwarded-For header not found",
    headerFound: "X-forwarded-For header found",
    clientIP: "Client IP Address",
    idmQueryFail: "IDM Query Operation Failed",
    // defaultURL: "esv.default.app.url",
    defaultURL: "esv.portal.url",
    missingDefaultURLConfig: "Missing default URL configuration param",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

//Declare Global variables
 var spUrl = "";
 var tempURL = "";
 var ssoclientIDs = [];
 var domain =null;
 var windowsaccountname = null;
 var isinternaluser = null;
 var upn = null;
 var KOGID = null;
 var sessionRefId = null;

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

//nodeState.putShared("EntityID","https://dev.kog.ky.gov/home/")
//nodeState.putShared("EntityID","https://expl.klocs.chfsinet.ky.gov/")

try {   

    if(typeof existingSession !== 'undefined'){
        logger.debug("ssoclientIDs value in session: "+existingSession.get("ssoclientsids"))
        ssoclientIDs.push(existingSession.get("ssoclientsids"));

        logger.debug("ssoclientIDs value in session: "+existingSession.get("AuthenticationInstant"))
        nodeState.putShared("AuthenticationInstant",existingSession.get("AuthenticationInstant"));
        

        logger.debug("domain value in session: "+existingSession.get("domain"))
        domain = existingSession.get("domain");
        nodeState.putShared("domain",domain);

        logger.debug("windowsaccountname value in session: "+existingSession.get("windowsaccountname"))
        windowsaccountname = existingSession.get("windowsaccountname");
        nodeState.putShared("windowsaccountname",windowsaccountname);

        logger.debug("isinternaluser value in session: "+existingSession.get("isinternaluser"))
        isinternaluser = existingSession.get("isinternaluser");
        nodeState.putShared("isinternaluser",isinternaluser);

        logger.debug("upn value in session: "+existingSession.get("upn"))
        upn = existingSession.get("upn");
        nodeState.putShared("upn",upn);

        logger.debug("KOGID value in session: "+existingSession.get("KOGID"))
        KOGID = existingSession.get("KOGID");
        nodeState.putShared("KOGID",KOGID);

        logger.debug("sessionRefId value in session: "+existingSession.get("sessionRefId"))
        sessionRefId = existingSession.get("sessionRefId");
        nodeState.putShared("sessionRefId",sessionRefId);
    }

    if((nodeState.get("EntityID") && nodeState.get("EntityID")!=null) || (nodeState.get("spUrl") && nodeState.get("spUrl") !== null)){
        logger.debug("EntityID: "+nodeState.get("EntityID"))
        logger.debug("spUrl: "+nodeState.get("spUrl"))
        logger.error("EntityID: "+nodeState.get("EntityID"))
        logger.error("spUrl: "+nodeState.get("spUrl"))
        spUrl = nodeState.get("spUrl") || nodeState.get("EntityID")
    
    } else {
        logger.error("App not Found, going to Default app")
        logger.debug("App not Found, going to Default app")
        if(systemEnv.getProperty(nodeConfig.defaultURL) && systemEnv.getProperty(nodeConfig.defaultURL)!=null){
            spUrl = systemEnv.getProperty(nodeConfig.defaultURL); 
        } else {
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingDefaultURLConfig+"::"+error);
             action.goTo(nodeOutcome.ERROR);
        }
    }
    
   // var userAgent = requestHeaders.get("user-agent").get(0);
    var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.3"
    logger.debug("userAgent: "+userAgent)
    
    try { 
        //AP:09/29/2024 the queryfilter logic has been changed from equale to contains to handle Auth0 displayURL as application identifier condition.
        //var appRecords = openidm.query("managed/alpha_kyid_application_metadata", { "_queryFilter" : '/forgerockAppId co "'+spUrl+'"'});

        var matchingApp = null;
        var appRecords = openidm.query("managed/alpha_kyid_businessapplication", { "_queryFilter" : '/forgerockAppId sw "'+spUrl+'"'});
        if(appRecords && appRecords.resultCount>0){
            if(appRecords.resultCount>1){
                appRecords.result.forEach(app=>{
                    var frappId = app.forgerockAppId
                    if(frappId){
                         frappId = getDomainAndFirstSegment(frappId)
                    }
                    if(spUrl){
                        var spUrl2 = getDomainAndFirstSegment(spUrl)
                        if(frappId == spUrl2){
                            matchingApp = app
                        }
                    }

    
                    
                })
                if(!matchingApp && matchingApp == null){
                    matchingApp = appRecords.result[0]
                }
                
            }
            else{
                matchingApp = appRecords.result[0]
            }
            
        }
        logger.debug("appRecords: "+appRecords)
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error); 
        action.goTo(nodeOutcome.ERROR);
    }
    
    // var tmpData =  JSON.stringify(appRecords.result[0]);
    var tmpData =  JSON.stringify(matchingApp);
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.appRecords+"::"+tmpData);//Change to debug later
    var appData = JSON.parse(tmpData);

    var forgerockAppIdwoslash = appData["forgerockAppId"] || null
    forgerockAppIdwoslash = forgerockAppIdwoslash.replace(/[\\/]+$/, ""); // remove any trailing / or \. Fix done to resolve it for claims API
    nodeState.putShared("forgerockAppId",forgerockAppIdwoslash);
    
   // nodeState.putShared("kogAppName",appData["kogAppId"]);
   // nodeState.putShared("kogAppName",appData["kogParentAppName"]);
    nodeState.putShared("kogAppName",appData["kogClaimsAppId"]);
    nodeState.putShared("needClaims",appData["needClaims"]);
    nodeState.putShared("kogAppUrl",appData["kogAppUrl"]);
    nodeState.putShared("kogDBUrl",appData["kogDBUrl"]);
    nodeState.putShared("kogParentApplicationName",appData["kogParentAppName"]);

    
    // Declare a new variable to hold the string value
    var spUrlString;
    if (typeof spUrl === "object" && spUrl !== null) {
    // Convert the object to a string
    spUrlString = JSON.stringify(spUrl);
    }
    else {
    // Optionally handle other cases
    spUrlString = spUrl;
    }
    if(!spUrlString.localeCompare(systemEnv.getProperty("esv.logout.app.url"))==0){
        ssoclientIDs.push(appData["auth0id"]);
    }
    nodeState.putShared("ApplicationIdentifier",spUrl);
    nodeState.putShared("UserAgent",userAgent);
   // nodeState.putShared("AuthenticationInstant",dateTime);
    
    var headerName = "X-Forwarded-For";
    
    if (requestHeaders.get(headerName) == null) {
      nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.headerNotFound);
      action.goTo(nodeOutcome.ERROR);
    
    } else {
          nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.headerFound);
          var headerValues = requestHeaders.get(headerName);
          
          var clientIp = String(headerValues.toArray()[0].split(",")[0]);
          nodeState.putShared("IPAddress",clientIp);
          nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.clientIP+"::"+clientIp);  
        var authenticationInstant =  new Date().toISOString();
        
         // logger.error("Authn Session Value:" + getSessionProperty("1f1adc9e835a779")+" | "+"ssoclientIDs: "+ssoclientIDs); //Remove later
        logger.debug("ssoclientIDs: "+ssoclientIDs);
        action.goTo(nodeOutcome.SUCCESS).
             putSessionProperty('ssoclientsids', ssoclientIDs).
             putSessionProperty('kogAppUrl', nodeState.get("kogAppUrl")).
             putSessionProperty("AuthenticationInstant",authenticationInstant).
             putSessionProperty('domain', domain).
             putSessionProperty('windowsaccountname', windowsaccountname).
             putSessionProperty('isinternaluser', isinternaluser).
             putSessionProperty('upn', upn).
             putSessionProperty('KOGID', KOGID).
             putSessionProperty('sessionRefId', sessionRefId)

          /*action.goTo(nodeOutcome.SUCCESS).putSessionProperty('ipAddress', clientIp).putSessionProperty('spEntityID', spUrl)
              .putSessionProperty('useragent', userAgent).putSessionProperty('AuthenticationInstant', dateTime);*/
    }
    
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
    action.goTo(nodeOutcome.ERROR);
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