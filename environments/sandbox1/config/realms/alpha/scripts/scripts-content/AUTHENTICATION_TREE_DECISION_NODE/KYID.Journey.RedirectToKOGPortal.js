/**
 * Script: KYID.Journey.GotoKOGPortal
 * Description: This script redirects user to the KOG Portal
 * Date: 12th September 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Redirect To KOG With Query Param",
    script: "Script",
    scriptName: "KYID.Journey.RedirectToKOGPortal",
    timestamp: dateTime,
    kogRedirectURL: "esv.kyid.kog.redirect.url",
    missingKOGAccountRouterURL: "Missing KOG Account Router URL",
    end: "Node Execution Completed",
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Declare Global Variables
var GUIDJSONobject = {};
var nonce = null;
var goto = "";
var kogurl = "";

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

// Generate a random GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, 
            value = c == 'x' ? r : (r & 0x3 | 0x8);
        return value.toString(16);
    });
}

function main() {
    
    try {
        if(systemEnv.getProperty(nodeConfig.kogRedirectURL) && systemEnv.getProperty(nodeConfig.kogRedirectURL)!=null){
             kogurl = systemEnv.getProperty(nodeConfig.kogRedirectURL)
             nodeLogger.error("KOG Redirect URL: "+kogurl)
             // var kogurl = "https://dev.kog.ky.gov/reports/?fr=1"
             nonce = generateGUID();
              
             /*if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
                 if(requestCookies.ReturnURL && requestCookies.ReturnURL != null){
                     goto = requestCookies.ReturnURL;
                 }
                  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+requestCookies.ReturnURL); 
             } */

            if(nodeState.get("returnURL") && nodeState.get("returnURL")!=null){
                goto = nodeState.get("returnURL");
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+goto); 
            }
            
             if(typeof existingSession !== 'undefined'){
                if(existingSession.get("nonce") && existingSession.get("nonce")!=null) {
                    GUIDJSONobject = JSON.parse(existingSession.get("nonce"));
                    logger.error("GUIDJSONobject before update: "+JSON.stringify(GUIDJSONobject))
                    GUIDJSONobject[nonce]=goto;
                    logger.error("GUIDJSONobject after update: "+JSON.stringify(GUIDJSONobject))
                }
             } else {
                 GUIDJSONobject[nonce]=goto;
             }
            
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+JSON.stringify(GUIDJSONobject));   
             
            
             var link= decodeURIComponent(kogurl)+"&nonce="+nonce+"&returnurl="+goto;
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+link); 
            
             //var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
             //action.goTo(redirect).putSessionProperty("nonce",GUIDJSONobject);
            nodeState.putShared("needKogSuccess",link);
            action.goTo(nodeOutcome.SUCCESS).putSessionProperty("nonce",JSON.stringify(GUIDJSONobject))
                .putSessionProperty("needKogSuccess",link);
            
            
         } else {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingKOGAccountRouterURL); 
             action.goTo(nodeOutcome.ERROR); 
         }
        
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
        action.goTo(nodeOutcome.ERROR);  
    }
}

//Main Function 
main();
