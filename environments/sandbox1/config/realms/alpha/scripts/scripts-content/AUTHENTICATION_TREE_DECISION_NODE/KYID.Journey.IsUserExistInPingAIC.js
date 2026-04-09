/**
 * Script: 
 * Description:               
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "IsUserExistInPingAIC",
    script: "Script",
    scriptName: "KYID.Journey.IsUserExistInPingAIC",
    timestamp: dateTime,
    ExistInIDM: "User Record Found in IDM",
    notExistInIDM: "User Record Not Found in IDM", 
    idmQueryFail: "IDM Query Operation Failed",
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
    FAILURE: "Failure",
    GCAPTCHAV2WITHDISPLAYNAME:"GCaptchaV2WithDisplayName",
    GCAPTCHAV2WITHOUTDISPLAYNAME:"GCaptchaV2WithoutDisplayName"  
};

// Declare Global Variables
var mail = "";
var userExistinIDM=false; 
var gcaptchaV3VerifyFail = false;


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


// Main Function
function main() {
    if(nodeState.get("gcaptchaV3VerifyFail") && nodeState.get("gcaptchaV3VerifyFail") != null){
        gcaptchaV3VerifyFail = nodeState.get("gcaptchaV3VerifyFail") 
        //nodeLogger.debug("gcaptchaV3VerifyFail: "+gcaptchaV3VerifyFail)
    }
    
    if(nodeState.get("mail")) {
        mail = nodeState.get("mail");
        logger.debug("mail in IsUserExistInPingAIC" + mail);
        try{     
            var response = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+mail+"\""}, ["mail", "_id"]);
            if (response.result.length==1) {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.ExistInIDM+"::Email:"+mail);
                userExistinIDM = true;
                
                if(userExistinIDM && !gcaptchaV3VerifyFail){
                    action.goTo(nodeOutcome.SUCCESS);
                } 
                else if(userExistinIDM && gcaptchaV3VerifyFail){
                    action.goTo(nodeOutcome.GCAPTCHAV2WITHDISPLAYNAME);
                }
                
            } else {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.notExistInIDM+"::Email:"+mail);
                if(!userExistinIDM && !gcaptchaV3VerifyFail){
                    action.goTo(nodeOutcome.ERROR);
                }
                else if(!userExistinIDM && gcaptchaV3VerifyFail){
                    action.goTo(nodeOutcome.GCAPTCHAV2WITHOUTDISPLAYNAME);
                } 
            }
            
        } catch(error){
              nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::Email:"+mail+"::"+error);
              action.goTo(nodeOutcome.FAILURE);
        }
        
    } else {
        action.goTo(nodeOutcome.ERROR);
    }
}

//Invoke Main Function
main() 

 
