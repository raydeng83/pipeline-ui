var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var pointerFlag = null;

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Password Collector Node",
    script: "Script",
    scriptName: "KYID.2B1.Login.Collect.Password",
    timestamp: dateTime,
    errorId_emailValidation: "errorID:KYID007",
    errorId_InvalidPhoneNumber: "errorID::KYID011",
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
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};


function requestCallbacks() {
    try {

 var jsonobj = {
                "pageHeader": "2_Enter_Password"
            };
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));

            logger.error("entering requestCallbacks")
            callbacksBuilder.passwordCallback("Password", false);
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);

        
        if (nodeState.get("failedOrInactive")) {
            logger.error("Failed or Inactive status inside password collector" + nodeState.get("failedOrInactive"));
            logger.error("Failed or Inactive state");
            var invalidDetails = nodeState.get("failedOrInactive");
            nodeState.putShared("failedOrInactive", null);
            //nodeState.putShared("accountDisabled", null);
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + invalidDetails + `</div>`);
            /* if(nodeState.get("InternalUserLckOutNonProd")!=null && nodeState.get("InternalUserLckOutNonProd")=="true"){
                callbacksBuilder.textOutputCallback(0,"UserENV:NonProdInternalUser");
                nodeState.putShared("InternalUserLckOutNonProd",null)
            }
            if(nodeState.get("InternalUserLckOutProd")!=null && nodeState.get("InternalUserLckOutProd")=="true"){
                callbacksBuilder.textOutputCallback(0,"UserENV:ProdInternalUser");
                nodeState.putShared("InternalUserLckOutProd",null)
            }*/
        }

        else if (nodeState.get("accountDisabled")) {
            logger.error("Disabled status inside password collector" + nodeState.get("accountDisabled"));
            logger.error("Disabled state");
            var invalidDetails = nodeState.get("accountDisabled");
            nodeState.putShared("accountDisabled", null);
            // nodeState.putShared("failedOrInactive", null);
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + invalidDetails + `</div>`);
            
        }
           

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error inRequestCallbacks" + error);
        //nodeState.putShared("False",pointerFlag)
        nodeState.putShared("pointerFlag", "False")
        action.goTo(NodeOutcome.TRUE);

    }
}

function handleUserResponses() {
    try {

        //var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        var password = callbacks.getPasswordCallbacks().get(0);

        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SelectedOutcome::" + selectedOutcome);


        if (selectedOutcome === 1) {
            //nodeState.putShared("Back",pointerFlag);
            nodeState.putShared("pointerFlag", "Back")
            action.goTo(NodeOutcome.TRUE);
        } else if (selectedOutcome === 0) {

            if (password === null || !password) {
                nodeState.putShared("pointerFlag", "Back")
                action.goTo(NodeOutcome.TRUE);

            } else {
                if (nodeState.get("apireturnederror")) {
                    //requestCallbacks();
                    logger.error("Incorrect email inside username collector" + nodeState.get("apireturnederror"));
                    var invalidEmail = nodeState.get("apireturnederror");
                    //  nodeState.putShared("apireturnederror", null);
                    callbacksBuilder.textOutputCallback(2, `<div class='error-message'>` + invalidEmail + `</div>`);
                } else if (nodeState.get("failedOrInactive")) {
                    //requestCallbacks();
                    logger.error("Incorrect email inside username collector" + nodeState.get("failedOrInactive"));
                    var invalidEmail = nodeState.get("failedOrInactive");
                    nodeState.putShared("failedOrInactive", null);
                    callbacksBuilder.textOutputCallback(2, `<div class='error-message'>` + invalidEmail + `</div>`);

                    /* if(nodeState.get("InternalUserLckOutNonProd")!=null && nodeState.get("InternalUserLckOutNonProd")=="true"){
                         callbacksBuilder.textOutputCallback(0,"UserENV:NonProdInternalUser");
                         nodeState.putShared("InternalUserLckOutNonProd",null)
                     }
                     if(nodeState.get("InternalUserLckOutProd")!=null && nodeState.get("InternalUserLckOutProd")=="true"){
                         callbacksBuilder.textOutputCallback(0,"UserENV:ProdInternalUser");
                         nodeState.putShared("InternalUserLckOutProd",null)
                     }*/
                }
                else if (nodeState.get("accountDisabled")) {
                    //requestCallbacks();
                    logger.error("User Disabled " + nodeState.get("accountDisabled"));
                    var invalidEmail = nodeState.get("accountDisabled");
                      nodeState.putShared("accountDisabled", null);
                    callbacksBuilder.textOutputCallback(2, `<div class='error-message'>` + invalidEmail + `</div>`);
                }
                nodeState.putTransient("password", password);
                logger.error("going to true")
                //nodeState.putShared("True",pointerFlag)
                nodeState.putShared("pointerFlag", "True")
                action.goTo(NodeOutcome.TRUE);
            }
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in HandelUser Response" + error);

        // nodeState.putShared("False",pointerFlag)
        nodeState.putShared("pointerFlag", "False")
        action.goTo(NodeOutcome.TRUE);


    }

}

function main() {
    try {
        if (callbacks.isEmpty()) {

            requestCallbacks();

        } else {
            handleUserResponses();

        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution" + error);
        //nodeState.putShared("False",pointerFlag);
        nodeState.putShared("pointerFlag", "False")
        action.goTo(NodeOutcome.TRUE);

    }

}
main()