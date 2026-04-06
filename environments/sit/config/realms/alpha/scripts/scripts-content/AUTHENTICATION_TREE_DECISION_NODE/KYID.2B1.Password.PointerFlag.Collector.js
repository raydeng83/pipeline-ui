var pointerFlag = nodeState.get("pointerFlag");
 nodeState.putShared("V3Captcha",null)
if(pointerFlag === "True"){
    logger.debug("pointer is true")
    nodeState.putShared("pointerFlag",null);
outcome = "true";
}
else if(pointerFlag === "False"){
    logger.debug("pointer is false")
    nodeState.putShared("pointerFlag",null);
    outcome = "false"
}
// else (pointerFlag === "Back"){
else {
    logger.debug("pointer is back")
    nodeState.putShared("pointerFlag",null);
    outcome = "back"
}