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
    scriptName: "KYID.2B1.Journey.IsUserExistInPingAIC",
    timestamp: dateTime,
    ExistInIDM: "User Record Found in IDM",
    notExistInIDM: "User Record Not Found in IDM", 
    idmQueryFail: "IDM Query Operation Failed",
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    USERFOUND: "UserFound",
    USERNOTFOUND: "UserNotFound"
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
   
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    if(nodeState.get("mail")) {
        mail = nodeState.get("mail");
        logger.debug("mail in IsUserExistInPingAIC" + mail);
        try{     
            var response = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+mail+"\""}, ["mail", "_id", "userName"]);
            if (response.result.length==1) {
                nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.ExistInIDM+"::Email:"+mail);
                userExistinIDM = true;
                
                if(userExistinIDM){
                    nodeState.putShared("usrKOGID",response.result[0].userName)
                    action.goTo(nodeOutcome.USERFOUND);
                } else {
                    action.goTo(nodeOutcome.USERNOTFOUND);
                }
                
                
            } else {
                action.goTo(nodeOutcome.USERNOTFOUND);
                }            
        } catch(error){
              nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::Email:"+mail+"::"+error);
                                 action.goTo(nodeOutcome.USERNOTFOUND);
        }
        
    } else {
        action.goTo(nodeOutcome.USERNOTFOUND)
    }
}

//Invoke Main Function
main() 

 
