/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//Main execution

try{

var lib = require("KYID.Library.FAQPages");
var process ="SelfRegistration";
var pageHeader= "3_additional_alternate_email";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

    if (callbacks.isEmpty()) {
        requestCallbacks();
    } 
    else {
        handleUserResponses();
    }
}
catch(e){
    logger.error(e.message);
}



function requestCallbacks() {
    try {
            //callbacksBuilder.textOutputCallback(1, "3_forgot_email")

            //callbacksBuilder.textOutputCallback(0, "We did not find an associated primary email with the information that was provided :[alternate email entered]");
            callbacksBuilder.confirmationCallback(0, ["Yes", "Go back"], 0);
        }
catch (e) {
    logger.error("Error in requestCallbacks: " + e.message);
}
}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

            if(selectedOutcome=== 0){
            action.goTo("True");
            }
            else if(selectedOutcome === 1){
            nodeState.putShared("Go_back","true");
            action.goTo("False");
            }else {
            logger.debug("Unexpected confirmation outcome: " + selectedOutcome);
            action.goTo("False");
        }

    } catch (error) {
        logger.error(":: Error in handleUserResponses: " + error.message);
    }
}