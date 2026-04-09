/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(0,"Phone no is existing. Please use different Phone no");    
callbacksBuilder.confirmationCallback(0,["Try with different Phone no"],0);
    
}else
{
    var option = callbacks.getConfirmationCallbacks()[0];
   // callbacksBuilder.textOutputCallback(1, typeof option);
// var option = callbacks.get(0).getSelectedIndex();
    if(option === 0)
    {
        //action.goTo("sign in");   
    
        action.goTo("true");   
    }
    
}