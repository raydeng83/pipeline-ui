var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Validate Temporary Password in AD",
    script: "Script",
    scriptName: "KYID.Journey.ValidateTempPwdExistInAD",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingInternalDomain: "Missing Internal Domain Details",
    missingExternalDomain: "Missing External Domain Details",
    missingEmail: "Missing email",
    missingCreds: "Missing credentials",
    missingKOGID: "Missing KOGID for KOG User",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    ldapConnSuccess: "Connected to AD successfully",
    pwdVerifySuccess: "Successfully validated password in AD",
    pwdExpired: "PasswordExpiredException",
    pwdExpiredUsrErr: "PasswordExpiredException",
    inActiveUsrErr: "Invalid",
    idmQueryFail: "IDM query operation failed",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    ERROR: "connFail",
    FAIL_INACTIVE: "failOrInactive"
};

// Declare Global Variables
var missingInputs = [];
var extDomain = "";
var intDomain = "";
var email = nodeState.get("mail").toLowerCase();
var domain = "eide.extdev.ky.gov";
var windowsaccountname = "";
var isinternaluser = true;


 // Logging Function
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

if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
  extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();  
}  else {
     missingInputs.push(nodeConfig.missingExternalDomain);
}

if(systemEnv.getProperty("esv.kyid.int.ad.domain") && systemEnv.getProperty("esv.kyid.int.ad.domain")!=null) {
  intDomain = systemEnv.getProperty("esv.kyid.int.ad.domain").toLowerCase();  
}  else {
     missingInputs.push(nodeConfig.missingInternalDomain);
}

if(extDomain.localeCompare(domain)==0){
    isinternaluser = false;
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
     var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
    }  else {
     missingInputs.push(nodeConfig.missingConnectorInfo);
    }
    
    if(systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr")!=null) {
     var UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");   
    }  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
    }
    
} else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(systemEnv.getProperty("esv.kyid.int.connector") && systemEnv.getProperty("esv.kyid.int.connector")!=null) {
     var ConnectorName = systemEnv.getProperty("esv.kyid.int.connector").toLowerCase();    
    }  else {
     missingInputs.push(nodeConfig.missingConnectorInfo);
    }
    
    if(systemEnv.getProperty("esv.kyid.int.connector.attr") && systemEnv.getProperty("esv.kyid.int.connector.attr")!=null) {
     var UserNameAttribute = systemEnv.getProperty("esv.kyid.int.connector.attr");   
    }  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
    }
}


// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {

    try{
         var query = {_queryFilter: UserNameAttribute+` eq "`+email+ `"`,}
        // Query to check if user exists in AD
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
     } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
        action.goTo(nodeOutcome.ERROR);
     }
    
     
     if(ldapUserQuery.result.length>0) {
        var ldapUser = ldapUserQuery.result[0];
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userFound+"::"+JSON.stringify(ldapUser));
         
        //Checks if pwdLastSet flag in AD is set to 0  
        if(ldapUser.pwdLastSet.trim().localeCompare("0")!=0){
            var systemUser = `system/`+ConnectorName+`/User/bdeb2208-718d-42c4-9f36-61bc465e5617`;  
             //var systemUser = `system/`+ConnectorName+`/User`; 
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+systemUser);
            nodeLogger.error("pwdLastSet:"+ldapUser.pwdLastSet.trim()); 
             try { 
                 // openidm.patch(systemUser, "null", [{"operation":"replace", "field":"accountExpires", "value":"0"}]);
                 // openidm.patch(systemUser, "null", [{"operation":"replace", "field":"__PASSWORD_EXPIRED__", "value":"FALSE"}]);
                   // openidm.patch(systemUser, "null", [{"operation":"replace", "field":"pwdLastSet", "value":"2024-09-16T13:47:46Z"}]);
                 openidm.patch(systemUser, "changePassword", [{"operation":"replace", "field":"/__PASSWORD__", "value":"Dy2+g#T3"}]);
                   logger.error("Change pwd is successful")
                 action.goTo(nodeOutcome.SUCCESS);
             } catch(error) {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
                action.goTo(nodeOutcome.ERROR);    
             }  
            
        } else {
            nodeLogger.error("pwdLastSet:"+ldapUser.pwdLastSet.trim())
            action.goTo(nodeOutcome.SUCCESS);
        }      
        
    } else {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName
                      +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound);
         action.goTo(nodeOutcome.FAIL_INACTIVE);
    }

   
}


