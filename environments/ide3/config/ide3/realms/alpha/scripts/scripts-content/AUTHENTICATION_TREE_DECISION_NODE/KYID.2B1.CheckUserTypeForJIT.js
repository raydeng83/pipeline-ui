/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var userType=nodeState.get("userType");
logger.error("UserType:::"+userType)
if(userType=="External"){
       action.goTo("ExtUser")
}
else{
    action.goTo("IntUser")
}

