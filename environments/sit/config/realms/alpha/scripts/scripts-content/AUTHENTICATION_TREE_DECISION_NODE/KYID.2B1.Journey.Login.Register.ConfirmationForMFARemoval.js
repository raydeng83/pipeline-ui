var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
try {
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {

}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        errMsg["code"] = "WRN-MFA-REM-00";
        errMsg["message"] = libError.readErrorMessage("WRN-MFA-REM-00"); 
        errMsg["MFAMethod"] =  nodeState.get("selctedMFAtoRemove");
        // nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
            
        callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg));
        // callbacksBuilder.textOutputCallback(0, "mfaMethod: "+ nodeState.get("selctedMFAtoRemove"));
        var selfEnrollOptions = ["true", "false"];
        callbacksBuilder.confirmationCallback(0, ["Yes,Remove_Method","No,Go_Back"], 0);
        

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses(){
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            // nodeState.putShared("selctedMFAtoRemove",null);
            action.goTo("True");
        }
        else if(selectedOutcome === 1){
            nodeState.putShared("selctedMFAtoRemove",null);
            action.goTo("False");
         
        }
    } catch (error) {
        logger.error("Error Occurred "+error)
        
    }
}