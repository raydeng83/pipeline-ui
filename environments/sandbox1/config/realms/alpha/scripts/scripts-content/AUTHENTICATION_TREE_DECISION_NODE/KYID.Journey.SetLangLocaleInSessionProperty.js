/**
 * Script: KYID.Journey.SetLangLocaleInCookie
 * Description: This script is used to set language locale cookie
 * Date: 9th Dec 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    node: "Node",
    nodeName: "Set Lang Locale",
    script: "Script",
    scriptName: "KYID.Journey.SetLangLocaleInCookie",
    timestamp: dateTime,
    missingInputParams: "mandatory input params are missing",
    end: "Node Execution Completed"
 };

// Node outcomes
 var nodeOutcome = {
     SUCCESS: "True",
     FAIL: "False",
 };

 // Logging Function
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

logger.error(nodeConfig.scriptName + " :: in set language locale for kerberos");

function readLangFromSessionCookie(){
          if(requestCookies.containsKey("UserLanguagePreference")){
              var langCookie = requestCookies.UserLanguagePreference
              if(langCookie.startsWith("en")){
                lang = "en"
              } else if(langCookie.startsWith("es")){
                lang = "es"
              } else {
                lang = "en"
              }           
           } 
   return lang;
}

function setLangLocale() {
    var lang = readLangFromSessionCookie();
    var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
    nodeState.putShared("langCookie", lang);
}

try {
    setLangLocale()
    action.goTo(nodeOutcome.SUCCESS);
} catch (error) {  
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error);       
    action.goTo(nodeOutcome.FAIL);
 } 