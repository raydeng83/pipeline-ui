/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//var hotp=callbacksBuilder.textOutputCallback(0, message);

//var mail = nodeState.get("objectAttributes").get("mail");
//nodeState.putShared("mail", mail);

if(callbacks.isEmpty())
{
callbacksBuilder.textInputCallback("Please enter the HOTP sent to your email", "Verify your email")
// callbacksBuilder.textOutputCallback(1,mail);    
callbacksBuilder.confirmationCallback(0,["Verify","Resend Code", "Use a different email"],0);
    
}
else
{

var hotp=callbacks.getTextInputCallbacks();
    var option = callbacks.getConfirmationCallbacks()[0];
    // callbacksBuilder.textOutputCallback(1, option)
var storedHOTP = nodeState.get("hotp");

    // callbacksBuilder.textOutputCallback(1, typeof option);
// var option = callbacks.get(0).getSelectedIndex();
    if(option == 0)
    {
        if(hotp==storedHOTP){
    action.goTo("Verify");
    }else{
            action.goTo("failed");
    }
        //action.goTo("true");   
    }
    else if(option == 1)
    {
        action.goTo("resend");   
    }else {
        action.goTo("diff");   
    }
    
}
//callbacksBuilder.textOutputCallback(1,mail);

