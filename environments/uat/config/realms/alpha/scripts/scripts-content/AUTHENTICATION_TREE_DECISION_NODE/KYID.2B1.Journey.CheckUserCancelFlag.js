/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

if(nodeState.get("usercancel") === "true"){
    logger.debug("Inside user cancel option - true")
     action.goTo(nodeOutcome.SUCCESS);
    //outcome = "true";
 
}else{
    logger.debug("inside user cancel - false")
     action.goTo(nodeOutcome.ERROR);
    //outcome = "false";
}


