/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("**Starting Script**");

if (callbacks.isEmpty()) {
  callbacksBuilder.textInputCallback("Enter Email or Phone")
  action.goTo("true");
} else {
  var userInput = callbacks.getTextInputCallbacks()[0];
  nodeState.putShared("username", userInput);
    function isEmail(userInput) {
  return userInput.includes("@");
}
var searchAttribute = isEmail(userInput) ? "mail" : "mobile";
nodeState.putShared("searchAttribute", searchAttribute);
nodeState.putShared(searchAttribute, userInput);
}
