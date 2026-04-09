/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 var  registerremoveadditionalmfa = nodeState.get("registerremoveadditionalmfa");
if(registerremoveadditionalmfa == "true" ){
outcome = "true";
}
else {
    outcome = "false";
}
