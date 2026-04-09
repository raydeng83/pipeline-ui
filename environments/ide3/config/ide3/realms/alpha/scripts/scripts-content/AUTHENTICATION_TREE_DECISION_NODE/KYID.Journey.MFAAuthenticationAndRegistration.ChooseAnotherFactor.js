/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("anotherFactor") === "anotherFactor"){
    logger.error("Inside another factor in authentication tree")
    nodeState.putShared("recoveryauthmethod", null)
    outcome = "true";
 
}else{
    //logger.error("after authentication")
    outcome = "false";
}
