
var domain = nodeState.get("domain").toLowerCase();

logger.error("Printing the domain of the user :::::::::::: " + domain)

nodeState.putShared("domain", domain)

if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();  
  } 





if(extDomain.localeCompare(domain)==0){
    action.goTo("true")
}else{
    action.goTo("false")
}
