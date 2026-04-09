/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".*/
var mail = nodeState.get("objectAttributes").get("mail");
//nodeState.putShared("mail", mail);


callbacksBuilder.textOutputCallback(1,"A six digit code have sent to "+mail+".Enter the code below to verify the Email");
action.goTo("true")
