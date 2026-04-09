/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var identityResource= "managed/alpha_user/"+nodeState.get("_id");
var newpassword=nodeState.get("password");
if(newpassword){
    var patchOperation = [
        {
            "operation": "replace",
            "field": "/password",
            "value": newpassword
        },
        {
            "operation": "replace",
            "field": "/description",
            "value": "updated_user"  
        }       
    ];
    try{
        var patchResult = openidm.patch(identityResource, null, patchOperation);
        logger.error("Patch Operation Successfull:"+JSON.stringify(patchResult));
        action.goTo("success")
    }catch(e){
        logger.error("Error Patching Password: "+e)
        action.goTo("fail")
    }
}else{
    logger.error("Password is missing");
     action.goTo("fail");
}



