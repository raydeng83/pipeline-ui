/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
if (callbacks.isEmpty()) {
    var jsonobj = {"pageHeader": "Password_Reset_Successfully"};
    callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
    //callbacksBuilder.textOutputCallback(0,"Password Reset Successfully");
    
}
outcome = "true";
