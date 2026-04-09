/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// var noMFALeftToRemove = "";
if(nodeState.get("noMFALeftToRemove") && nodeState.get("noMFALeftToRemove")!=null){
   var  noMFALeftToRemove = nodeState.get("noMFALeftToRemove");
    logger.error("noMFALeftToRemove  Value is -- " + noMFALeftToRemove)
    outcome = "True"
} else {
    outcome = "False";
}

