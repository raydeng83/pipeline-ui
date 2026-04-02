var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Email or Mobile User",
    script: "Script",
    scriptName: "KYID.Journey.EmailMobileSegregation",
    timestamp: dateTime
}

/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};

// Node outcomes
var nodeOutcome = {
    NEWUSER: "newUser",
    SUCCESS: "success",
    INVALIDPASSWORD: "invalidPassword",
    PASSWORDEXPIRED: "passwordExpired",
    FAIL:"fail"
};

var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
var userType = nodeState.get("userType");
var password = nodeState.get("password");
var UserNameAttributeValue;
var query = null;

var UserNameAttribute = nodeState.get("searchAttribute");
  var UserNameAttributeValue;
  if (UserNameAttribute === "mail") {
    UserNameAttributeValue = nodeState.get("mail").trim();
  } else {
    UserNameAttributeValue = nodeState.get("username").trim();
  }
/*var UserNameAttribute = nodeState.get("searchAttribute");
logger.error("UserNameAttribute:"+UserNameAttribute)
if(UserNameAttribute === "mail"){
    //UserNameAttributeValue = nodeState.get("objectAttributes").get("mail").trim();
    UserNameAttributeValue= "MeganEaton@mailinator.com"
}else {
    UserNameAttributeValue = nodeState.get("userMail");
    UserNameAttribute = "mail";
}*/




var result = queryLDAP(ConnectorName,UserNameAttribute,UserNameAttributeValue);
logger.debug("*****result2****"+result);

if(result.length > 0){
      var systemUser = `system/`+ConnectorName+`/User`; 
            try {
                logger.debug("*****result2a****"+result);

                var ret1 = openidm.action('endpoint/authenticate', 'authenticate', { username:result , password:password, resource: systemUser });
                logger.debug("ret1"+ret1.code)
                if(ret1 && ret1.code == 0 && userType === "new"){
                    action.goTo(nodeOutcome.NEWUSER);
                }else if(ret1 && ret1.code == 0){
                   action.goTo(nodeOutcome.SUCCESS);
                }
                else if(ret1 && ret1.code == -3){
                   action.goTo(nodeOutcome.INVALIDPASSWORD);
                }
                else if(ret1 && ret1.code == -4){
                   action.goTo(nodeOutcome.PASSWORDEXPIRED);
                }
                else{
                  logger.debug("Authentication_Failed");
                   action.goTo(nodeOutcome.FAIL);
                }
                
} catch(error) {
               // nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error+"::Email::"+nodeState.get("mail"));
                logger.error("error"+error)
            } 
}


function queryLDAP(ConnectorName,UserNameAttribute,UserNameAttributeValue){
    logger.debug("Inside queryLDAP");
    var records = 0;
    var result = {};
    result['records']=records;
    result['data']="No Record Found";
    var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
    logger.debug("*****values*****"+UserNameAttribute+UserNameAttributeValue+ConnectorName);
    try{
        // Query to check if user exists in AD
         logger.debug("****recordStartings*****"+records)
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
         logger.debug("****ldapUserQuery*****"+ldapUserQuery)
         records = ldapUserQuery.result.length;
        logger.debug("****records*****"+records)
       
        result['records']=records;
        result['data']=ldapUserQuery.result[0];
        var ldapUser = result.data.sAMAccountName;
       
         logger.debug("*****results***** "+ldapUser)
     } catch(error) {
    
         result['records']=-1;
         result['data']=error;        
     }
    
     return ldapUser;
}


// if(result!=null){
//     action.goTo("authenticate")
// }else{
//     action.goTo("none")
// }