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
var attrPwd = null;
var envType = null;
var query = null;
var result = {};
var windowsaccountnameIntPrefix = null;
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

if(systemEnv.getProperty("esv.environment.type") && systemEnv.getProperty("esv.environment.type")!=null) {
    envType = systemEnv.getProperty("esv.environment.type"); 
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType);
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
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.windowsaccountnameIntPrefix+"::"+windowsaccountnameIntPrefix);
}  else {
     missingInputs.push(nodeConfig.missingDomain);
} 

if(nodeState.get("UPN") != null && typeof nodeState.get("UPN") != "undefined") {
    upn = nodeState.get("UPN").toLowerCase(); 
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.upn+"::"+upn);
}  else {
     missingInputs.push(nodeConfig.missingUPN);
}
                      
if(nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();      
}  else {
     missingInputs.push(nodeConfig.missingEmail);
}

if(nodeState.get("password")) {
    attrPwd = nodeState.get("password");  
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
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(domain && domain!=null){
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    nodeState.putShared("isinternaluser",isinternaluser);
    result = queryLDAP(ConnectorName,"userPrincipalName",upn);

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
         
        if(isinternaluser){
            windowsaccountname = windowsaccountnameIntPrefix+"\\" + ldapUser.sAMAccountName;
             nodeLogger.error("windowsaccountname: "+windowsaccountname)
        } else {
            windowsaccountname = "CIT\\" + ldapUser.sAMAccountName;
             nodeLogger.error("windowsaccountname: "+windowsaccountname)
        }

        var systemUser = `system/`+ConnectorName+`/User`; 
        try {
            openidm.action(systemUser, "authenticate", {"username" : ldapUser.sAMAccountName, "password" : attrPwd});
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.pwdVerifySuccess);
            action.goTo(nodeOutcome.SUCCESS).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
            
        } catch(error) {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
            var adConnFailErr = error.message;
            if(adConnFailErr.includes(nodeConfig.pwdExpiredUsrErr)){
                action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
            
            } else if(adConnFailErr.includes(nodeConfig.inActiveUsrErr)){
                if(ldapUser.pwdLastSet.trim().localeCompare("0")==0){
                    if(patchPwdLastSet(ConnectorName,ldapUser,attrPwd)){                          
                        action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                    } else {
                        action.goTo(nodeOutcome.ERROR);
                    }
                } else{
                    action.goTo(nodeOutcome.FAIL_INACTIVE);
                }         
            
            } else {
                action.goTo(nodeOutcome.ERROR);
            }       
        }             
        
    } else {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName
                      +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound+"::"+JSON.stringify(ldapUserQuery.result));
         action.goTo(nodeOutcome.FAIL_INACTIVE);
    }
 
}


function patchPwdLastSet(ConnectorName,ldapUser,password){
    nodeLogger.error(nodeConfig.pwdLastSet+"::"+ldapUser.pwdLastSet.trim()); 
    var result = null;
    var systemUser = `system/`+ConnectorName+`/User/`+ldapUser.objectGUID;  
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.tempUsrDetail+"::"+systemUser);
    
     try { 
        result = openidm.patch(systemUser, "null", [{"operation":"replace", "field":"pwdLastSet", "value":"-1"}]);
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmPatchSuccess+"::"+Object.keys(result).length+"::"+result);
        if(Object.keys(result).length>0) {
             if(authenticateWithTempCreds(ConnectorName,ldapUser,password)){
                 return true;
             } else {
                 return false;
             }
             
        } else {
             return false;
        }
             
     } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmPatchFail+"::"+error);
        action.goTo(nodeOutcome.ERROR);    
     }  
}


function authenticateWithTempCreds(ConnectorName,ldapUser,password){

    var result = false;    
    nodeLogger.error(nodeConfig.authnTempUser+"::"+ldapUser.mail); 
    var systemUser = `system/`+ConnectorName+`/User`; 
    try {
        openidm.action(systemUser, "authenticate", {"username" : ldapUser.sAMAccountName, "password" : password});
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+ldapUser.mail+"::"+nodeConfig.authnTempUserSuccess);
        result = true;
        
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+ldapUser.mail+"::"+nodeConfig.authnTempUserFail);
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);    
    } 

    return result;
}


function queryLDAP(ConnectorName,UserNameAttribute,UserNameAttributeValue){

    var result = {};
    result['records']=0;
    result['data']="No Record Found";
    var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQuery+"::"+JSON.stringify(query));
    
    try{
        // Query to check if user exists in AD
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
         records = ldapUserQuery.result.length;
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records);
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result));
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
        
     } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
     }

    nodeLogger.error("LDAP Query result length: "+result.records);
    nodeLogger.error("LDAP Query user data: "+result.data);
    return result;
}
