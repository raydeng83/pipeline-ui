/**
 * Script: KYID.Journey.IsAccountLocked
 * Description:  This script is used to unlock user account in AD if it's locked.            
 * Date: 29th Oct 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Is Account Locked",
     script: "Script",
     missingConnectorInfo: "Missing connector details",
     missingConnectorAttrs: "Missing connector attributes",
     extUser: "External Domain User",
     intUser: "Internal Domain User",  
     scriptName: "KYID.Journey.IsAccountLocked",
     accountLocked: "Account is locked in AD",
     accountNotLocked: "Account is not locked in AD",  
     idmQueryFail: "IDM query operation failed", 
     userFound: "User Found in AD",
     userNotFound: "User Not Found in AD",    
     acctUnlockSuccess: "Account unlocked successfully",
     patchOperationFailed: "Patch Operation Failed",  
     missingInputParams: "Following mandatory input params are missing",  
     timestamp: dateTime,
     ConnectorName: "ConnectorName",
     ldapQuery: "ldapQuery",
     idmQueryFail: "IDM query operation failed",
     ldapQueryTotalRecords: "Total Records",
     ldapQueryPrintRecords: "List of Records",
     missingUPN: "Missing UPN for KOG User",
     ldapConnSuccess: "Connected to AD Successfully",
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};


// Declare Global Variables
 var missingInputs = [];
 var result = {}; 
 var extDomain = null;
 var intDomain = null;
 var usrUPN = null;
 var isAccountLocked = "true";
 var email = nodeState.get("mail").toLowerCase();
 var domain = nodeState.get("domain").toLowerCase();
 var ConnectorName = null;
 var UserNameAttribute = null;


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
} ;

if (nodeState.get("UPN") != null) {
    usrUPN = nodeState.get("UPN");
} else {
    missingInputs.push(nodeConfig.missingUPN);
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
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
     missingInputs.push(nodeConfig.missingConnectorInfo);
    }    
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(domain && domain!=null){
         ConnectorName= systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase(); 
        logger.debug("NameOfInternalConnector:"+ConnectorName)
        //ConnectorName = "kyinternalgov"
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    result = queryLDAP(ConnectorName,"userPrincipalName",usrUPN.toLowerCase());

    if(result.records===0){
        result = queryLDAP(ConnectorName,UserNameAttribute,email);
    }    

    if(result.records>0) {
        var ldapUser = result.data;
        /*nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapConnSuccess
            + "::" + nodeConfig.userFound);
        nodeLogger.debug("Value of Lockout is: "+ldapUser.__LOCK_OUT__);*/
        logger.debug("LdapResponseForLockout:"+ldapUser)

    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapConnSuccess
            + "::" + nodeConfig.userNotFound);
        action.goTo(nodeOutcome.ERROR);
    }  
         
    if(ldapUser.__LOCK_OUT__) {
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.accountLocked)

         logger.debug("UnlockingtheAccount");
              var patch = [
            {
             operation: "replace",
             field: "/__LOCK_OUT__",
             value: false
            }
        ]
        
        

        var systemUser = `system/`+ConnectorName+`/User/${ldapUser._id}`; 

        try {
            // Unlock user account in AD
            openidm.patch(systemUser, null, patch); //An exception is thrown if the object could not be updated.
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.acctUnlockSuccess);
            action.goTo(nodeOutcome.SUCCESS);
            
        } catch(error) {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+error);
            action.goTo(nodeOutcome.ERROR);
        }
    }

    
    else {
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.accountNotLocked);
        action.goTo(nodeOutcome.SUCCESS);
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
     }

    nodeLogger.debug("LDAP Query result length: "+result.records);
    nodeLogger.debug("LDAP Query user data: "+result.data);
    return result;
}


