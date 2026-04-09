/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var MFAMethod=nodeState.get("MFAMethod")
if(MFAMethod==="sms"){
    logger.info("MFA method SMS")
    action.goTo("sms")
}
else
{
    logger.info("MFA method Voice")
    action.goTo("voice")
}