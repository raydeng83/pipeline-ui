/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 var dateTime = new Date().toISOString();

 // Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Set Login URL Cookies",
    script: "Script",
    scriptName: "kyid_loginMainRouterJourney",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };


 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "True",
     ERROR: "False"
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


 /*
  Name: getLocale()
  Description: Reads locale value from clocale cookie
  Returns: If clocale cookie present, returns clocale value. 
           Otherwise, returns default "en" as clocale value.
 */
 function getLocale() {
    
   var clocale = "en";
   
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   
   return clocale;
 }

 // Declare Global Variables
    var missingRequestParamsOrHeaders = [];
    var appType = [];
    var sharedStateVarsJSON = {};
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
    var isSAMLApp = false;
    var isWSFedApp = false;
    var isAuth0App = false;


   function createRequestURL() {
    try{
        var langCookie ="en";
        nodeLogger.error("All the available requestParameters are: "+JSON.stringify(requestParameters));
        //if (requestParameters.get("clocale") && requestParameters.get("clocale") != null) {
        if(readCookieValueFromSession("clocale")!=null) {
            langCookie = readCookieValueFromSession("clocale");
            nodeState.putShared("langCookie",langCookie);
            sharedStateVarsJSON["langCookie"] = langCookie;
        }
        if(requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {

            goto = "goto="+decodeURIComponent(requestParameters.get("goto").get(0))+"&";
            nodeLogger.error("goto URL: "+decodeURIComponent(requestParameters.get("goto").get(0))); //Remove later
            
            if(requestHeaders.get("origin").get(0) && requestHeaders.get("origin").get(0) != null) {
                var loginURL = decodeURIComponent(requestHeaders.get("origin").get(0))+"/am/XUI/?realm=/alpha&";
                nodeLogger.error("loginURL: "+loginURL);
            } else {
                missingRequestParamsOrHeaders.push(nodeConfig.missingHeaders);
            }

           // if(requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && !requestParameters.get("rp-realm")) {
            if(requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && readCookieValueFromSession("rp-realm")==null) {
                spEntityID = "spEntityID="+decodeURIComponent(requestParameters.get("spEntityID").get(0))+"&";
                EntityID = decodeURIComponent(requestParameters.get("spEntityID").get(0));
                nodeLogger.error("SAML displayURL: "+EntityID);
                isSAMLApp = true;
                ++count;  
                setAppAccessCount(EntityID, "SAML");
                sharedStateVarsJSON["appCountDataName"]=EntityID;
            } 
            
            
            //else if(requestParameters.get("rp-realm") && requestParameters.get("rp-realm") != null) {
            else if(readCookieValueFromSession("rp-realm")!=null) {
               //logger.error("*request parameters*" + requestParameters.get("rp-realm"));
                rprealm = "rp-realm="+decodeURIComponent(readCookieValueFromSession("rp-realm"))+"&";
                EntityID = decodeURIComponent(readCookieValueFromSession("rp-realm"));
                //displayURL = decodeURIComponent(requestParameters.get("ReturnURL").get(0));
                nodeLogger.error("WS-Fed displayURL: "+EntityID);
                isWSFedApp = true;
                ++count;
                setAppAccessCount(EntityID, "WS-FED");
                sharedStateVarsJSON["appCountDataName"]=EntityID;
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
                    nodeLogger.error("URL with whr param")
                    displayURL = gotoURLArray[1];
                    EntityID = displayURL.split("?")[0];
                    EntityID = EntityID.split("=")[1];
                    
                }  else {
                    nodeLogger.error("URL without whr param");
                    displayURL = gotoURLArray[0];
                    var displayURLContentArray = displayURL.split("?")
                    if(displayURLContentArray.length >0){
                        EntityID = String(displayURLContentArray[1]).split("=");
                        //Extract app url from app integrated with auth0 2024/11/11    
                        EntityID = extractApplicationIdentifier(String(EntityID[1]));
                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+"KOGAppID::"+EntityID);
                    }
                    displayURL=encodeURIComponent(displayURL.split("display=")[1]);
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
                sharedStateVarsJSON["appCountDataName"]=EntityID;
                
            } 
            else if(isSAMLApp) {
                displayURL=getApplicationMetadata(EntityID);
                //logger.error("Display URL in IsValidSession: "+ displayURL);
            }
            
            if(requestParameters.get("authIndexType") && requestParameters.get("authIndexType") != null) {
                authIndexType = "authIndexType="+decodeURIComponent(requestParameters.get("authIndexType").get(0))+"&";
            } 

            if(requestParameters.get("authIndexValue") && requestParameters.get("authIndexValue") != null) {
               authIndexValue =  "authIndexValue="+decodeURIComponent(requestParameters.get("authIndexValue").get(0));
                 // authIndexValue =  "authIndexValue=kyid_loginMain"
            } 

            if(missingRequestParamsOrHeaders.length>0){
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingRequestURLParams+"::"+missingRequestParamsOrHeaders);
                nodeState.putShared("GoToURLPresent",false) 
                sharedStateVarsJSON["GoToURLPresent"] = false;
                
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
                
                var requestURL = loginURL+spEntityID+goto+ReturnURL+rprealm+AMAuthCookie+authIndexType+authIndexValue;
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+requestURL);
                sharedStateVarsJSON["requestURL"]=requestURL;
                sharedStateVarsJSON["returnURL"]=displayURL;
                sharedStateVarsJSON["EntityID"]=EntityID;
                sharedStateVarsJSON["appType"]=appType;
                sharedStateVarsJSON["goto"]=decodeURIComponent(requestParameters.get("goto").get(0));
                sharedStateVarsJSON["GoToURLPresent"]=true;
                nodeState.putShared("sharedStateVarsJSON",JSON.stringify(sharedStateVarsJSON));
                nodeLogger.error("sharedStateVarsJSON value: "+JSON.stringify(sharedStateVarsJSON));

                finalUrl = requestURL;
                nodeState.putShared("finalLoginUrl",finalUrl);
                nodeState.putShared("localeLoginUrl",getLocale());
                nodeLogger.error("Final Login URL is::::::"+finalUrl);
                
            }

        } else {
            missingRequestParamsOrHeaders.push(nodeConfig.missingReqParam_goto);
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingRequestURLParams+"::"+missingRequestParamsOrHeaders);
            nodeState.putShared("GoToURLPresent",false) 
            sharedStateVarsJSON["GoToURLPresent"]=false;
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
    
    return "https://"+urlHost+"/"+urlHome
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


function main(){

    try {
        createRequestURL();
        action.goTo(nodeOutcome.SUCCESS);
    
    } catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.ERROR);
    }
}

main();
