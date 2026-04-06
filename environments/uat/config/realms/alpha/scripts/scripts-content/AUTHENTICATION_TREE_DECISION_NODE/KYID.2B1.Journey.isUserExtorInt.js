if(nodeState.get("domain")){
    var domain = nodeState.get("domain").toLowerCase();

    logger.debug("Printing the domain of the user :::::::::::: " + domain)
    
    nodeState.putShared("domain", domain)
    
    if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
        extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();  
      } 
       
    if(extDomain.localeCompare(domain)==0){
        nodeState.putShared("typeofuser","External")
        action.goTo("true")
    }else{
        nodeState.putShared("typeofuser","Internal")
        action.goTo("false")
    }
} else {
    action.goTo("true")
}