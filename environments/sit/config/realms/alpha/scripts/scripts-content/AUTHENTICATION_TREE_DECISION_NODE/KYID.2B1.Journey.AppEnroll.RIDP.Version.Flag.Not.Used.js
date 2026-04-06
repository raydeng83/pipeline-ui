
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

function main(){
    var response = null;
    var version = null;
    try{
        if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
            response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
            logger.debug("response from query :: " + JSON.stringify(response))
            version = response.result[0].ridp_app_enroll_version;
            logger.error("KYID.2B1.Journey.AppEnroll.RIDP.Version.Flag response from query :: " + version)
            if(version == "v1"){
               action.goTo("v1")
            }else{
               action.goTo("v2");
            }
        }else{
         outcome = "v1";
        }
    }catch(error){
        logger.error("KYID.2B1.Journey.AppEnroll.RIDP.Version.Flag error :: " + error)
        action.goTo("v2");
    }
}

main();