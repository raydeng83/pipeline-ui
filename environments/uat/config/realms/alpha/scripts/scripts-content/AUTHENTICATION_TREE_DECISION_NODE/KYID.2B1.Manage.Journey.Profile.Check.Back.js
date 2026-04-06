/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
if(nodeState.get("IDProofingAnotherMethod")==="true"){
    nodeState.putShared("IDProofingAnotherMethod",null)
     logger.error("KYID.2B1.Manage.Journey.Profile.Check.Back:::anotherMethod")
    action.goTo("anotherMethod")
    //outcome = "anotherMethod"
}
else if(nodeState.get("isback")=== true){
    action.goTo("back")
   // outcome = "back";
}
else if(nodeState.get("Back")== true){
    action.goTo("back")
    //outcome = "back";
}
else{
    logger.error("KYID.2B1.Manage.Journey.Profile.Check.Back:::NExt")
    action.goTo("next")
     //outcome = "next";
}

