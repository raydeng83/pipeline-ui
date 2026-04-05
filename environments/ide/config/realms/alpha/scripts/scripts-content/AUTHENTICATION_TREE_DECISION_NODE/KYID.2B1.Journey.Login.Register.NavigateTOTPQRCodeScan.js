if(nodeState.get("TOTPQRNode") == "back"){
    nodeState.putShared("TOTPQRNode",null);
    nodeState.putShared("BackTOTP", "true");
    nodeState.putShared("BackFromTOTP","true")  
    action.goTo("false")
}else if(nodeState.get("TOTPQRNode") == "skip"){
    action.goTo("skip")
}
else{
     nodeState.putShared("TOTPQRNode",null);
     nodeState.putShared("invalidtotp",null);
     action.goTo("true")
}
