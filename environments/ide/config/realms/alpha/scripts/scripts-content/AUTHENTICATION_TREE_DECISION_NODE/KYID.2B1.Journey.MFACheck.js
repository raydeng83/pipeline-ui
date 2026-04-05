/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


if(nodeState.get("firstTimeLoginPerformed") === "true"){
    logger.debug("User coming from first time login journey")
   //   nodeState.putShared("requiredMFAMethod","4");
    
   // nodeState.putShared("appRequiredMFACode","4");
    
   
    action.goTo("firstTimeMFACheck")
}
else {
    action.goTo("MFACheck")
}
