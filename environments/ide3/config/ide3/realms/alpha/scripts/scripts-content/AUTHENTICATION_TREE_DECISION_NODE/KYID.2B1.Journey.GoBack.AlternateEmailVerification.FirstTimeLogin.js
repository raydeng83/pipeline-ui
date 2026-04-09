/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var firstbackretrylimit = nodeState.get("firstbackretrylimit");  nodeState.putShared("Journey_Phone_Verification","back");
var chooseGoBack = nodeState.get("Alternate_Email_Verification");
//var userInput = nodeState.get("userInput");
logger.debug("chooseGoBack 1 : "+chooseGoBack);
if(chooseGoBack === "back"){
    
    action.goTo("true");
}   else{
    logger.debug("going through false");
    action.goTo("false");
}