/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var firstTimeLoginMFAFlagEnabled = systemEnv.getProperty("esv.firsttime.ismfaenable")
logger.debug("the esv for enforcing the first time MFA is required or not ::"+firstTimeLoginMFAFlagEnabled)
if(firstTimeLoginMFAFlagEnabled === false || firstTimeLoginMFAFlagEnabled === "false"){
logger.debug("First Time Login MFA is not required.")
action.goTo("skipMFA")
} else {
logger.debug("First Time Login MFA is required.")
action.goTo("MFARequired")
}