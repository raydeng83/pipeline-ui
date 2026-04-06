/**
 * Script: KYID.Journey.ReadKOGApplicationClaims
 * Description: This script is used to get KOG app claims through KOG UserClaims API.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();
nodeState.putShared("AuthenticationInstant",dateTime)
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get App Claims",
    script: "Script",
    scriptName: "KYID.Journey.ReadKOGApplicationClaims",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingUPN: "Missing UPN",
    missingApplicationName: "Missing ApplicationName",
    missingApplicationIdentifier: "Missing ApplicationIdentifier",
    missingAuthenticationInstant: "Missing AuthenticationInstant",
    missingIDPAuthType: "Missing IDPAuthType",
    missingUserAgent: "Missing UserAgent",
    missingIPAddress: "Missing IPAddress",
    missingLatitude: "Missing Latitude",
    missingLongitude: "Missing Longitude",
    missingneedkogvisitclaim: "Missing needkogvisit claim",
    missingnameclaim: "Missing name claim",
    missingmfatypeclaim: "Missing mfatype claim",
    getAccessToken_Failed: "Failed to retrieve Access Token",
    getKOGAPPClaims_Failed: "Failed to retrieve APP Claims",
    respClaimsAPI: "Claim API Response",
    apiResponsePass: "API_RESULT_SUCCESS",
    needkogvisitclaimValue: "needkogvisit value in KOG app claims",
    mfatypeClaimsValue: "requiredmfatype value in KOG app claims",
    mfatypeNotPresentInClaims: "requiredmfatype not present in KOG app claims",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

//Logging Function
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

function requiredMFAMethods(mfaCode){
     
    var mfaOptions = null;
    if (mfaCode === 3) {
        mfaOptions = ["EMAIL", "SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    else if (mfaCode === 4) {
        mfaOptions = ["SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    else if (mfaCode === 5) {
        mfaOptions = ["FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    else{
        mfaOptions = ["FRPUSH", "FRTOTP", "SYMANTEC"]
    }

    return mfaOptions;
}

// Declare Global Variables
var missingInputs = [];
var availableFactors = {};
var mapfactorID = null;
var usrRegisteredFactors = [];
var needkogvisitclaim = null;
var name = null;
var mfatype = null;
var needkogvisit = "no";
var nameValue = null;
var mfatypeValue = 3;
var isMFARequired = false;
var isMFARegisterAllowed = true;
var applicationIdentifier = "";
var authenticationInstant = "";
var upn = "";
var applicationName = "";
var userAgent = "";
var ipAddress = "";
var latitude = "";
var longitude = "";
var kogTokenApi = "";
var kogUsrClaimApi = "";

if(systemEnv.getProperty("esv.needkogvisit.claims.url") && systemEnv.getProperty("esv.needkogvisit.claims.url")!=null){
    needkogvisitclaim = systemEnv.getProperty("esv.needkogvisit.claims.url");
} else {
     missingInputs.push(nodeConfig.missingneedkogvisitclaim);
}

if(systemEnv.getProperty("esv.name.claims.url") && systemEnv.getProperty("esv.name.claims.url")!=null){
    name = systemEnv.getProperty("esv.name.claims.url");
     logger.debug("Claims URL: "+name)
} else {
     missingInputs.push(nodeConfig.missingnameclaim);
}

if(systemEnv.getProperty("esv.requiredmfatype.claims.url") && systemEnv.getProperty("esv.requiredmfatype.claims.url")!=null){
    mfatype = systemEnv.getProperty("esv.requiredmfatype.claims.url");
} else {
     missingInputs.push(nodeConfig.missingmfatypeclaim);
}
 
if(nodeState.get("UPN") && nodeState.get("UPN")!=null) {
    upn = nodeState.get("UPN");
}  else {
    missingInputs.push(nodeConfig.missingUPN);
}

if(nodeState.get("kogAppName") && nodeState.get("kogAppName")!=null) {
    applicationName  = nodeState.get("kogAppName");  
}  else {
    missingInputs.push(nodeConfig.missingApplicationName);
}



if(nodeState.get("kogDBUrl") && nodeState.get("kogDBUrl") !=null) {
    
         applicationIdentifier  = nodeState.get("kogDBUrl");   

   
}   else {
     missingInputs.push(nodeConfig.missingApplicationIdentifier);
}

if(nodeState.get("AuthenticationInstant") && nodeState.get("AuthenticationInstant")!= null) {
     authenticationInstant = nodeState.get("AuthenticationInstant");    
}  else {
     missingInputs.push(nodeConfig.missingAuthenticationInstant);
}

/*if(nodeState.get("idpauthtype")) {
 var IDPAuthType = nodeState.get("idpauthtype");    
}  else {
 missingInputs.push(nodeConfig.missingIDPAuthType);
}*/

if(nodeState.get("UserAgent") && nodeState.get("UserAgent")!=null) {
     userAgent  = nodeState.get("UserAgent");    
}  else {
     missingInputs.push(nodeConfig.missingUserAgent);
}

if(nodeState.get("IPAddress") && nodeState.get("IPAddress")!=null) {
     ipAddress = nodeState.get("IPAddress");    
}  else {
     missingInputs.push(nodeConfig.missingIPAddress);
}

if(nodeState.get("latitude") && nodeState.get("latitude")!=null) {
    latitude = nodeState.get("latitude");    
}  else {
     missingInputs.push(nodeConfig.missingLatitude);
}

if(nodeState.get("longitude") && nodeState.get("longitude")!=null) {
    longitude = nodeState.get("longitude");    
}  else {
     missingInputs.push(nodeConfig.missingLongitude);
}

if(systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token")!=null) {
      kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");    
    //kogTokenApi = "https://sso.dev.kyid.ky.gov/am/oauth2/alpha/access_token";    
 }  else {
      missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
 }
    
if(systemEnv.getProperty("esv.kyid.kogapi.userclaims") && systemEnv.getProperty("esv.kyid.kogapi.userclaims")!=null) {
     kogUsrClaimApi = systemEnv.getProperty("esv.kyid.kogapi.userclaims");   
}  else {
     missingInputs.push(nodeConfig.missingKogUsrProfileAPIInfo);
}

// Checks if mandatory input params are missing
if(missingInputs.length>0){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    try{
        var apiTokenRequest = require('KYID.Library.KOGAPIAccessToken'); 
        var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
       if (kogAPITokenResponse.status === 200){
            logger.debug("got the access token")
           var bearerToken = kogAPITokenResponse.response;
            var body = {
                        upn:upn,
                        applicationname:applicationName,
                        applicationidentifier:applicationIdentifier,
                        authenticationinstant:authenticationInstant,
                        idpauthtype:"pwd",
                        useragent:userAgent,
                        ipaddress:ipAddress,
                        latitude:latitude,
                        longitude:longitude
                    };

            logger.debug("body in claims: "+JSON.stringify(body))
            var invokeAPI = require("KYID.Library.ProcessKOGAPIRequest");
            var userClaimsAPIresponse = invokeAPI.processHttpRequest(null,kogUsrClaimApi,"POST",body,bearerToken);
                
            if (userClaimsAPIresponse.status === 200) {
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::223"+userClaimsAPIresponse.success);
                nodeState.putShared("tokenResponse",userClaimsAPIresponse.success);
              
                var processClaims = JSON.parse(userClaimsAPIresponse.success);            

                if(!processClaims[needkogvisitclaim]) {
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::"+nodeConfig.needkogvisitclaimValue+"::"+needkogvisit);
                    nodeState.putShared("needkogvisit",needkogvisit);
                
                } else {
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::"+nodeConfig.needkogvisitclaimValue+"::"
                                 +String(processClaims[needkogvisitclaim]).replace(/[\\"'"\\]/g, "").toLowerCase());
                    nodeState.putShared("needkogvisit",String(processClaims[needkogvisitclaim]).replace(/[\\"'"\\]/g, "").toLowerCase());
                }

                if(!processClaims[name]) {
                    nameValue = "";
                    nodeState.putShared("name",nameValue);
                } else {  
                   nameValue = processClaims[name];
                   nodeState.putShared("name",nameValue); 
                }

                 //Returns True if the value is an integer of the datatype Number. Otherwise false.
                if(Number.isInteger(processClaims[mfatype])) { 
                    
                    if(processClaims[mfatype] == 0 || processClaims[mfatype] == 3 || processClaims[mfatype] == 4 || processClaims[mfatype] == 5){
                       mfatypeValue = processClaims[mfatype];
                    } else {
                       mfatypeValue = 5;
                    }
                    //Putting this in nodeState to get the mfa code from read claims script. this will be used in MFA Authn Journey
                    nodeState.putShared("MFACodeForClaims",mfatypeValue)
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::"+nodeConfig.mfatypeClaimsValue+"::"+mfatypeValue);

                    if(mfatypeValue != 0){
                        if(typeof existingSession !== 'undefined' && existingSession.get("idpauthlevel")) {
                            if(Number(existingSession.get("idpauthlevel")) < Number(mfatypeValue))
                            {
                                isMFARequired = true; 
                            } else {
                                isMFARequired = false; 
                            }
                        } else {
                            isMFARequired = true; 
                        }
                        //Available MFA options as per Required MFA method code
                        var mfaOptions = requiredMFAMethods(mfatypeValue);

                        try{
                            //List of factors registered for the user
                            var response = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": "/KOGId eq \""+nodeState.get("KOGID")+"\""});
                            var custom_MFAMethods = JSON.parse(JSON.stringify(response.result));
                            for(var i=0;i<custom_MFAMethods.length;i++){
                                var method = JSON.parse(JSON.stringify(custom_MFAMethods[i]));
                                nodeLogger.debug("MFA method value is: "+method.MFAMethod+" | "+method.MFAStatus)
                                if(method.MFAStatus.localeCompare("ACTIVE")==0){
                                    if(!usrRegisteredFactors.includes(method.MFAMethod)){
                                        usrRegisteredFactors.push(method.MFAMethod);    
                                    }
                                }  
                            }
                            
                            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                +"::"+nodeConfig.scriptName+"::"+usrRegisteredFactors);

                            //Set isMFARegisterAllowed to true, if user is not registered for any MFA method per the "Required MFA method code"
                            var factorType = mfaOptions.filter(value => usrRegisteredFactors.includes(value));
                            if(factorType.length>0){
                                nodeLogger.debug("MFA Registeration not allowed");
                                isMFARegisterAllowed = false;
                            }      
                                
                        } catch(error){
                            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error); 
                            action.goTo(nodeOutcome.ERROR);
                        }
                        
                        
                    }  
 
                } else {
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::"+nodeConfig.mfatypeNotPresentInClaims);
                    
                }
                
                var setMFAContextJSON = {
                    "user": nodeState.get("mail"),
                    "isMFARequired": isMFARequired,
                    "requiredMFAMethodCode": mfatypeValue,
                    "isRegistrationAllowed":  isMFARegisterAllowed
                }

                nodeState.putShared("setMFAContext",setMFAContextJSON);
                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.respClaimsAPI+"::"+nodeConfig.apiResponsePass
                                 +"::"+userClaimsAPIresponse.status+"::"+JSON.stringify(setMFAContextJSON));
               
               action.goTo(nodeOutcome.SUCCESS).putSessionProperty('appClaims', userClaimsAPIresponse.success).putSessionProperty('name', nameValue);
                
            } else {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.getKOGAPPClaims_Failed+"::"+userClaimsAPIresponse.status);
                 action.goTo(nodeOutcome.ERROR);
            }
    
            
        } else {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.getAccessToken_Failed+"::"+response.status);
            action.goTo(nodeOutcome.ERROR);
        }
        
      }catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error); 
        action.goTo(nodeOutcome.ERROR);
      }
    nodeState.putShared("username",nodeState.get("mail"));
   }    

