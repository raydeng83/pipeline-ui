if (requestCookies.get("OIDCFirstPhaseCompleted")){
var OIDCFirstPhaseCompleted = requestCookies.get("OIDCFirstPhaseCompleted")
if ( OIDCFirstPhaseCompleted = "true"){
    logger.error("start");
outcome = "true"
} else {
outcome = "false"
}
} else {
outcome = "false"
}
