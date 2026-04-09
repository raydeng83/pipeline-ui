/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var ridpFlag = systemEnv.getProperty("esv.ridp.forgot.authenticator.version.flag").toLowerCase();

logger.debug("RIDP flag in KYID.2B1.Journey.Recovery.RIDP.Version.Flag is :: " + ridpFlag)

if (ridpFlag === "v1") {
    outcome = "v1";
}else if(ridpFlag === "v2") {
    outcome = "v2";
}else{
    logger.error("ridp flag not set properly going to v1")
    outcome = "v2";
}