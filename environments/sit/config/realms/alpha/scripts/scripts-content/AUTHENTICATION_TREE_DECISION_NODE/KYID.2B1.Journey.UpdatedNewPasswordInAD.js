var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var passwordValidatorLib = require('KYID.2B1.Journey.PasswordPolicyValidatorLibrary');
var auditLib = require("KYID.2B1.Library.AuditLogger")
var journeyName = nodeState.get("journeyName")|| null;
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Update Password in AD",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UpdatedNewPasswordInAD",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKOGID: "Missing KOGID for KOG User",
    missingEmail: "Missing email",
    missingCreds: "Missing credentials",
    missingDomain: "Missing user domain",
    missingUPN: "Missing UPN for KOG User",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    missingExternalDomain: "Missing External Domain",
    missingInternalDomain: "Missing Internal Domain",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    pwdUpdateSuccess: "Password updated successfully",
    pwdUpdateFailed: "Password updated Failed. Missing required arguments.",
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
    },
    info: function (message) {
        logger.info(message);
    }
}

var userId = nodeState.get("userId") || null
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var browser = requestHeaders.get("user-agent"); 
var os = requestHeaders.get("sec-ch-ua-platform"); 

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

 var sessionDetail = null
    
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

// Declare Global Variables
var missingInputs = [];
var upn = null;
var domain = null;
var UserSearchValue = null;
var password;
var extDomain = null;
var intDomain = null;
var ConnectorName = null;
var UserNameAttribute = null;
var result = {};
//nodeState.putShared("domain","edev.extdev.ky.gov");
//nodeState.putShared("UPN","DEV_KYIDS_E_25@edev.extdev.ky.gov");
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

if(nodeState.get("newPassword") != null && typeof nodeState.get("newPassword") != "undefined") {
  password = nodeState.get("newPassword");  
}  else {
    missingInputs.push(nodeConfig.missingCreds);
}

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

if(systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr")!=null) {
    UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");   
}  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
}

if(extDomain.localeCompare(domain)==0){
    isinternaluser = false;
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser+"::"+UserSearchValue);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName+"::"+UserSearchValue);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
}
else if(intDomain.localeCompare(domain)==0){
       isinternaluser = true;
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser+"::"+UserSearchValue);  
    if(systemEnv.getProperty("esv.kyid.internal.connector") && systemEnv.getProperty("esv.kyid.internal.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase();    
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName+"::"+UserSearchValue);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    } 
}else {
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser+"::"+UserSearchValue);
    if(domain && domain!=null){
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName+"::"+UserSearchValue);
    }
}

 logger.debug("upn "+upn);
 logger.debug("domain "+domain);
 logger.debug("UserSearchValue "+UserSearchValue);
 logger.debug("extDomain "+extDomain);
 logger.debug("intDomain "+intDomain);
 logger.debug("UserNameAttribute "+UserNameAttribute);
 logger.debug("ConnectorName "+ConnectorName);

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs+"::"+UserSearchValue);
    action.goTo(nodeOutcome.ERROR);

} else {    

        // var userId = ""
        // if(nodeState.get("mail")){
        // userId = nodeState.get("mail");
        // } else if(typeof existingSession != 'undefined'){
        // userId = existingSession.get("UserId")
        // } 
               
     
    
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
                logger.debug("ldapuser" +ldapUser._id);
                nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.userFound+"::"+UserSearchValue);
        
                var systemUser = `system/`+ConnectorName+`/User/${ldapUser._id}`;  
        
                try {
                     logger.debug("systemUser is --> " + systemUser)
                    //this is getting executed for Change Password
                     if (nodeState.get("TempPassword")){
                        var TempPassword=  nodeState.get("TempPassword")
                         var ret1 = openidm.action('endpoint/ResetPassword', 'resetpassword', {  password: password, resource: systemUser, TempPassword: TempPassword });
                         nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Password is updated successfully"+"::"+UserSearchValue);
                         
                     }
                    else{

                    //This is getting executed for Reset Password flow
                    var ret1 = openidm.action('endpoint/ResetPassword', 'resetpassword', {  password: password, resource: systemUser });
                     nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"::"+"UpdatedNewPasswordInAD Response : Reset Password with Normal Password  Response Code : " + JSON.stringify(ret1)+"::"+UserSearchValue);
                    }
                      if(ret1.code== 0){
                      logger.info("Inside If Block");
                        nodeState.putShared("TempPassword",null)
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.pwdUpdateSuccess+"::"+"Password Reset Successfully"+"::"+UserSearchValue);
                        logger.debug("After If Block");

                       // auditLib.auditLogger("PWD003",sessionDetail,"Password Reset Successful", eventDetails, userId, userId, transactionid)
                        // auditLib.auditLogger("PWD003",sessionDetail,"Password Reset Successful", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetail)
                        if(journeyName === "changePassword"){         
                        auditLog("PWD005", "Change Password Successful");
                        }
                        else
                        {
                        auditLog("PWD003", "Password Reset Successful");
                        }
                        action.goTo(nodeOutcome.SUCCESS);
                      
                    }
                   else if(ret1.code== -2){
                        var isLastUsedPassword = passwordValidatorLib.getPreviousTwentyFourPassswordErrorMessage();
                        nodeState.putShared("passwordErrorMessage", isLastUsedPassword);
                       
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Inside Reset Password Error -> New password does not comply with password policy"+"::"+UserSearchValue);
                        action.goTo(nodeOutcome.PWDREQNOTMET);
                    }
                    else if (ret1.code== -1){
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password"+"::"+UserSearchValue);
                       // auditLib.auditLogger("PWD004",sessionDetails,"Password Reset Failure", eventDetails, userId, userId, transactionid)
//auditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetail)
                        if(journeyName === "changePassword"){     
                        auditLog("PWD004", "Change Password Failure");
                        }
                        else{
                        auditLog("PWD006", "Password reset Failure");  
                        }
                        action.goTo(nodeOutcome.ERROR);
                      
                    }
                    else{
                        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password without Return Code"+"::"+UserSearchValue);
                        //uditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetail)
                        if(journeyName === "changePassword"){     
                        auditLog("PWD004", "Change Password Failure");
                        }
                        else{
                        auditLog("PWD006", "Password reset Failure");  
                        }
                         action.goTo(nodeOutcome.ERROR);
                        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+"Error Occured While Reseting Password without Return Code"+"::"+UserSearchValue);
                        
                    }
                    
                } catch(error) {
                    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.patchOperationFailed+"::"+error+"::"+UserSearchValue);
                    //auditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionid)
                   // auditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetail)
                    if(journeyName === "changePassword"){     
                       auditLog("PWD004", "Change Password Failure");
                    }else{
                        auditLog("PWD006", "Password reset Failure");  
                        }
                    action.goTo(nodeOutcome.ERROR);
                  
                }
                
                
            } else {
                 nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.userNotFound+"::"+UserSearchValue);
                //auditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionid)
                //auditLib.auditLogger("PWD004",sessionDetail,"Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetail)
                if(journeyName === "changePassword"){     
                 auditLog("PWD004", "Change Password Failure");
                    }else{
                 auditLog("PWD006", "Password reset Failure");  
                }
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
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQuery+"::"+JSON.stringify(query)+"::"+UserSearchValue);
    
    try{
        // Query to check if user exists in AD
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
         records = ldapUserQuery.result.length;
         // nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records+"::"+UserSearchValue);
         // nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result)+"::"+UserSearchValue);
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
        
     } catch(error) {
         nodeLogger.error(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error+"::"+UserSearchValue);
         result['records']=-1;
         result['data']=error;
     }
    return result;
}

function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log password reset initiation "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

