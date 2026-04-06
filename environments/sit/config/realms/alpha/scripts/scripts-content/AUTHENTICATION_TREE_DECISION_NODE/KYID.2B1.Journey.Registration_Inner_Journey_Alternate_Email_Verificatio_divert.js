var backretrylimitforphone = nodeState.get("backretrylimitforphone");
var differentemailretrylimit = nodeState.get("differentemailretrylimit")

 if(differentemailretrylimit === "true"){
 action.goTo("true");
 }
else if(nodeState.get("Alternate_Email_Verification")=="back"){
    if(backretrylimitforphone === "true"){
        action.goTo("true");
    }
    else{
    nodeState.putShared("Alternate_Email_Verification",null);
    action.goTo("back");
}
}
else{
    nodeState.putShared("postadditionalemail", "true")
    action.goTo("next");
}