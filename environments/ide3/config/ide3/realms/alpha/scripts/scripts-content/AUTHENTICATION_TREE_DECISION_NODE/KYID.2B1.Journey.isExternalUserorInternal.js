var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var intDomain = null;
var extDomain = null;

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script : External or Internal UserUpdate Password in AD",
    script: "Script",
    scriptName: "KYID.2B1.Journey.isExternalUserorInternal",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
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
    },
    info: function (message) {
        logger.info(message);
    }
}

if(nodeState.get("domain")){
    var domain = nodeState.get("domain").toLowerCase();

    logger.debug("Printing the domain of the user :::::::::::: " + domain);
    logger.debug("printing the internal domain from esv" +systemEnv.getProperty("esv.kyid.int.ad.domain"));
    nodeState.putShared("domain", domain)
    
    if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
     extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();
        logger.debug("external domain details available");
      }
    
    if(systemEnv.getProperty("esv.kyid.int.ad.domain") && systemEnv.getProperty("esv.kyid.int.ad.domain")!=null){
     intDomain = systemEnv.getProperty("esv.kyid.int.ad.domain").toLowerCase();
        logger.debug("internal domain details available");
     }  
    
    if(extDomain.localeCompare(domain)==0){
          logger.debug("user is external user");
        action.goTo("External")
      
    }else if(intDomain.localeCompare(domain)==0){
          logger.debug("user is internal user");
        nodeState.putShared("isJitRequired", "true"); //JIT is always true for internal users
        action.goTo("Internal")
    } else if (nodeState.get("usrtype")) {
    var userType = nodeState.get("usrtype").toLowerCase();

    if (userType.localeCompare("internal") === 0) {
        logger.debug("user is internal user");
        nodeState.putShared("isJitRequired", "true"); // JIT is always true for internal users
        action.goTo("Internal");
    } else if (userType.localeCompare("external") === 0) {
        logger.debug("user is external user");
        action.goTo("External");
    } else {
        logger.debug("Domain information is not available or usertype invalid");
        action.goTo("NotFound");
    }
} else {
    logger.debug("Domain information is not available");
    action.goTo("NotFound")
}
} else {
    logger.debug("Domain information is not available");
    action.goTo("NotFound")
}