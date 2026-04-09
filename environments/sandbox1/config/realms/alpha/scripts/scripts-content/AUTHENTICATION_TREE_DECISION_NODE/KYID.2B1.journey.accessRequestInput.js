logger.error("**Starting Script**")

if(callbacks.isEmpty()){
    callbacksBuilder.textInputCallback("Enter Email ID")
    callbacksBuilder.textInputCallback("Enter Group DN");
    
}else{
     var mail = callbacks.getTextInputCallbacks()[0];
     var entitlementName = callbacks.getTextInputCallbacks()[1];
     // nodeState.putShared("mail",mail);
    nodeState.putShared("objectAttributes", {"mail": mail}); 
     nodeState.putShared("entitlementName",entitlementName); 
    logger.error("Email Id is ::" + nodeState.get("mail") + "Entitlement Name is "+nodeState.get("entitlementName") )
    action.goTo("true");
}