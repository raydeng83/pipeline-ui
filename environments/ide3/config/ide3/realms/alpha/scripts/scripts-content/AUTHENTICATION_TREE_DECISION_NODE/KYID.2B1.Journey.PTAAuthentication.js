/**
 * Function: KYID.Journey.PTAAuthentication
 * Description: This script is used to authenticate password in Active Directory.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();
//var auditLib = require("KYID.2B1.Library.AuditLogger")

var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
logger.error("requestHeaders :: "+ JSON.stringify(requestHeaders));
var browser = requestHeaders.get("user-agent") || ""; 
var os = requestHeaders.get("sec-ch-ua-platform"); 

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
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
    FAIL_INACTIVE: "failOrInactive",
    USR_DISABLED: "usrDisabled"
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
var password;
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

function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId=null;
                var eventDetails = {};
                var xClientCity = requestHeaders.get("x-client-city")?requestHeaders.get("x-client-city")[0]:""
                var xClientRegion = requestHeaders.get("x-client-region")?requestHeaders.get("x-client-region")[0]:""
                logger.debug("_id of the user is" +nodeState.get("_id"));
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    if(code=="LOG002" || code=="LOG005"){
                       sessionDetail = JSON.parse(nodeState.get("sessionRefId"))
                       sessionDetail.city = xClientCity
                       sessionDetail.country = xClientRegion
                       sessionDetails["sessionRefId"] = sessionDetail
                    } else {
                        sessionDetail = nodeState.get("sessionRefId") 
                        
                       sessionDetails["sessionRefId"] = sessionDetail
                    }            
                    
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails["sessionRefId"] = {"sessionRefId": ""}
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
        logger.error("Failed to log login event "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}


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
                      
/*if(nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();      
}  else {
     missingInputs.push(nodeConfig.missingEmail);
}*/

if(nodeState.get("EmailAddress") != null && typeof nodeState.get("EmailAddress") != "undefined") {
    email = nodeState.get("EmailAddress").toLowerCase();      
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

var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

if(extDomain.localeCompare(domain)==0){
    isinternaluser = false;
    nodeState.putShared("userType","External");
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    nodeState.putShared("userType","Internal");
    /*if(domain && domain!=null){
       // ConnectorName = domain.replace(/\./g, '');
        ConnectorName= systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase(); 
        logger.debug("NameOfInternalConnector:"+ConnectorName)
        //ConnectorName = "kyinternalgov"
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }*/
    if(domain && domain!=null){ //To handle multiple internal domains in PROD: 09/27
        if(envType.localeCompare("nonProduction")==0) {
            ConnectorName= systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase(); 
            logger.debug("NameOfInternalConnector:"+ConnectorName)
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
        } else {
            ConnectorName = domain.replace(/\./g, '');
            logger.debug("NameOfInternalConnector:"+ConnectorName)
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
        } 
    }
}



// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs+"::Email::"+nodeState.get("mail"));
    action.goTo(nodeOutcome.ERROR);

} else {
    logger.error("accountStatus :: " + nodeState.get("accountStatus"))
    var raw = nodeState.get("accountStatus"); // could be null/undefined/non-string
    var status = (raw == null) ? null : String(raw).trim().toLowerCase();
    logger.debug("status is :: " + status)
    if (status === null || status === "active") {
    nodeState.putShared("ConnectorName",ConnectorName);
    nodeState.putShared("isinternaluser",isinternaluser);
    //ConnectorName="kyid";
    result = queryLDAP(ConnectorName,"userPrincipalName",upn);
    if(result.records===-1){
        auditLog("LOG002", "Login Failure");
        action.goTo(nodeOutcome.ERROR);
        
    } else {  
        if(result.records===0){
            result = queryLDAP(ConnectorName,UserNameAttribute,email);
        }
            
         if(result.records>0) {
            var ldapUser = result.data;
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userFound+"::"+JSON.stringify(ldapUser));
            nodeState.putShared("firstName",ldapUser.givenName);
            nodeState.putShared("lastName",ldapUser.sn); 
            nodeState.putShared("sAMAccountName",ldapUser.sAMAccountName);
            nodeLogger.debug("isinternaluser:"+isinternaluser);
             
            if(ldapUser.__LOCK_OUT__){
            logger.debug("InsideLockout")
             if(isinternaluser){
                    if(envType.localeCompare("nonProduction")==0) {  
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.InternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail")); 
                    //auditLib.auditLogger("LOG003",sessionDetails,"Account Lockout", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
                    auditLog("LOG003", "Account Lockout");
                    action.goTo(nodeOutcome.INT_USR_LOCKOUT_NON_PROD);
                     }
                    else{
                    //auditLib.auditLogger("LOG003",sessionDetails,"Account Lockout", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
                    auditLog("LOG003", "Account Lockout");
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.InternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail"));  
                    action.goTo(nodeOutcome.INT_USR_LOCKOUT);
                    }
                
                }
                else{
                //auditLib.auditLogger("LOG003",sessionDetails,"Account Lockout", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
                auditLog("LOG003", "Account Lockout");
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.ExternalUsrADLockoutErrorLogger+"::Email::"+nodeState.get("mail"));
                action.goTo(nodeOutcome.EXT_USR_LOCKOUT);
                }
           }
            else
            {
            if(isinternaluser){
                windowsaccountname = windowsaccountnameIntPrefix+"\\" + ldapUser.sAMAccountName;
                 nodeLogger.debug("windowsaccountname: "+windowsaccountname)
            } else {
                windowsaccountname = "CIT\\" + ldapUser.sAMAccountName;
                 nodeLogger.debug("windowsaccountname: "+windowsaccountname)
            }

            nodeState.putShared("windowsaccountname",windowsaccountname);
            
            var systemUser = `system/`+ConnectorName+`/User`; 
            try {
                
                var ret1 = openidm.action('endpoint/authenticate', 'authenticate', { username: ldapUser.sAMAccountName, password: password, resource: systemUser });
                if(ret1.code== 0){
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.pwdVerifySuccess+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.SUCCESS).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser).putSessionProperty('idpauthtime', dateTime);
                }   
                else if(ret1.code== -2){
                    //auditLib.auditLogger("LOG005",sessionDetails,"Password Expired", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("LOG005", "Expired Password");
                    var TempPassword = nodeState.get("password");
                    nodeState.putShared("TempPassword", TempPassword); 
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.TempPasswordLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                }
                else if(ret1.code== -3){
                    //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("LOG002", "Login Failure");
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.ivalidPassowedLogger);
                    action.goTo(nodeOutcome.FAIL_INACTIVE);            
                }
                else if (ret1.code== -4){
                    var TempPassword = nodeState.get("password");
                    nodeState.putShared("TempPassword", TempPassword); 
                     //auditLib.auditLogger("LOG005",sessionDetails,"Password Expired", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("LOG005", "Expired Password");
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.passwordExpiredLogger);
                     action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
                }
                else if (ret1.code == -1){
                    //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("LOG002", "Login Failure");
                    
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.UnexpectedErrorLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.ERROR);
                }  
                else if (ret1.code == -5){
                    //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("LOG002", "Login Failure");
                    
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ "code is -5"+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.USR_DISABLED);
                }    
                else{
                     //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                     auditLog("LOG002", "Login Failure");
                   
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+ nodeConfig.UnexpectedErrorLogger+"::Email::"+nodeState.get("mail"));
                    action.goTo(nodeOutcome.ERROR);                   
                }

    
           } catch(error) {
                //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                 auditLog("LOG002", "Login Failure");
             
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error+"::Email::"+nodeState.get("mail"));
                action.goTo(nodeOutcome.ERROR); } 
             }
             
         } 
         
         else {
             //auditLib.auditLogger("LOG002",sessionDetails,"Login Failure", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
              auditLog("LOG002", "Login Failure");
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName
                          +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound+"::Email::"+nodeState.get("mail"));
             action.goTo(nodeOutcome.FAIL_INACTIVE);
        }
        
    }  
}else{
    auditLog("LOG002", "Login Failure");
    nodeLogger.error("account is inactive in ping");
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName +"::"+nodeConfig.ldapConnSuccess+"::"+nodeConfig.userNotFound+"::Email::"+nodeState.get("mail"));
    action.goTo(nodeOutcome.FAIL_INACTIVE);
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
         if(ldapUserQuery.result.length>0)
         {   
         records = ldapUserQuery.result.length;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records);
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result));
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
        var ldapUser = result.data.sAMAccountName;
        nodeState.putShared("userId", result.data._id);
        //nodeState.putShared("KOGID", result.data._id);
        nodeState.putShared("telephoneNumber", result.data.telephoneNumber);
        nodeState.putShared("userMail", result.data.mail);
        nodeState.putShared("displayName", result.data.displayName);
        nodeState.putShared("postalCode", result.data.postalCode);
        nodeState.putShared("countryCode", result.data.countryCode);
        nodeState.putShared("objectGUID", result.data.objectGUID);
        nodeState.putShared("sn", result.data.sn);
        nodeState.putShared("cn", result.data.cn);
        nodeState.putShared("pwdLastSet", result.data.pwdLastSet);
        nodeState.putShared("frUnindexedString1", "External");
        nodeState.putShared("frUnindexedString2", ConnectorName);
        nodeState.putShared("sAMAccountName", result.data.sAMAccountName);
         }
        else{
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"No Record Found"+"::Email::"+nodeState.get("mail"));
            result['records']=-1;
            result['data']="No Record Found"; 
        }
         
     } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error+"::Email::"+nodeState.get("mail"));
         result['records']=-1;
         result['data']=error;        
     }
     nodeLogger.debug("LDAP Query result length: "+result.records+"::Email::"+nodeState.get("mail"));
     nodeLogger.debug("LDAP Query user data: "+result.data+"::Email::"+nodeState.get("mail"));
     return result;
}
