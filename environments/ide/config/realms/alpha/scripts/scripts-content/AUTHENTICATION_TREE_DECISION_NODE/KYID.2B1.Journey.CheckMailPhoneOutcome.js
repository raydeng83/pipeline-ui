if(nodeState.get("outcome") != null){
if (nodeState.get("outcome") == "mail"){
    nodeState.putShared("outcome",null)
    action.goTo("mail")
}
else if (nodeState.get("outcome") == "phone"){
    nodeState.putShared("outcome",null)
   action.goTo("phone")
}
}
else{
     action.goTo("error")
}