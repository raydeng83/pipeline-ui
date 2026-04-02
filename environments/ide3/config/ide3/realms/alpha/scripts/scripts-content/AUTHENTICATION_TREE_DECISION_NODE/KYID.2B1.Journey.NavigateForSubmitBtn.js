/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("prevFormPage") === "true"){
    nodeState.putShared("showSubmitBtn","false");
    outcome="Back";    
} else {
    nodeState.putShared("prevFormPage","false");
    outcome="Next";
}
