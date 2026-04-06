/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
if(nodeState.get("outcome") != null){
if (nodeState.get("outcome") == "false"){
    outcome = "false";
}
else{
  outcome = "true";  
}
}
else{
    outcome = "true";  
}
// outcome = "true";
