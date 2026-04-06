/**
 * Script: KYID.Journey.UpdatedNewPasswordInAD
 * Description: This script is used to update password for CIT domain user in Active Directory.
 * Date: 26th July 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Update Password in AD",
    script: "Script",
    scriptName: "KYID.Journey.UpdatedNewPasswordInAD",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKOGID: "Missing KOGID for KOG User",
    missingEmail: "Missing email",
    missingCreds: "Missing credentials",
    missingDomain: "Missing user domain",
    missingUPN: "Missing UPN for KOG User",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    pwdUpdateSuccess: "Password updated successfully",
    pwdUpdateFailed: "Password updated Fails. Missing required arguments.",
    patchOperationFailed: "Patch Operation Failed",
    ConnectorName: "ConnectorName",
    ldapQuery: "ldapQuery",
    idmQueryFail: "IDM query operation failed",
    ldapQueryTotalRecords: "Total Records",
    ldapQueryPrintRecords: "List of Records",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
SUCCESS: "Successful",
PWDREQNOTMET: "pwdReqNotMet",
ERROR: "Failed"
};

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



// Declare Global Variables
var missingInputs = [];
var upn = null;
var domain = null;
var UserSearchValue = null;
var attrPwd = null;
var extDomain = null;
var intDomain = null;
var ConnectorName = null;
var UserNameAttribute = null;
var result = {};


if(nodeState.get("domain") && nodeState.get("domain")!=null){
    domain = nodeState.get("domain").toLowerCase();     
}  else {
    missingInputs.push(nodeConfig.missingDomain);
}

if(nodeState.get("UPN") != null && typeof nodeState.get("UPN") != "undefined") {
    upn = nodeState.get("UPN").toLowerCase(); 
}  else {
     missingInputs.push(nodeConfig.missingUPN);
}

if(nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
   UserSearchValue = nodeState.get("mail").toLowerCase();      
}  else {
    missingInputs.push(nodeConfig.missingEmail);
}

if(nodeState.get("password") != null && typeof nodeState.get("password") != "undefined") {
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
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(domain && domain!=null){
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {    
    //ConnectorName="kyid";
    result = queryLDAP(ConnectorName,"userPrincipalName",upn);

    if(result.records===-1){
        action.goTo(nodeOutcome.ERROR);
        
    } else {  
          if(result.records===0){
                result = queryLDAP(ConnectorName,UserNameAttribute,UserSearchValue);
            }
        
            if(result.records>0) {
                var ldapUser = result.data;
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.userFound);
        
                var systemUser = `system/`+ConnectorName+`/User/${ldapUser._id}`;  
        
                try {
                    // logger.error("systemUser is --> " + systemUser)
                    // logger.error("Temp Password in UpdatedNewPasswordInAD "+nodeState.get("TempPassword"));
                     if (nodeState.get("TempPassword")){
                        var TempPassword=  nodeState.get("TempPassword")
                         var ret1 = openidm.action('endpoint/ResetPassword', 'resetpassword', {  password: attrPwd, resource: systemUser, TempPassword: TempPassword });
                         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"UpdatedNewPasswordInAD exception : Reset Password with Temp Password Error Code : " + JSON.stringify(ret1));
                         
                     }
                    else{
                    var ret1 = openidm.action('endpoint/ResetPassword', 'resetpassword', {  password: attrPwd, resource: systemUser });
                     nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"UpdatedNewPasswordInAD exception : Reset Password with Normal Password  Error Code : " + JSON.stringify(ret1));
                     
                    }
        
                    if(ret1.code== 0){
                        nodeState.putShared("TempPassword",null)
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Password Reset Successfully");
                        action.goTo(nodeOutcome.SUCCESS);
                      
                    }
        
                    else if(ret1.code== -2){
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Inside Reset Password Error -> New password does not comply with password policy");
                        action.goTo(nodeOutcome.PWDREQNOTMET);
                    }
                    else if (ret1.code== -1){
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password");
                        action.goTo(nodeOutcome.ERROR);
                      
                    }
                    else{
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password without Return Code");
                        action.goTo(nodeOutcome.ERROR);
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password without Return Code");
                        
                    }
                    
                } catch(error) {
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+error);
                    action.goTo(nodeOutcome.ERROR);
                  
                }
                
                
            } else {
                 nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.userNotFound);
                 action.goTo(nodeOutcome.ERROR);
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
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records);
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result));
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
        
     } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
         result['records']=-1;
         result['data']=error;
     }

    nodeLogger.debug("LDAP Query result length: "+result.records);
    nodeLogger.debug("LDAP Query user data: "+result.data);
    return result;
}

