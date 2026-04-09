if(nodeState.get("postadditionalemail")){
    logger.error("user selected additional email setup")
    var postadditionalemail = nodeState.get("postadditionalemail")
}
if(nodeState.get("postrecoverymfa")){
    logger.error("user selected recovery email or sms setup")
    var postrecoverymfa = nodeState.get("postrecoverymfa")
}
 if(postadditionalemail === "true"){
    logger.error("additional email setup has been found to true")
    nodeState.putShared("postadditionalemail", null)
    action.goTo("additionalEmail")
 } else if (postrecoverymfa === "true"){
    logger.error("recovery email or sms setup has been found to true")
    nodeState.putShared("postrecoverymfa", null)
    action.goTo("recoveryMFASetup")
 } else {
    action.goTo("error")
 }