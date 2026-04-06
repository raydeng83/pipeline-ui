/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var journeyFlag = systemEnv.getProperty("esv.journey.execution.flag").toLowerCase();

logger.error("checking journey flag")

if (journeyFlag === "true") {
    outcome = "true";
}
else {
    outcome = "false";
}