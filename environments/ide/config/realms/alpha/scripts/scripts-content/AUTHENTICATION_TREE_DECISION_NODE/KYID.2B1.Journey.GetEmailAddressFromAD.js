/**
 * Function: KYID.Journey.GetEmailAddressFromAD
 * Description: This script is used to query user against AD
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get EmailAddress from AD",
    script: "Script",
    scriptName: "KYID.Journey.GetEmailAddressFromAD",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingInternalDomain: "Missing Internal Domain Details",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    missingUserDetails: "Missing user details",
    userFound: "User Found in AD",
    ConnectorName: "ConnectorName",
    ldapUserQuery: "ldapUserQuery",
    userNotFound: "User Not Found in AD",
    ldapConnSuccess: "Connected to AD successfully",
    intIdmQueryFail: "Internal IDM connector query operation failed",
    extIdmQueryFail: "External IDM connector query operation failed",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};

// Declare Global Variables
var missingInputs = [];
var extDomain = "";
var intDomain = "";
var extConnectorName = null;
var intConnectorName = null;
var UserNameAttribute = null;
var user = null;
var envType = null;

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

nodeState.putShared("isKerberosAuthCompleted", "true");

logger.debug("Setting Kerberos Auth Completed as " + nodeState.get("isKerberosAuthCompleted"));

if(systemEnv.getProperty("esv.environment.type") && systemEnv.getProperty("esv.environment.type")!=null) {
    envType = systemEnv.getProperty("esv.environment.type"); 
    logger.debug("envType in KYID.2B1.Journey.GetEmailAddressFromAD - "+envType)
    if(nodeState.get("mail")!=null && nodeState.get("mail")){
       nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType+"::Email::"+nodeState.get("mail")); 
    }   
}  else {
     missingInputs.push(nodeConfig.missingEnvType);
}

if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
     extConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
}  else {
     missingInputs.push(nodeConfig.missingConnectorInfo);
}

if(systemEnv.getProperty("esv.kyid.internal.connector") && systemEnv.getProperty("esv.kyid.internal.connector")!=null) {
      intConnectorName = systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase();    
}  else {
     missingInputs.push(nodeConfig.missingConnectorInfo);
}

if(systemEnv.getProperty("esv.kyid.kerberos.int.connector.attr") && systemEnv.getProperty("esv.kyid.kerberos.int.connector.attr")!=null) {
      UserNameAttribute = systemEnv.getProperty("esv.kyid.kerberos.int.connector.attr");   
}  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
}

if(nodeState.get("ig-identity") && nodeState.get("ig-identity")!=null){
    var realm = JSON.parse(nodeState.get("ig-identity")).realm;
    if(realm && realm != null) {
        nodeLogger.debug("realm received from IG: "+ realm);
        intConnectorName = realm.replace(/\./g, "").toLowerCase();
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+":: intConnectorName is " + intConnectorName);
    }
}

if(nodeState.get("username") && nodeState.get("username")!=null){
    nodeLogger.debug("username received from IG: "+nodeState.get("username"))
    user = nodeState.get("username");
} else {
    missingInputs.push(nodeConfig.missingUserDetails);
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    // sAMAccountName equals to the principal name received from IG JWT response
     var query = {_queryFilter: UserNameAttribute+` eq "`+user+ `"`,}
     var internalADConnectorName = null;
     var ldapUserQuery = null;
     try{
        /*
         var internalADConnectorName=systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase();
         var ldapUserQuery = openidm.query(`system/`+internalADConnectorName+`/User`,query);
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: ldapUserQuery :: " + ldapUserQuery);
         */
         //if(domain && domain!=null){
            if(envType.localeCompare("nonProduction")==0) {
                internalADConnectorName = systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase();
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+internalADConnectorName);
                // Query to check if user exists in AD
                ldapUserQuery = openidm.query(`system/`+internalADConnectorName+`/User`,query);
            } else {
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+intConnectorName);
                // Query to check if user exists in AD
                ldapUserQuery = openidm.query(`system/`+intConnectorName+`/User`,query);              
            } 
        //}
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapUserQuery+"::"+ldapUserQuery);
         
     } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intIdmQueryFail+"::"+error);
        action.goTo(nodeOutcome.ERROR);
     }

     if(ldapUserQuery.result.length==1) {
        var ldapUser = ldapUserQuery.result[0];
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userFound+"::"+JSON.stringify(ldapUser));

         //old code before missing mail attribute
        //nodeLogger.error("mail received from int AD: "+ldapUser.mail)
        //nodeLogger.error("mail received from int AD: "+ldapUser.userPrincipalName) 
        //nodeState.putShared("mail",ldapUser.mail);

         //after: missing mail attribute
        //nodeLogger.error("mail received from int AD: "+ldapUser.mail)
        //nodeLogger.error("UPN received from int AD: "+ldapUser.userPrincipalName) 
        
        //nodeState.putShared("mail",ldapUser.mail);
        //fix for the maill attribute missing in AD
        if( ldapUser.mail!=null && ldapUser.mail && ldapUser.mail!='undefined'){
            nodeLogger.debug("mail received from int AD: "+JSON.stringify(ldapUser));
            nodeState.putShared("mail",ldapUser.mail);
          // nodeState.putShared("sAMAccountName",ldapUser.sAMAccountName);

        }else{
            nodeLogger.debug("UPN received from int AD: "+ldapUser.userPrincipalName) 
           // nodeState.putShared("sAMAccountName",ldapUser.sAMAccountName);
            nodeState.putShared("mail",ldapUser.userPrincipalName);
        }

        nodeLogger.debug("mail retrieved from nodeState: "+nodeState.get("mail"));
         
        //fix for Kerberos loop issue
        nodeState.putShared("userInputmail",ldapUser.userPrincipalName)
        nodeState.putShared("sAMAccountName",ldapUser.sAMAccountName);
        
        action.goTo(nodeOutcome.SUCCESS).putSessionProperty("isinternaluser","true");
        
    } else {
        //  try{
        // // Query to check if user exists in AD
        //      var ldapUserQuery = openidm.query(`system/`+extConnectorName+`/User`,query);
        //  } catch(error) {
        //     nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extIdmQueryFail+"::"+error);
        //     action.goTo(nodeOutcome.ERROR);
        //  }

        // if(ldapUserQuery.result.length==1) {
        //     var ldapUser = ldapUserQuery.result[0];
        //     nodeLogger.error("mail received from ext AD: "+ldapUser.mail) 
        //     nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
        //                  +"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userFound+"::"+JSON.stringify(ldapUser));
        //     nodeState.putShared("mail",ldapUser.mail);
        //     action.goTo(nodeOutcome.SUCCESS);
        
        // } else {
             nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName
                          +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound);
             action.goTo(nodeOutcome.ERROR);
        // }
    }    
     
}

