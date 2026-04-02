/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
function main(){
    var journey = null;
    try{
        logger.debug("Journey_Phone_Verification is :: "+ nodeState.get("Journey_Phone_Verification"))
        var journey = nodeState.get("ridpJourneyName");
        nodeState.putShared("journeyName",journey);
        if(nodeState.get("loginFlag")=="true"){
           nodeState.putShared("journeyName","RIDP_LoginMain")
        }
        
        if(nodeState.get("Journey_Phone_Verification") === "skip"){
         action.goTo("skip");
        }else if(nodeState.get("Journey_Phone_Verification") === "back"){
            action.goTo("back");
        }else{
             action.goTo("next");
        }
    }catch(error){
        logger.error("error in catch of KYID.2B1.Journey.RIDP.Phone.Divert :: "+ error)
        action.goTo("back");
    }
}

main()
