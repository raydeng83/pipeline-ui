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
    defaultURL: "esv.default.app.url",
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

try {   

    if(typeof existingSession !== 'undefined'){
        logger.error("ssoclientIDs value in session: "+existingSession.get("ssoclientsids"))
        ssoclientIDs.push(existingSession.get("ssoclientsids"));
        logger.error("ssoclientIDs value in session: "+existingSession.get("AuthenticationInstant"))
        nodeState.putShared("AuthenticationInstant",existingSession.get("AuthenticationInstant"));
    }

    if(nodeState.get("EntityID") && nodeState.get("EntityID")!=null){
        logger.error("EntityID: "+nodeState.get("EntityID"))
        spUrl = nodeState.get("EntityID");
    
    } else {
        logger.error("App not Found, going to Default app")
        if(systemEnv.getProperty(nodeConfig.defaultURL) && systemEnv.getProperty(nodeConfig.defaultURL)!=null){
            spUrl = systemEnv.getProperty(nodeConfig.defaultURL); 
        } else {
             nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingDefaultURLConfig+"::"+error);
             action.goTo(nodeOutcome.ERROR);
        }
    }
    
    var userAgent = requestHeaders.get("user-agent").get(0);
    
    try { 
        //AP:09/29/2024 the queryfilter logic has been changed from equale to contains to handle Auth0 displayURL as application identifier condition.
        var appRecords = openidm.query("managed/alpha_kyid_application_metadata", { "_queryFilter" : '/forgerockAppId co "'+spUrl+'"'});
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error); 
        action.goTo(nodeOutcome.ERROR);
    }
    
    var tmpData =  JSON.stringify(appRecords.result[0]);
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.appRecords+"::"+tmpData);//Change to debug later
    var appData = JSON.parse(tmpData);
    nodeState.putShared("forgerockAppId",appData["forgerockAppId"]);
    nodeState.putShared("kogAppName",appData["kogAppId"]);
    nodeState.putShared("needClaims",appData["needClaims"]);
    nodeState.putShared("kogAppUrl",appData["kogAppUrl"]);
    nodeState.putShared("kogDBUrl",appData["kogDBUrl"]);
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

        
         // logger.error("Authn Session Value:" + getSessionProperty("1f1adc9e835a779")+" | "+"ssoclientIDs: "+ssoclientIDs); //Remove later
         logger.error("ssoclientIDs: "+ssoclientIDs);
         action.goTo(nodeOutcome.SUCCESS).putSessionProperty('ssoclientsids', ssoclientIDs).putSessionProperty('kogAppUrl', nodeState.get("kogAppUrl"));
          /*action.goTo(nodeOutcome.SUCCESS).putSessionProperty('ipAddress', clientIp).putSessionProperty('spEntityID', spUrl)
              .putSessionProperty('useragent', userAgent).putSessionProperty('AuthenticationInstant', dateTime);*/
     }
    
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
    action.goTo(nodeOutcome.ERROR);
}


