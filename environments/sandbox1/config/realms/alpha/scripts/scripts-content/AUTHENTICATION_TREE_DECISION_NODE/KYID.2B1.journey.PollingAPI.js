logger.error("API Polling Scipt Invoked")
var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
var UserNameAttribute = "mail";
// var UserNameAttributeValue= "DEVTestUser02@mailinator.com";
UserNameAttributeValue =nodeState.get("objectAttributes").get("mail")

try {
   var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
  var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
logger.error("ldapUserQuery is "+ldapUserQuery )

var records = ldapUserQuery.result.length;
    logger.error("ldapUserQuery is "+records )

if (records>0){
    outcome="true"
}

else{
    outcome = "false"
}
    
} catch (error) {
    logger.error("ldapUserQuery is "+error )
    outcome = "false"
    
}

