var userId = nodeState.get("userIDinSession");
var roleId = nodeState.get("roleIDinSession");
logger.debug("RoleId is --"+roleId);
var response = null;
var roleIds = [];
var result = false;


try {
    response = openidm.query("managed/alpha_user/"+userId+"/roles", { "_queryFilter" : "true"}, ["_refResourceId"]);
    logger.debug("Response is --"+ response);
    if(response && response.resultCount>0){
        for (var i=0 ; i< response.resultCount; i++) {
            // roleIds.push(response.result[i]._id);
            if(roleId === response.result[i]._refResourceId){
                result = true;
                break;
            }
            
        }
        if(result){
            // result= true;
            action.goTo(result);
        }
        else{
            action.goTo(result);
        }
        
    }
    else{
        action.goTo(result);
    }
} catch (error) {
    logger.error("Error Occurred while checking role in user -- "+ error);
    action.goTo("error");
}
