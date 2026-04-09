var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "check Email Alter",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.CheckIfAltered",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    DontVerify: "dontVerify",
    VERIFY:"verifyEmail",
    ERROR: "error",
    userExist:"userExist"
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



// Main Execution
try {
var primaryEmail = null;
if(nodeState.get("primaryEmail")!= null){
 primaryEmail=nodeState.get("primaryEmail").toLowerCase();
}
var collectedPrimaryEmail=nodeState.get("collectedPrimaryEmail").toLowerCase();
var verifiedPrimaryEmail = null;
if(nodeState.get("verifiedPrimaryEmail")!= null){
    verifiedPrimaryEmail = nodeState.get("verifiedPrimaryEmail").toLowerCase();
}
logger.debug("collectedPrimaryEmail is "+ nodeState.get("collectedPrimaryEmail") )
if(nodeState.get("isEmailEditable") != null)
{
var isEmailEditable = nodeState.get("isEmailEditable");
}
if(nodeState.get("journeyName")=="Registration_Acceptance"){

 checkIfEmailAltered(primaryEmail,collectedPrimaryEmail,verifiedPrimaryEmail); 
    
    
}
else{
    var isUserExist = validateUser(collectedPrimaryEmail);
        if(isUserExist == true){
        action.goTo(NodeOutcome.userExist)
        }
        else{
        logger.debug("Going to check If email Altered")
       checkIfEmailAltered(primaryEmail,collectedPrimaryEmail,verifiedPrimaryEmail); 
        }
    
    
}
    
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution"+"::"+error );
}




// Functions
function validateUser(email) {
    var createNewAccount = false
    try {
        var response = openidm.query("managed/alpha_user/", { "_queryFilter": '/mail eq "'+email+'"'}, [""]);
        logger.debug("User Response is :: " + response)
        if(response.result.length > 0){
            return true;       

        }
        else{
            return false;
        }

        //Create Account only when user doens't exist in alpha_user or if user exist with 'Terminated' status
        /*logger.debug("Validate email exist or not - "+email)
        var response = openidm.query("managed/alpha_user/", { "_queryFilter": '/mail eq "'+email+'"'}, [""]);
        logger.debug("User Response is :: " + JSON.stringify(response))
        var usrRecords = response.result
        if(response.resultCount > 0){
            for(var i=0;i<usrRecords.length;i++){
                createNewAccount = false
                logger.debug("User record => "+JSON.stringify(usrRecords[i]))
                if(usrRecords[i].accountStatus=="Terminated"){
                    createNewAccount = true
                }
            }   
            logger.debug("createAccount? => "+createNewAccount)
            if(createNewAccount){
                return false
            } else {
                return true
            }
        }
        else{
            return false
        }*/

    } catch (error) {
        
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred while validating user"+"::"+"emailId::"+email+"::"+error );

    }
    
}

function checkIfEmailAltered(primaryEmail,collectedPrimaryEmail,verifiedPrimaryEmail) {
    try {
        logger.debug("Collected Email Is"+verifiedPrimaryEmail+collectedPrimaryEmail+primaryEmail)
        if(verifiedPrimaryEmail == collectedPrimaryEmail){
            nodeState.putShared("verifiedPrimaryEmail",nodeState.get("collectedPrimaryEmail"));
            logger.debug("Going to Don't Verify")
            action.goTo(NodeOutcome.DontVerify)
        }
         else if(primaryEmail == collectedPrimaryEmail){
            nodeState.putShared("verifiedPrimaryEmail",nodeState.get("collectedPrimaryEmail"));
            action.goTo(NodeOutcome.DontVerify)
        }
        else if(primaryEmail != collectedPrimaryEmail){
            // nodeState.putShared("registrationAcceptance","True");
            action.goTo(NodeOutcome.VERIFY)
        }
        else {
            action.goTo(NodeOutcome.ERROR)
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in checkIfEmailAltered function "+error );
        action.goTo(NodeOutcome.ERROR)
    }
}


 
