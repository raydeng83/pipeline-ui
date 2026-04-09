logger.error("**Starting Script**");

if (callbacks.isEmpty()) {
  callbacksBuilder.textInputCallback("Enter Email or Phone")
  callbacksBuilder.textInputCallback("Enter Password")
  action.goTo("true");
} else {
  var userInput = callbacks.getTextInputCallbacks()[0];
  var password = callbacks.getTextInputCallbacks()[1];
  nodeState.putShared("username", userInput);
  nodeState.putShared("password", password);
    function isEmail(userInput) {
  return userInput.includes("@");
}
var searchAttribute = isEmail(userInput) ? "mail" : "mobile";
nodeState.putShared("searchAttribute", searchAttribute);
nodeState.putShared(searchAttribute, userInput);
if (searchAttribute === "mail") {
  logger.error("**Ending Script**");
  action.goTo("mail");
} else {
  logger.error("**Ending Script**");
  action.goTo("mobile");
}
}
