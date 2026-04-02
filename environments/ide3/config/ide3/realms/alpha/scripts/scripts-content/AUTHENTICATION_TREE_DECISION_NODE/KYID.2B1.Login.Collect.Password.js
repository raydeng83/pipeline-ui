var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Password Collector Node",
    script: "Script",
    scriptName: "KYID.2B1.Login.Collect.Password",
    timestamp: dateTime,
    errorId_emailValidation:"errorID:KYID007",
    errorId_InvalidPhoneNumber:"errorID::KYID011",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "True",
    ERROR: "False",
    BACK: "Back"
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


function requestCallbacks() {
    try {
        var jsonobj = {"pageHeader": "2_Enter_Password"};
           callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
       logger.debug("entering requestCallbacks");
            if(nodeState.get("failedOrInactive")!==null && nodeState.get("failedOrInactive")){
            var invalidEmail = nodeState.get("failedOrInactive");
            nodeState.putShared("failedOrInactive", null);
            callbacksBuilder.passwordCallback("Password", false);
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
            callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`); 
        }
        else if(nodeState.get("accountDisabled")!==null && nodeState.get("accountDisabled")){
            var invalidEmail = nodeState.get("accountDisabled");
            nodeState.putShared("accountDisabled", null);
            callbacksBuilder.passwordCallback("Password", false);
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
            callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`); 
        }
else{
            callbacksBuilder.passwordCallback("Password", false);
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        }
        }


    catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error inRequestCallbacks" +error );
        action.goTo(NodeOutcome.ERROR);

    }
}

function handleUserResponses() {
    try {

        //var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        var password = callbacks.getPasswordCallbacks().get(0); 

        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SelectedOutcome::" + selectedOutcome);

        nodeLogger.debug("Collecting_Password")
        if (selectedOutcome === 1) {
            if(nodeState.get("apireturnederror"))
            {
         nodeState.putShared("apireturnederror", null);
            }
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 0) {

            if (password === null || !password) {    
            action.goTo(NodeOutcome.ERROR);   

     } else {
           if(nodeState.get("apireturnederror"))
        {
        requestCallbacks();  
        logger.debug("Incorrect email inside username collector" +nodeState.get("apireturnederror"));
         var invalidEmail = nodeState.get("apireturnederror");
         //nodeState.putShared("apireturnederror", null);
         callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`);
        }
        else if(nodeState.get("failedOrInactive"))
        {
        requestCallbacks();  
        logger.debug("Incorrect email inside username collector" +nodeState.get("failedOrInactive"));
         var invalidEmail = nodeState.get("failedOrInactive");
         nodeState.putShared("failedOrInactive", null);
         callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`);
        }
        else if(nodeState.get("accountDisabled"))
        {
        requestCallbacks();  
        logger.debug("Incorrect email inside username collector" +nodeState.get("accountDisabled"));
         var invalidEmail = nodeState.get("accountDisabled");
         nodeState.putShared("accountDisabled", null);
         callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`);
        }

        
         nodeState.putTransient("password", password); 
         action.goTo(NodeOutcome.TRUE);
     }
        }

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in HandelUser Response" +error );
        action.goTo(NodeOutcome.ERROR);


    }

}
function main() {
    try {
        if (callbacks.isEmpty()) {
            requestCallbacks();

        }
        else {
            handleUserResponses();

        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution" +error );
        action.goTo(NodeOutcome.ERROR);

    }

}
main()