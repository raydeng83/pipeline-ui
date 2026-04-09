/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 *//*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//outcome = "true";
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var Secondary_Email = nodeState.get("objectAttributes").get("Secondary_Email");
//var displayMessage = "<div class='page-element'>You are using your primary mail " + mail.bold() + ". Please use different mail</div>"
//return displayMessage
//var smail = nodeState.get("Secondary_Email");

//nodeState.putShared("mail", mail);

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(0,"Mail is existing. Please use different mail");    
callbacksBuilder.confirmationCallback(0,["Try with different email"],0);
    
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
//callbacksBuilder.textOutputCallback(1,mail);



