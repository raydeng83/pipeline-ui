/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("*************************sma/voice****************************************")
var MFAMethod=nodeState.get("MFAMethod");
if(MFAMethod==="sms"){
    action.goTo("SMS");
}
else{
    action.goTo("Voice")
}
logger.error("*************************sma/voice complete****************************************")
