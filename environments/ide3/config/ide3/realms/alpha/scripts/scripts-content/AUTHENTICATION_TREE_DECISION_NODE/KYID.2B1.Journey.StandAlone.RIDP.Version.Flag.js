/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

function main(){
    var response = null;
    var version = null;
    try{
        response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.error("response from query :: " + JSON.stringify(response))
        version = response.result[0].ridp_standalone_version_bsp;
        logger.error("response from query :: " + version)
        if(version == "v1"){
           action.goTo("v1")
        }else{
           action.goTo("v2");
        }
    }catch(error){
        logger.error("error :: " + error)
        action.goTo("v2");
    }
}

main();