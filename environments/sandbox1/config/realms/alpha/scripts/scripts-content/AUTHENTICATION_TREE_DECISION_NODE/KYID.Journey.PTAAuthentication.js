/**
 * Function: KYID.Journey.PTAAuthentication
 * Description: This script is used to authenticate password in Active Directory.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "PTA Authentication in AD",
    script: "Script",
    scriptName: "KYID.Journey.PTAAuthentication",
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
    pwdVerifySuccess: "Successfully validated credentials against AD",
    pwdExpired: "PasswordExpiredException",
    pwdExpiredUsrErr: "PasswordExpiredException",
    inActiveUsrErr: "Invalid",
    idmQueryFail: "IDM query operation failed",
    idmPatchSuccess: "IDM patch operation success for user with temporary password",
    idmPatchFail: "IDM patch operation failed for user with temporary password",
    tempUsrDetail: "User details in AD",
    pwdLastSet: "Value of pwdLastSet",
    authnTempUser: "Reauthenticating user with temporary credentials",
    authnTempUserSuccess: "Successfully validated temporary credentials against AD",
    authnTempUserFail: "Temporary credentials validation failed against AD",
    ConnectorName: "ConnectorName",
    missingDomain: "Missing user domain",
    windowsaccountnameIntPrefix: "windowsaccountnameIntPrefix",
    passwordExpiredLogger: "Password is Expired -> User need to Reset the Password ",
    ivalidPassowedLogger: "Inside Invalid Password -> Invalid Password",
    TempPasswordLogger: "Inside Temp Password -> User needs to reset the password in next logon",
    UnexpectedErrorLogger: "An unexpected error has occurred while processing the request.  Please try login again.",
    InternalUsrADLockoutErrorLogger:"As per the Commonwealth policy, you need to reset your password using the following link.",
    ExternalUsrADLockoutErrorLogger:"The email or password you entered is invalid. Please reenter the email and password and try again.",
    envType: "EnvType",
    upn: "userPrincipalName",
    missingEnvType: "Missing Environment Type Details",
    missingUPN: "Missing UPN",
    ldapQuery: "ldapQuery",
    ldapQueryTotalRecords: "Total Records",
    ldapQueryPrintRecords: "List of Records",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    ERROR: "connFail",
    PWD_EXPIRE: "pwdExpire",
    INT_USR_LOCKOUT:"IntUserlockout",
    INT_USR_LOCKOUT_NON_PROD:"IntUserlockoutNonProd",
    EXT_USR_LOCKOUT:"ExtUserlockout",
    FAIL_INACTIVE: "failOrInactive"
};

// Declare Global Variables
var missingInputs = [];
var extDomain = null;
var intDomain = null;
var upn = null;
var email = null
var domain = null;
var windowsaccountname = null;
var ConnectorName = null;
var UserNameAttribute = null;
var password = null;
var envType = null;
var query = null;
var result = {};
var windowsaccountnameIntPrefix = null;
var isinternaluser = true;
var EmailAddress = null;



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


if(systemEnv.getProperty("esv.environment.type") && systemEnv.getProperty("esv.environment.type")!=null) {
    envType = systemEnv.getProperty("esv.environment.type"); 
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType+"::Email::"+nodeState.get("mail"));
}  else {
     missingInputs.push(nodeConfig.missingEnvType);
}

if(nodeState.get("domain") && nodeState.get("domain")!=null){
    domain = nodeState.get("domain").toLowerCase();    
    if(envType.localeCompare("nonProduction")==0) {
        windowsaccountnameIntPrefix = "CHFS";
    } else {
         windowsaccountnameIntPrefix = domain.split(".")[0].toUpperCase();
    }   
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.windowsaccountnameIntPrefix+"::"+windowsaccountnameIntPrefix+"::Email::"+nodeState.get("mail"));
}  else {
     missingInputs.push(nodeConfig.missingDomain);
} 

if(nodeState.get("UPN") != null && typeof nodeState.get("UPN") != "undefined") {
    upn = nodeState.get("UPN").toLowerCase(); 
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.upn+"::"+upn+"::Email::"+nodeState.get("mail"));
}  else {
     missingInputs.push(nodeConfig.missingUPN);
}
                      
if(nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();      
}  else {
     missingInputs.push(nodeConfig.missingEmail);
}

if(nodeState.get("password")) {
    password = nodeState.get("password");  
}  else {
     missingInputs.push(nodeConfig.missingCreds);
}

if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();  
}  else {
     missingInputs.push(nodeConfig.missingExternalDomain);
}

if(systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr")!=null) {
    UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");   
}  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
}


if(extDomain.localeCompare(domain)==0){
    isinternaluser = false;
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(domain && domain!=null){
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs+"::Email::"+nodeState.get("mail"));
    action.goTo(nodeOutcome.ERROR);

} else {
    nodeState.putShared("isinternaluser",isinternaluser);
    //ConnectorName="kyid";
    result = queryLDAP(ConnectorName,"userPrincipalName",upn);

    if(result.records===-1){
        action.goTo(nodeOutcome.ERROR);
        
    } else {  
        if(result.records===0){
            result = queryLDAP(ConnectorName,UserNameAttribute,email);
        }
            
         if(result.records>0) {
            var ldapUser = result.data;
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userFound+"::"+JSON.stringify(ldapUser));
            nodeState.putShared("firstName",ldapUser.givenName);
            nodeState.putShared("lastName",ldapUser.sn); 
            nodeLogger.error("isinternaluser:"+isinternaluser);
             
            if(ldapUser.__LOCK_OUT__){
             if(isinternaluser){
                    if(envType.localeCompare("nonProduction")==0) {  
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.InternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail"));  
                    action.goTo(nodeOutcome.INT_USR_LOCKOUT_NON_PROD);
                     }
                    else{
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.InternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail"));  
                    action.goTo(nodeOutcome.INT_USR_LOCKOUT);
                    }
                
                }
                else{
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.ExternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail"));
                action.goTo(nodeOutcome.EXT_USR_LOCKOUT);
                }
           }
            else
            {
            if(isinternaluser){
                windowsaccountname = windowsaccountnameIntPrefix+"\\" + ldapUser.sAMAccountName;
                 nodeLogger.error("windowsaccountname: "+windowsaccountname)
            } else {
                windowsaccountname = "CIT\\" + ldapUser.sAMAccountName;
                 nodeLogger.error("windowsaccountname: "+windowsaccountname)
            }

            nodeState.putShared("windowsaccountname",windowsaccountname);
            
            var systemUser = `system/`+ConnectorName+`/User`; 
            try {
                var ret1 = openidm.action('endpoint/authenticate', 'authenticate', { username: ldapUser.sAMAccountName, password: password, resource: systemUser });
                if(ret1.code== 0){
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.pwdVerifySuccess+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.SUCCESS).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                }   
                else if(ret1.code== -2){
                    var TempPassword = nodeState.get("password");
                    nodeState.putShared("TempPassword", TempPassword); 
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.TempPasswordLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                }
                else if(ret1.code== -3){
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.ivalidPassowedLogger);
                    action.goTo(nodeOutcome.FAIL_INACTIVE);            
                }
                else if (ret1.code== -4){
                    var TempPassword = nodeState.get("password");
                    nodeState.putShared("TempPassword", TempPassword); 
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.passwordExpiredLogger);
                     action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                }
                else if (ret1.code == -1){
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.UnexpectedErrorLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.ERROR);
                }    
                else{
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.UnexpectedErrorLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.ERROR);                   
                }

    
           } catch(error) {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error+"::Email::"+nodeState.get("mail"));
                action.goTo(nodeOutcome.ERROR); } 
             }
             
         } 
         
         else {
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName
                          +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound+"::Email::"+nodeState.get("mail"));
             action.goTo(nodeOutcome.FAIL_INACTIVE);
        }
        
    }  
 
}



function queryLDAP(ConnectorName,UserNameAttribute,UserNameAttributeValue){

    var records = 0;
    var result = {};
    result['records']=records;
    result['data']="No Record Found";
    var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQuery+"::"+JSON.stringify(query));
    
    try{
        // Query to check if user exists in AD
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
         records = ldapUserQuery.result.length;
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records);
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result));
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
     } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error+"::Email::"+nodeState.get("mail"));
         result['records']=-1;
         result['data']=error;        
     }
     nodeLogger.error("LDAP Query result length: "+result.records+"::Email::"+nodeState.get("mail"));
     nodeLogger.error("LDAP Query user data: "+result.data+"::Email::"+nodeState.get("mail"));
     return result;
}
