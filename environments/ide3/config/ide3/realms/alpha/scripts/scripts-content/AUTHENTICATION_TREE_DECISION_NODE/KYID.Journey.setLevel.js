var sp = null;

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

nodeLogger.error("Vote14");
// requestParameters is typically a Map<String, List<String>>
if (requestParameters && requestParameters.get("spEntityID") && requestParameters.get("spEntityID").get(0)) {
  //sp = String(requestParameters.get("spEntityID").get(0));
   sp=decodeURIComponent(requestParameters.get("spEntityID").get(0));
   nodeLogger.error("Value calculated for SP is : " + sp);
}
nodeLogger.error("Vote15");

if (sp !== null && sp === "kyidsp2") {
  action.goTo("true");
}
 
action.goTo("true");