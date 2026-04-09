/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("Duplicate Email");
var mail = nodeState.get("objectAttributes").get("mail");
//nodeState.putShared("mail", mail);
var status=nodeState.get("objectAttributes").get("accountStatus");
if(status==="unregistered"){
     var id= nodeState.get("_id");
    openidm.patch("managed/alpha_user/" + id, null, [{"operation":"replace", "field":"accountStatus", "value":"unregistered"}]);
    action.goTo("pass");
}
else{
if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,mail);    
callbacksBuilder.confirmationCallback(0,[ "Try again with different email"],0);
    
}else
{
    var option = callbacks.getConfirmationCallbacks()[0];
    // callbacksBuilder.textOutputCallback(1, typeof option);
// var option = callbacks.get(0).getSelectedIndex();
    if(option === 0)
   
        action.goTo("try again");   
    }
    
}

//callbacksBuilder.textOutputCallback(1,mail);

