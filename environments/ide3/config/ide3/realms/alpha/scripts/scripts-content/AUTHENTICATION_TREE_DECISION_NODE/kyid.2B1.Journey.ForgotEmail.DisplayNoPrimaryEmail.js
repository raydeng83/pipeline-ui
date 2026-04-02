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
        var lib = require("KYID.2B1.Library.GenericUtils");
        var obj = "KYID Helpdesk";
        var helpdeskItem = lib.getHelpdeskContactInfo(obj);
        var contacts = JSON.parse(helpdeskItem);

        var helpdeskObj = {
            "helpDeskEmail": contacts.helpDeskEmail,
            "helpDeskNumber": contacts.helpDeskNumber
         }
    
        var headerObj = {
            "pageHeader": "3_forgot_email"
        }

        callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
        callbacksBuilder.textOutputCallback(2, JSON.stringify(helpdeskObj))
        //callbacksBuilder.textOutputCallback(0, "We did not find an associated primary email with the information that was provided :[alternate email entered]");
        callbacksBuilder.confirmationCallback(0, ["Retry_another_method"], 0);
        if (getFaqTopicId != null) {
            callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
        }

    } catch (e) {
        logger.error("Error in requestCallbacks: " + e.message);
    }
}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; 
        if(selectedOutcome === 0){
            logger.debug("Inside_Retry_another_method");
            nodeState.putShared("Retry_another_method","Retry_another_method");
            action.goTo("True");
            }else {
            logger.debug("Unexpected confirmation outcome: " + selectedOutcome);
            action.goTo("True");
        }

    } catch (error) {
        logger.error(":: Error in handleUserResponses: " + error.message);
    }
}