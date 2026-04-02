var firstTimeLoginFlagEnabled = systemEnv.getProperty("esv.kyid.first.time.login.enabled")
logger.debug("the esv for enforcing the first time login experience::"+firstTimeLoginFlagEnabled)

if(firstTimeLoginFlagEnabled == false || firstTimeLoginFlagEnabled === false || firstTimeLoginFlagEnabled === "false" || (nodeState.get("userType") && nodeState.get("userType").localeCompare("Internal") === 0)){
logger.debug("First Time Login Experience Flag is OFF. Skipping First Time Journey")
nodeState.putShared("skipfirsttimelogin","true")
nodeState.putShared("firsttimeloginjourneyskip", "true")
action.goTo("skipFirstTime")
} else {
logger.debug("First Time Login Experience Flag is ON. Value: "+firstTimeLoginFlagEnabled)
nodeState.putShared("skipfirsttimelogin","false")
nodeState.putShared("firsttimeloginjourneyskip", "false")
nodeState.putShared("flowName","firsttimelogin")
action.goTo("firstTime")
}