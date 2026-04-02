/**
 * Script: 
 * Description:               
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: " Display Error PTA",
    script: "Script",
    scriptName: "KYID.Journey.DisplayErrorMsg",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    firstTimeError: "firstTimeError",
    CITDomainPart: "CITDomainPart",
    userClaimsAPIError: "userClaimsAPIError",
    jitUnknownError: "jitUnknownError",
    jitNotFoundError: "jitNotFoundError",
    jitInvalidAccountError: "jitInvalidAccountError",
    jitStubAccountError: "jitStubAccountError",
    expiredIntUserPwdUpdate: "expiredIntUserPwdUpdate",
    jitNotAllowedError:'jitNotAllowedError',
    false: "false"
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

try {

    
    // Retrieve parameters from request
    if(requestParameters.get("error") && requestParameters.get("error")!=null) {
        action.goTo(nodeOutcome.firstTimeError);
    }
    else if(requestParameters.get("CITDomainPart") && requestParameters.get("CITDomainPart")!=null){
        action.goTo(nodeOutcome.CITDomainPart);
    }
    else if(requestParameters.get("userClaimsAPIError") && requestParameters.get("userClaimsAPIError")!=null){
        action.goTo(nodeOutcome.userClaimsAPIError);
    }
    else if(requestParameters.get("jitUnknownError") && requestParameters.get("jitUnknownError")!=null){
        action.goTo(nodeOutcome.jitUnknownError);
    }
    else if(requestParameters.get("jitNotFoundError") && requestParameters.get("jitNotFoundError")!=null){
        action.goTo(nodeOutcome.jitNotFoundError);
    }
    else if(requestParameters.get("jitInvalidAccountError") && requestParameters.get("jitInvalidAccountError")!=null){
        action.goTo(nodeOutcome.jitInvalidAccountError);
    }
    else if(requestParameters.get("jitStubAccountError") && requestParameters.get("jitStubAccountError")!=null){
        action.goTo(nodeOutcome.jitStubAccountError);
    }  
    else if(requestParameters.get("expiredIntUserPwdUpdate") && requestParameters.get("expiredIntUserPwdUpdate")!=null){
        action.goTo(nodeOutcome.expiredIntUserPwdUpdate);
    }
    else if(requestParameters.get("jitNotAllowedError") && requestParameters.get("jitNotAllowedError")!=null){
       action.goTo(nodeOutcome.jitNotAllowedError);
    }    
    else {
        action.goTo(nodeOutcome.false);
    }

} catch (error) {
    // Handle any errors that occur during processing
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
}
