/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var telephone=nodeState.get("telephoneNumber");

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,telephone);    
callbacksBuilder.confirmationCallback(0,[ "Try again with different Phone Number"],0);
    
}else
{
    var option = callbacks.getConfirmationCallbacks()[0];

    if(option === 0)
    {
        nodeState.putShared("ExistedPhone","true")
        action.goTo("try again");   
    }
    
}