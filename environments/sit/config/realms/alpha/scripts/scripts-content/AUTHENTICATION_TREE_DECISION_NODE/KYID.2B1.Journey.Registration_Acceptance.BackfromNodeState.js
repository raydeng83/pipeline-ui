if(nodeState.get("postadditionalemail")){
    logger.debug("user selected additional email setup")
    var postadditionalemail = nodeState.get("postadditionalemail")
}
if(nodeState.get("postrecoverymfa")){
    logger.debug("user selected recovery email or sms setup")
    var postrecoverymfa = nodeState.get("postrecoverymfa")
}
 if(postadditionalemail === "true"){
    logger.debug("additional email setup has been found to true")
    nodeState.putShared("postadditionalemail", null)
    nodeState.putShared("CollectPasswordAlternateEmail","back")
    action.goTo("additionalEmail")
 } else if (postrecoverymfa === "true"){
    logger.debug("recovery email or sms setup has been found to true")
    nodeState.putShared("postrecoverymfa", null)
    nodeState.putShared("CollectPasswordPhoneEmail","back")
    action.goTo("recoveryMFASetup")
 } else {
    action.goTo("error")
 }