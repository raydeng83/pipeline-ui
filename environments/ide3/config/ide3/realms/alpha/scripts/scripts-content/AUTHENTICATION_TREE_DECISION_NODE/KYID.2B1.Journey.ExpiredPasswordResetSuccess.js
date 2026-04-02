/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var mail =nodeState.get("mail");
logger.debug("&&& mail " + mail);


if (callbacks.isEmpty()) {
  callbacksBuilder.textOutputCallback(0,mail);
   callbacksBuilder.textOutputCallback(0,"You have successfully updated your password");
   callbacksBuilder.confirmationCallback(0, ["Click here to continue"], 0);
}
outcome = "true";
