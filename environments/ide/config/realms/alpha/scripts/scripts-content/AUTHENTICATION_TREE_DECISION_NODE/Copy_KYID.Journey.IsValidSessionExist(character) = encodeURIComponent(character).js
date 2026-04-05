/**
* Function: KYID.Journey.IsValidSessionExist
* Description: This script is used to check existing session of the user.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 6th August 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
        nodeName: " ",
    script: "Script",
    scriptName: "KYID.Journey.IsValidSessionExist",
    missingHeaders: "Missing origin header value",
    missingReqParam_goto: "Missing goto request parameter value",
    missingRequestURLParams: "Following mandatory request URL params are missing",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SESSION_EXIST: "hasSession",
     SESSION_NOTEXIST: "noSession",
     SetLocaleInURL:"SetLocaleInURL"
 };

 // Declare Global Variables
    var missingRequestParamsOrHeaders = [];
    var sharedStateVarsJSON = {};
    var appType = [];
    var count=0;
    var authIndexType = "";
    var authIndexValue = "";
    var AMAuthCookie = "";
    var spEntityID = "";
    var rprealm = "";
    var ReturnURL = "";
    var displayURL = "";
    var EntityID = "";
    var goto = "";
    var spEntityID="";
    var client_id= "";
    var state= "";
    var scope= "";
    var response_type= "";
    var redirect_uri= "";
    var isSAMLApp = false;
    var isWSFedApp = false;
    var isAuth0App = false;


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


function createRequestURL() {
    try{
        var langCookie ="en";
        nodeLogger.error("All the available requestParameters are: "+JSON.stringify(requestParameters));
       
        if (requestCookies.get("UserLanguagePreference") && requestCookies.get("UserLanguagePreference") != null) {
             if (requestCookies.get("UserLanguagePreference") === "es-MX") {
                langCookie = "es"
                nodeState.putShared("langCookie",langCookie);
             } else { 
                nodeState.putShared("langCookie",langCookie);
             }
        
         } else {
            nodeState.putShared("langCookie",langCookie);
         }
             
         
        if(requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {
            
            goto = "goto="+encodeURIComponent(requestParameters.get("goto").get(0))+"&";
            nodeLogger.error("goto URL encoded: "+encodeURIComponent(requestParameters.get("goto").get(0))); 

            if(requestHeaders.get("origin") && requestHeaders.get("origin") != null) {
                nodeLogger.error("Origin value from request header: "+requestHeaders.get("origin").get(0));
                var loginURL = decodeURIComponent(requestHeaders.get("origin").get(0))+"/am/XUI/?realm=/alpha&";
                nodeLogger.error("loginURL: "+loginURL);
            } else {
                 nodeLogger.error("Origin value from request header not found so capturing referer value");
                
                    var originESV = systemEnv.getProperty("esv.kyid.origin");  
                    if (originESV && originESV != null) {
                        var loginURL = originESV +"/am/XUI/?realm=/alpha&";
                        nodeLogger.error("loginURL: "+loginURL);
                    } else {
                        missingRequestParamsOrHeaders.push(nodeConfig.missingHeaders);
                    }
            }
        

            if(requestParameters.get("samlObjectKey") && requestParameters.get("samlObjectKey") != null){
                 samlObjectKey = "samlObjectKey="+decodeURIComponent(requestParameters.get("samlObjectKey").get(0))+"&";
            }

            if(requestParameters.get("client_id") && requestParameters.get("client_id") != null) {
                client_id ="client_id="+decodeURIComponent(requestParameters.get("client_id").get(0))+"&";
                
            }

            if(requestParameters.get("state") && requestParameters.get("state") != null) {
                state ="state="+decodeURIComponent(requestParameters.get("state").get(0))+"&";
                
            }
             if(requestParameters.get("scope") && requestParameters.get("scope") != null) {
                scope ="scope="+decodeURIComponent(requestParameters.get("scope").get(0))+"&";
                
            }
             if(requestParameters.get("response_type") && requestParameters.get("response_type") != null) {
                response_type ="response_type="+decodeURIComponent(requestParameters.get("response_type").get(0))+"&";
                
            }
              if(requestParameters.get("redirect_uri") && requestParameters.get("redirect_uri") != null) {
                redirect_uri ="redirect_uri="+decodeURIComponent(requestParameters.get("redirect_uri").get(0))+"&";
                
            }
                      

           // if(requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && !requestParameters.get("rp-realm")) {
            if(requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && readCookieValueFromSession("rp-realm")==null) {
                spEntityID = "spEntityID="+decodeURIComponent(requestParameters.get("spEntityID").get(0))+"&";
                EntityID = decodeURIComponent(requestParameters.get("spEntityID").get(0));
                nodeLogger.error("SAML displayURL: "+EntityID);
                isSAMLApp = true;
                ++count;  
                setAppAccessCount(EntityID, "SAML");
            } 
         
            //else if(requestParameters.get("rp-realm") && requestParameters.get("rp-realm") != null) {
            else if(readCookieValueFromSession("rp-realm")!=null) {
               //logger.error("*request parameters*" + requestParameters.get("rp-realm"));
                rprealm = "rp-realm="+decodeURIComponent(readCookieValueFromSession("rp-realm"))+"&";
                EntityID = decodeURIComponent(readCookieValueFromSession("rp-realm"));
                //displayURL = decodeURIComponent(requestParameters.get("ReturnURL").get(0));
                nodeLogger.error("WS-Fed displayURL: "+EntityID);
                isWSFedApp = true;
                //++count;
                count = 2;
                setAppAccessCount(EntityID, "WS-FED");
            } 

            //if(requestParameters.get("ReturnURL") && requestParameters.get("ReturnURL") != null) {
            if(readCookieValueFromSession("ReturnURL")!= null) {
                  ReturnURL = "ReturnURL="+decodeURIComponent(readCookieValueFromSession("ReturnURL"))+"&";
                  displayURL = decodeURIComponent(readCookieValueFromSession("ReturnURL"));
                  nodeLogger.error("displayURL: "+displayURL);  
                  AMAuthCookie = "AMAuthCookie=&";
             }
            
            if(count==0) {
                var gotoURL = requestParameters.get("goto").get(0);
                nodeLogger.error("Goto URL In Auth0: "+ gotoURL);
                var gotoURLArray = gotoURL.split("&")
                nodeLogger.error("Goto URL Array In Auth0: "+gotoURLArray);   
                if(gotoURL.includes("whr")){
                    nodeLogger.error("URL with whr param");
                    displayURL = gotoURLArray[1];
                    EntityID = displayURL.split("?")[0];
                    EntityID = EntityID.split("=")[1];
                    displayURL=EntityID;
                    nodeLogger.error("displayURL is: "+displayURL);
                    EntityID = extractApplicationIdentifier(EntityID);
                    nodeLogger.error("EntityID is: "+EntityID);
                    
                }  else {
                    nodeLogger.error("URL without whr param");                   
                    
                    if(gotoURL.includes("display")){
                        displayURL = gotoURLArray[0];
                        var displayURLContentArray = displayURL.split("?")
                        
                        if(displayURLContentArray.length >0){ 
                            if(displayURL.includes("client_id")){
                                nodeLogger.error("URL is OIDC")
                                EntityID = String(displayURLContentArray[1]).split("=")[1];
                                nodeLogger.error("OIDC Entity ID is" +EntityID);
                             
                               } else {
                                   EntityID = String(displayURLContentArray[1]).split("=");
                                   nodeLogger.error("URL is SAML or WSFED")
                                    //Extract app url from app integrated with auth0 2024/11/11    
                                    EntityID = extractApplicationIdentifier(String(EntityID[1]));
                                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                     +"::"+nodeConfig.scriptName+"::"+"KOGAppID::"+EntityID);
                                }
                           }               
                            displayURL=encodeURIComponent(displayURL.split("display=")[1]);
                            nodeLogger.error("Printing displayURL" +displayURL);
                    
                    } else{
                        if(requestParameters.get("redirect_uri")){
                            EntityID=decodeURIComponent(requestParameters.get("redirect_uri").get(0));
                            nodeLogger.error("Printing Entity ID from redirect URI" +EntityID);
                        
                         } else{
                            var match = gotoURL.match(/redirect_uri=([^&]*)/);
                            var redirectURI = match ? match[1] : null;
                            nodeLogger.error("Printing redirect URI if matched" +redirectURI);
                            EntityID = redirectURI;
                        }
                        displayURL=EntityID
                    }
                }

                //fix for klocs test case 2024/09/29
                /*displayURL = gotoURLArray[0];
               
                var displayURLContentArray = displayURL.split("?")
                if(displayURLContentArray.length >0){
                    EntityID = displayURL.split("?")[1];
                    EntityID = EntityID.split("=")[1];
                    EntityID = extractApplicationIdentifier(EntityID)
                    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+"KOGAppID::"+extractApplicationIdentifier(EntityID));
                }else{
                    //condition needs to be handled if required.
                }*/
                
                setAppAccessCount(EntityID, "Auth0");
                
            } 
            else if(isSAMLApp) {
                displayURL=getApplicationMetadata(EntityID);
                //logger.error("Display URL in IsValidSession: "+ displayURL);
            }
            
            if(requestParameters.get("authIndexType") && requestParameters.get("authIndexType") != null) {
                authIndexType = "authIndexType="+decodeURIComponent(requestParameters.get("authIndexType").get(0))+"&";
            } 

            if(requestParameters.get("authIndexValue") && requestParameters.get("authIndexValue") != null) {
                var authIndexValue = decodeURIComponent(requestParameters.get("authIndexValue").get(0));
                authIndexValue = authIndexValue.replace(/\n/g, '')
                authIndexValue =  "authIndexValue="+ authIndexValue;  
            } 

            if(missingRequestParamsOrHeaders.length>0){
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingRequestURLParams+"::"+missingRequestParamsOrHeaders);
                nodeState.putShared("GoToURLPresent",false) 
                
            } else {
                if(count==0){
                    appType.push("Auth0"); 
                    nodeLogger.error("Auth0 APP"); 
                } else if(count==1){
                    appType.push("SAML");
                    nodeLogger.error("SAML APP"); 
                } else if(count==2){
                    nodeLogger.error("WS-FED APP");
                    appType.push("WS-FED"); 
                }

                if(requestParameters.get("samlObjectKey")){
                    logger.error("IN Side if samlObjectKey ")
              
                 var requestURL = loginURL+spEntityID+samlObjectKey+goto+ReturnURL+rprealm+AMAuthCookie+authIndexType+authIndexValue;
                }
                else if(requestParameters.get("redirect_uri")){
                     var requestURL = loginURL+spEntityID+goto+response_type+redirect_uri+scope+state+client_id+ReturnURL+rprealm+AMAuthCookie+authIndexType+authIndexValue;
                }
                else{
                     var requestURL = loginURL+spEntityID+goto+ReturnURL+rprealm+AMAuthCookie+authIndexType+authIndexValue;
                }

                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+"RequestURL :: "+requestURL);
                nodeState.putShared("requestURL",requestURL);
                nodeState.putShared("returnURL",displayURL);
                nodeState.putShared("EntityID",EntityID);
                nodeState.putShared("appType",appType);
                nodeState.putShared("goto",decodeURIComponent(requestParameters.get("goto").get(0)));
                nodeState.putShared("GoToURLPresent",true);
            }

        } else {
            missingRequestParamsOrHeaders.push(nodeConfig.missingReqParam_goto);
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingRequestURLParams+"::"+missingRequestParamsOrHeaders);
            nodeState.putShared("GoToURLPresent",false) 
        }
        
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
    }
}


function getApplicationMetadata(entityID) {
    try { 
        var appRecords = openidm.query("managed/alpha_kyid_application_metadata", { "_queryFilter" : '/forgerockAppId eq "'+entityID+'"'});
        var appData = JSON.parse(JSON.stringify(appRecords.result[0]));
        return appData["kogAppUrl"];
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
    }
}


function setAppAccessCount(applicationName, applicationType) {
    var applicationObject;
    var accessCount, successCount, failureCount;
    var response;
    var jsonArray = []; 
    
    response= openidm.query("managed/alpha_kyid_application_access_data", { "_queryFilter": "/name eq \""+applicationName+"\""}, ["name", "accessCount", "successCount", "failureCount"]);
    nodeState.putShared('appCountDataName', applicationName);
    
    if (response.result.length==1) {
        //application object exists
            applicationObject = response.result[0];
            action.goTo('true');
    } else {
        //application object does not exist
        var jsonObj = {};
        jsonObj['name'] = applicationName;
        jsonObj['type'] = applicationType;
        jsonObj['accessCount'] = 0;
        jsonObj['successCount'] = 0;
        jsonObj['failureCount'] = 0;
        applicationObject = openidm.create("managed/alpha_kyid_application_access_data", null, jsonObj);
    }
    //update access count
    accessCount = applicationObject['accessCount'];

    if (accessCount == 0) {
      openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
          "operation": "replace",
          "field": "firstAccess",
          "value": new Date().toISOString()
        },{
          "operation": "replace",
          "field": "lastAccess",
          "value": new Date().toISOString()
        }]);
    } else {
        openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
          "operation": "replace",
          "field": "lastAccess",
          "value": new Date().toISOString()
        }]);
    }
    
    accessCount = accessCount + 1
    openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
      "operation": "replace",
      "field": "accessCount",
      "value": accessCount
    },{
      "operation": "replace",
      "field": "type",
      "value": applicationType
    }]);
}

function extractApplicationIdentifier (displayURL){
    var urlWithoutHttps=""
    var urlHost=""
    var urlHome=""
    urlWithoutHttps = displayURL.split("//")[1]
    urlHost=urlWithoutHttps.split("/")[0]
    urlHome=urlWithoutHttps.split("/")[1]
    
    if (urlHome === null || urlHome === undefined || !urlHome){
        return "https://"+urlHost
    } else {
        return "https://"+urlHost+"/"+urlHome
    }
}


function readCookieValueFromSession(appCookieName){

    var matchedCookieValue = null;  // Initialize matchedCookieValue to store the matched cookie value

    // Use requestHeaders.get to get the cookie header
    var cookieHeader = requestHeaders.get("Cookie");
    
    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
        nodeLogger.debug("Cookies present in Request Header are: " + rawCookie);

        var rawCookieParams = rawCookie.split(";");

        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=")+1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();

            // Compare the cookie name with input param
            if (cookie.localeCompare(appCookieName) == 0) {
                nodeLogger.debug("Found matching cookie: " + cookieName[0]);
                
                // Check if cookie value exists
                if (cookieName.length > 1) {
                    //matchedCookieValue = cookieName[1].trim();  // Assign the matched value
                    matchedCookieValue = cookieValue.trim();  // Assign the matched value
                    nodeLogger.debug("Matched cookie value: " + matchedCookieValue);
                } else {
                    nodeLogger.debug("Cookie value for " + targetCookieName + " is empty or malformed.");
                }
            }
         }
      }  else {
            nodeLogger.error("No cookies found in request headers");
    }
   //} 
    
    return matchedCookieValue;
}


function readSharedStateLoginCookieValues(){

    var cookieHeader = requestHeaders.get("Cookie");
    
    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
        nodeLogger.error("Cookies present in Session are: " + rawCookie);

        var rawCookieParams = rawCookie.split(";");

        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=")+1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();
            logger.error(cookie + " :: "+cookieValue);

            if(cookie.localeCompare("sharedStateLoginCookie") == 0){
                var cookieJSON = JSON.parse(cookieValue.replace(/\\/g, '"'));
                logger.error("cookieJSON "+cookieJSON.requestURL);

                nodeState.putShared("requestURL",cookieJSON.requestURL);
                nodeState.putShared("returnURL",cookieJSON.returnURL);
                nodeState.putShared("EntityID",cookieJSON.EntityID);
                nodeState.putShared("appType",cookieJSON.appType);
                nodeState.putShared("goto",cookieJSON.goto);
                nodeState.putShared("GoToURLPresent",cookieJSON.GoToURLPresent);
                nodeState.putShared("appCountDataName",cookieJSON.appCountDataName);
                nodeState.putShared("langCookie",cookieJSON.langCookie);
            }
        }
    }
}

//adding this logic to remove the rp-realm from the IDP SSO 
function deleteCookieFromSession(appCookieName) {
    var cookieHeader = requestHeaders.get("Cookie");
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"
                     +nodeConfig.scriptName+"::printing existing cookieHeader" + cookieHeader);
   if (cookieHeader) {
       // Split the cookies into key-value pairs
       var cookies = cookieHeader.get(0).split("; ");
       // Specify the cookie name you want to remove
       var cookieToDelete = appCookieName;
       // Filter out the cookie to delete
       cookies = cookies.filter(cookie => !cookie.startsWith(cookieToDelete + "="));
       // Reconstruct the Cookie header
       var updatedCookieHeader = cookies.join("; ");
       requestHeaders.get("Cookie").set(0,updatedCookieHeader);
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"
                        +nodeConfig.scriptName+"::printing cookieHeader after rp-realm removal" + requestHeaders.get("Cookie"));
   
   }
}

function main(){

    try {
           //this is specific to IDP Initiated flow for SAML App to remove rp-realm from cookie
            if(requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                             +nodeConfig.script+"::"+nodeConfig.scriptName+"::Printing all requestParameters before removal" +JSON.stringify(requestParameters));
            var gotoURL = requestParameters.get("goto").get(0); 
            nodeLogger.error(nodeConfig.script+"::"+nodeConfig.scriptName+"::Printing gotoURL" +gotoURL);
            if (gotoURL && gotoURL.includes("idpSSOInit.jsp")) {
                 nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                                  +nodeConfig.script+"::"+nodeConfig.scriptName+" idpSSOInit.jsp is present in the goto parameter. Its an IDP Initiated request");
                 deleteCookieFromSession("rp-realm");
                if(requestParameters && requestParameters.get("rp-realm") && requestParameters.get("rp-realm") != null) {
                    //requestParameters.remove("rp-realm");
                    delete requestParameters.rp-realm;
                    requestParameters = JSON.parse(requestParameters);
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                                     +nodeConfig.script+"::"+nodeConfig.scriptName+"::Printing all requestParameters after removal" +JSON.stringify(requestParameters));
                 }
                 else {
                       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                                        +nodeConfig.script+"::"+nodeConfig.scriptName+"::Parameter rp-realm not found in requestParameters.");
                 }
            } else {
                  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                                   +nodeConfig.script+"::"+nodeConfig.scriptName+" idpSSOInit.jsp is NOT present in the goto parameter.");
            }
          }  else {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                             +nodeConfig.script+"::"+nodeConfig.scriptName+" goto parameter not found in requestParameters.");
          } 
         
        createRequestURL();
        
        var requestURL =nodeState.get("requestURL");
        if (!requestParameters.get("clocale")) {      
            if (requestCookies.get("UserLanguagePreference")) {            
                if (requestCookies.get("UserLanguagePreference") === "es-MX") {
                    var link = requestURL + "&locale=es&clocale=es"
                    nodeState.putShared("link", link);
                    action.goTo(nodeOutcome.SetLocaleInURL);
                } else {
                    var link = requestURL + "&locale=en&clocale=en"
                    nodeState.putShared("link", link);
                    action.goTo(nodeOutcome.SetLocaleInURL);
                }            
            } else {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"UserLanguagePreference cookie not present");
                var link = requestURL + "&locale=en&clocale=en"
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: appending clocale and locale to EN"+ link);
                nodeState.putShared("link", link);
                action.goTo(nodeOutcome.SetLocaleInURL);
             }
        
        } else if(typeof existingSession != 'undefined'){
            action.goTo(nodeOutcome.SESSION_EXIST);      
        } else{
            action.goTo(nodeOutcome.SESSION_NOTEXIST);
        }
    
    } catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}

//Invoke Main Function
main();

