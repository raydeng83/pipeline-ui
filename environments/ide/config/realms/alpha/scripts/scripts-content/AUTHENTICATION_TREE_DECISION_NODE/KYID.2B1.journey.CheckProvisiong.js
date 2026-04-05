logger.debug("API Polling Scipt Invoked")
// var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
var ConnectorName= "kydevdevkygov";
var UserNameAttribute = "mail";
// var UserNameAttributeValue= "InternalDEVTestUser@mailinator.com";
UserNameAttributeValue =nodeState.get("objectAttributes").get("mail")

try {
   var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
  var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
logger.debug("ldapUserQuery is "+JSON.stringify(ldapUserQuery) )
    

var records = ldapUserQuery.result.length;
    logger.debug("ldapUserQuery is "+records )

if (records>0){
  // ldapUserQuery= JSON.stringify(ldapUserQuery)
  logger.debug("Member Of  "+(ldapUserQuery.result[0].memberOf) );
  var memberOf = JSON.stringify(ldapUserQuery.result[0].memberOf);
  var groupDN = nodeState.get("entitlementName");
  logger.debug("Group DN is :: "+groupDN );
  if (memberOf.includes(groupDN)){
      logger.debug("Entitlement Provisioned")
        outcome="userProvisioned"
  }
  
else{
    outcome = "userNotProvisioned"
}
}
else{
    outcome = "userNotFound"
}
    
} catch (error) {
    logger.error("ldapUserQuery is "+error )
    outcome = "false"
    
}

