/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


try{
    var gotoURL = null
    var endUserClient = "endUserUIClient"
    
    if (requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null
        && requestParameters.get("client_id") && requestParameters.get("client_id") != null) {
        
        if(endUserClient === decodeURIComponent(requestParameters.get("client_id").get(0))){
            gotoURL = decodeURIComponent(requestParameters.get("goto").get(0))
            logger.debug("goto URL => "+gotoURL)
            
            if (gotoURL.includes("enduser")) {
                logger.debug("****Redirecting to KYID Sign-In Screen****")
                outcome = "kyid"
            } else {
                logger.debug("****Not an endUser Url****")
                outcome = "true"
            }
        
        } else {
           logger.debug("****Not an endUserClient****") 
           outcome = "true"
        }
 
    }   
    
} catch (error){
    logger.error("Excpetion while reading URL Params- "+error)
    outcome = "true"
}

outcome = "true"
