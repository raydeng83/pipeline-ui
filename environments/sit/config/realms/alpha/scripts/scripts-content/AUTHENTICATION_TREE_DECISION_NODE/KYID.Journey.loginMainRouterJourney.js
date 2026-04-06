/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Route to Login Main Journey",
    script: "Script",
    scriptName: "KYID.Journey.loginMainRouterJourney",
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


 /*
  Name: getLocale()
  Description: Reads locale value from clocale cookie
  Returns: If clocale cookie present, returns clocale value. 
           Otherwise, returns default "en" as clocale value.
 */
 function getLocale() {
    
   var clocale = "en";
   
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   
   return clocale;
 }


// Main Function
function main() {
}
 try {
     var lang = getLocale();
     var link = nodeState.get("finalLoginUrl")+"&locale="+lang+"&clocale="+lang;
     nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
     var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
     action.goTo("redirect");
     
  } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
 } 

 //Invoke Main Function
 main()  