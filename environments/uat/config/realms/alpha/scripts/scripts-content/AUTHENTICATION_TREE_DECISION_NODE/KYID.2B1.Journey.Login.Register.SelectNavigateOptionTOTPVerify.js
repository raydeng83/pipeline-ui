var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var lib = require("KYID.Library.FAQPages");
var process ="MasterLogin";
var pageHeader= "2_Verify_TOTP";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

if(callbacks.isEmpty()){
    var jsonobj = {"pageHeader": "2_Verify TOTP"};

    callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    
    if(nodeState.get("invalidtotp")){
    errMsg["code"] = "ERR-2FA-TVF-000";
    errMsg["message"] = libError.readErrorMessage("ERR-2FA-TVF-000"); 
    logger.debug("Entered Authenticator TOTP is invalid");   
    callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
		}
    callbacksBuilder.confirmationCallback(0, ["Submit","Back"], 0);
    if (getFaqTopicId != null) {callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"") }
}
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    if(selectedOutcome==1){
        nodeState.putShared("TOTPVerifyNode","back")
        logger.debug("TOTP Selected Back Button");
        nodeState.putShared("invalidtotp",null)
        action.goTo("true")
    }
    else{
        nodeState.putShared("TOTPVerifyNode","next")
        nodeState.putShared("invalidtotp",null)
        logger.debug("TOTP Selected Next Button");
        action.goTo("true")
    }
}
