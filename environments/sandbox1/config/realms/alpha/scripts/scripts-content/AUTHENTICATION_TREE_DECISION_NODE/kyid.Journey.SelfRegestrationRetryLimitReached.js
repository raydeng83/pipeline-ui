
// logger.error("*******************comming here**************")

// //var node=nodeState.get("Additional_Email") //changes
// if (callbacks.isEmpty()) {
//  //if(node!=null){  //changes
// callbacksBuilder.textOutputCallback(1,"Maximum_Limit_Reached")
//     logger.error("OTP  validation failed - Max Retry Limit Reached");
//     action.goTo("true");
//  }
//     else {
//   //  logger.error("*******************comming else**************")
// callbacksBuilder.textOutputCallback(1,"Maximum_Limit_Reached")

// logger.error("OTP  validation failed - Max Retry Limit Reached"); 
// action.goTo("true"); 
//             logger.error("*******************comming false**************")

// } 

// //}
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


logger.error("*******************comming here**************")
//changes
if (callbacks.isEmpty()) {
   //changes
callbacksBuilder.textOutputCallback(1,"maximum_limit_reached")
    logger.error("OTP  validation failed - Max Retry Limit Reached");
    nodeState.remove("Secondary_Email")

    action.goTo("true");
 
} 
else{
    logger.error("Maximum_Limit_Reached"); 
    nodeState.remove("Secondary_Email")
    action.goTo("true");

}
