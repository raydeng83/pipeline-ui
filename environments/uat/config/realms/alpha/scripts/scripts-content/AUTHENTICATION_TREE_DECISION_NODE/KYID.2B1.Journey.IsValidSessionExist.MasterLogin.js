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
    nodeName: "Check Existing Session",
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
    SetLocaleInURL: "SetLocaleInURL"
};

// Declare Global Variables
var missingRequestParamsOrHeaders = [];
var sharedStateVarsJSON = {};
var appType = [];
var count = 0;
var authIndexType = "";
var authIndexValue = "";
var AMAuthCookie = "";
var spEntityID = "";
var rprealm = "";
var ReturnURL = "";
var displayURL = "";
var EntityID = "";
var goto = "";
var spEntityID = "";
var client_id = "";
var state = "";
var scope = "";
var response_type = "";
var redirect_uri = "";
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

// Generate a random GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                value = c == 'x' ? r : (r & 0x3 | 0x8);
            return value.toString(16);
        });
}

function createRequestURL(reqIDCookies) {
    try {
        var langCookie = "en";
        nodeLogger.debug("All the available requestParameters are: " + JSON.stringify(requestParameters));
        if (requestCookies.get("UserLanguagePreference") && requestCookies.get("UserLanguagePreference") != null) {
            if (requestCookies.get("UserLanguagePreference") === "es-MX") {
                langCookie = "es"
                nodeState.putShared("langCookie", langCookie);
            } else {
                nodeState.putShared("langCookie", langCookie);
            }

        } else {
            //Change for TFS 182954 on 4-Feb-2025 for accept language header
            var langCookie1 = nodeState.get("langCookie")
            nodeState.putShared("langCookie", langCookie1);
        }


        if (requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {

            goto = "goto=" + encodeURIComponent(requestParameters.get("goto").get(0)) + "&";

            if (requestHeaders.get("origin") && requestHeaders.get("origin") != null) {
                var loginURL = decodeURIComponent(requestHeaders.get("origin").get(0)) + "/am/XUI/?realm=/alpha&";
            } else {
                nodeLogger.debug("Origin value from request header not found so capturing referer value");

                var esvOriginProperty = systemEnv.getProperty("esv.kyid.cookie.domain")
                var originESV = "https://sso" + esvOriginProperty

                if (originESV && originESV != null) {
                    var loginURL = originESV + "/am/XUI/?realm=/alpha&";
                } else {
                    logger.debug("Missing or invalid origin ESV. Cannot construct login URL.");
                    missingRequestParamsOrHeaders.push(nodeConfig.missingHeaders);
                }
                // var originESV = systemEnv.getProperty("esv.kyid.origin");  
                // var originESV = "https://sso.dev2.kyid.ky.gov"
                //     if (originESV && originESV != null) {
                //         var loginURL = originESV +"/am/XUI/?realm=/alpha&";
                //     } else {
                //         missingRequestParamsOrHeaders.push(nodeConfig.missingHeaders);
                //     }
            }

            // var gotoURL1 = requestParameters.get("goto").get(0)
            // var gotoURLArray = gotoURL1.split("&")
            // var gotURLForReqId=gotoURLArray[0];
            // var RequestIdString=gotURLForReqId.split("?")[2]
            // var decodeReqIdStr=decodeURIComponent(RequestIdString).split("&")[0]
            //    // var decodeReqIdStr=decodeURIComponent(RequestIdString).split("&")[1]//for Transaction_ID
            // var ReqID=decodeReqIdStr.split("=")[1]
            // nodeState.putShared("ReqID",ReqID)


            if (requestParameters.get("samlObjectKey") && requestParameters.get("samlObjectKey") != null) {
                samlObjectKey = "samlObjectKey=" + decodeURIComponent(requestParameters.get("samlObjectKey").get(0)) + "&";
            }

            if (requestParameters.get("client_id") && requestParameters.get("client_id") != null) {
                client_id = "client_id=" + decodeURIComponent(requestParameters.get("client_id").get(0)) + "&";

            }

            if (requestParameters.get("state") && requestParameters.get("state") != null) {
                state = "state=" + decodeURIComponent(requestParameters.get("state").get(0)) + "&";

            }
            if (requestParameters.get("scope") && requestParameters.get("scope") != null) {
                scope = "scope=" + decodeURIComponent(requestParameters.get("scope").get(0)) + "&";

            }
            if (requestParameters.get("response_type") && requestParameters.get("response_type") != null) {
                response_type = "response_type=" + decodeURIComponent(requestParameters.get("response_type").get(0)) + "&";

            }
            if (requestParameters.get("redirect_uri") && requestParameters.get("redirect_uri") != null) {
                redirect_uri = "redirect_uri=" + decodeURIComponent(requestParameters.get("redirect_uri").get(0)) + "&";

            }

            //if(requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && readCookieValueFromSession("rp-realm")==null) {
            if (requestParameters.get("spEntityID") && requestParameters.get("spEntityID") != null && reqIDCookies.rprealm == null) {
                spEntityID = "spEntityID=" + decodeURIComponent(requestParameters.get("spEntityID").get(0)) + "&";
                EntityID = decodeURIComponent(requestParameters.get("spEntityID").get(0));
                nodeLogger.debug("SAML displayURL: " + EntityID);
                isSAMLApp = true;
                ++count;
                setAppAccessCount(EntityID, "SAML");
            }

            //else if(readCookieValueFromSession("rp-realm")!=null) {
            else if (reqIDCookies.rprealm != null) {
                //rprealm = "rp-realm="+decodeURIComponent(readCookieValueFromSession("rp-realm"))+"&";
                //EntityID = decodeURIComponent(readCookieValueFromSession("rp-realm"));
                rprealm = "rp-realm=" + decodeURIComponent(reqIDCookies.rprealm) + "&";
                EntityID = decodeURIComponent(reqIDCookies.rprealm);
                //displayURL = decodeURIComponent(requestParameters.get("ReturnURL").get(0));
                nodeLogger.debug("WS-Fed displayURL: " + EntityID);
                isWSFedApp = true;
                ++count;
                ++count;
                //count = 2;
                logger.debug("count is" + count)
                //setAppAccessCount(EntityID, "WS-FED");
            }

            //if(readCookieValueFromSession("ReturnURL")!= null) {
            if (reqIDCookies.ReturnURL != null) {
                //ReturnURL = "ReturnURL="+decodeURIComponent(readCookieValueFromSession("ReturnURL"))+"&";
                //ReturnURL = "ReturnURL="+encodeURIComponent(readCookieValueFromSession("ReturnURL")+"#/explore&forceSitePick=false&sendPodInfo=false&authSetting=&siteLuid=&embedded=false")+"&";
                //displayURL = decodeURIComponent(readCookieValueFromSession("ReturnURL"));

                //ReturnURL = "ReturnURL="+encodeURIComponent(readCookieValueFromSession("ReturnURL"))+"&";  /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
                ReturnURL = "ReturnURL=" + encodeURIComponent(reqIDCookies.ReturnURL) + "&";  /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
                nodeLogger.debug("ReturnURL: " + ReturnURL);
                //displayURL = encodeURIComponent(readCookieValueFromSession("ReturnURL"));   /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
                displayURL = encodeURIComponent(reqIDCookies.ReturnURL);   /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
                nodeLogger.debug("displayURL: " + displayURL);
                AMAuthCookie = "AMAuthCookie=&";
            }

            if (count == 0) {
                var gotoURL = requestParameters.get("goto").get(0);
                nodeLogger.debug("Goto URL In Auth0: " + gotoURL);
                var gotoURLArray = gotoURL.split("&")
                nodeLogger.debug("Goto URL Array In Auth0: " + gotoURLArray);

                if (gotoURL.includes("whr")) {
                    nodeLogger.debug("URL with whr param");
                    displayURL = gotoURLArray[1];
                    EntityID = displayURL.split("?")[0];
                    EntityID = EntityID.split("=")[1];
                    displayURL = EntityID;
                    nodeLogger.debug("displayURL is: " + displayURL);
                    EntityID = extractApplicationIdentifier(EntityID);
                    nodeLogger.debug("EntityID is: " + EntityID);

                } else {
                    nodeLogger.debug("URL without whr param");

                    if (gotoURL.includes("display")) {
                        displayURL = gotoURLArray[0];
                        var displayURLContentArray = displayURL.split("?")

                        if (displayURLContentArray.length > 0) {
                            if (displayURL.includes("client_id")) {
                                nodeLogger.debug("URL is OIDC")
                                EntityID = String(displayURLContentArray[1]).split("=")[1];
                                nodeLogger.debug("OIDC Entity ID is" + EntityID);

                            } else {
                                EntityID = String(displayURLContentArray[1]).split("=");
                                nodeLogger.debug("URL is SAML or WSFED")
                                //Extract app url from app integrated with auth0 2024/11/11    
                                EntityID = extractApplicationIdentifier(String(EntityID[1]));
                                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                                    + "::" + nodeConfig.scriptName + "::" + "KOGAppID::" + EntityID);
                            }
                        }
                        displayURL = encodeURIComponent(displayURL.split("display=")[1]);
                        nodeLogger.debug("Printing displayURL" + displayURL);

                    } else {
                        if (requestParameters.get("redirect_uri")) {
                            EntityID = decodeURIComponent(requestParameters.get("redirect_uri").get(0));
                            nodeLogger.debug("Printing Entity ID from redirect_URI" + EntityID);

                        } else {
                            var match = gotoURL.match(/redirect_uri=([^&]*)/);
                            var redirectURI = match ? match[1] : null;
                            nodeLogger.debug("Printing redirect URI if matched" + redirectURI);
                            EntityID = redirectURI;
                        }
                        displayURL = EntityID
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
            else if (isSAMLApp) {
                displayURL = getApplicationMetadata(EntityID);
                logger.debug("Display URL in IsValidSession: " + displayURL);
            }

            if (requestParameters.get("authIndexType") && requestParameters.get("authIndexType") != null) {
                authIndexType = "authIndexType=" + decodeURIComponent(requestParameters.get("authIndexType").get(0)) + "&";
            }

            if (requestParameters.get("authIndexValue") && requestParameters.get("authIndexValue") != null) {
                var authIndexValue = decodeURIComponent(requestParameters.get("authIndexValue").get(0));
                logger.debug("authIndexValue in isValidSession" + authIndexValue)
                authIndexValue = authIndexValue.replace(/\n/g, '')
                authIndexValue = "authIndexValue=" + authIndexValue;
            }

            if (missingRequestParamsOrHeaders.length > 0) {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                    + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingRequestURLParams + "::284" + missingRequestParamsOrHeaders);
                nodeState.putShared("GoToURLPresent", false)

            } else {
                if (count == 0) {
                    appType.push("Auth0");
                    //nodeState.putShared("applicationType","oidc");
                    nodeLogger.debug("Auth0 APP");
                } else if (count == 1) {
                    appType.push("SAML");
                    nodeLogger.debug("SAML APP");
                } else if (count == 2) {
                    nodeLogger.debug("WS-FED APP");
                    appType.push("WS-FED");
                }

                if (requestParameters.get("samlObjectKey")) {
                    logger.debug("IN Side if samlObjectKey ")

                    var requestURL = loginURL + spEntityID + samlObjectKey + goto + ReturnURL + rprealm + AMAuthCookie + authIndexType + authIndexValue;
                }
                else if (requestParameters.get("redirect_uri")) {
                    var requestURL = loginURL + spEntityID + goto + response_type + redirect_uri + scope + state + client_id + ReturnURL + rprealm + AMAuthCookie + authIndexType + authIndexValue;
                }
                else {
                    var requestURL = loginURL + spEntityID + goto + ReturnURL + rprealm + AMAuthCookie + authIndexType + authIndexValue;
                }

                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                    + "::" + nodeConfig.scriptName + "::" + "RequestURL :: " + requestURL);
                nodeState.putShared("requestURL", requestURL);
                nodeState.putShared("returnURL", displayURL);

                nodeState.putShared("EntityID", EntityID);
                logger.debug("The entityID fetched is::: " + EntityID);
                nodeState.putShared("appType", appType);
                nodeState.putShared("goto", decodeURIComponent(requestParameters.get("goto").get(0)));
                nodeState.putShared("GoToURLPresent", true);
            }

        } else {
            missingRequestParamsOrHeaders.push(nodeConfig.missingReqParam_goto);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingRequestURLParams + "::" + missingRequestParamsOrHeaders);
            nodeState.putShared("GoToURLPresent", false)
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
            + "::" + nodeConfig.scriptName + "::" + error);
    }
}


function getApplicationMetadata(entityID) {
    try {
        var appRecords = openidm.query("managed/alpha_kyid_application_metadata", { "_queryFilter": '/forgerockAppId eq "' + entityID + '"' });
        var appData = JSON.parse(JSON.stringify(appRecords.result[0]));
        return appData["kogAppUrl"];
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmQueryFail + "::" + error);
    }
}


function setAppAccessCount(applicationName, applicationType) {
    var applicationObject;
    var accessCount, successCount, failureCount;
    var response;
    var jsonArray = [];

    response = openidm.query("managed/alpha_kyid_application_access_data", { "_queryFilter": "/name eq \"" + applicationName + "\"" }, ["name", "accessCount", "successCount", "failureCount"]);
    nodeState.putShared('appCountDataName', applicationName);

    if (response.result.length == 1) {
        //application object exists
        applicationObject = response.result[0];
        action.goTo('true');
    } else {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        //application object does not exist
        var jsonObj = {};
        jsonObj['name'] = applicationName;
        jsonObj['type'] = applicationType;
        jsonObj['accessCount'] = 0;
        jsonObj['successCount'] = 0;
        jsonObj['failureCount'] = 0;
        jsonObj['createDate'] = auditData.createdDate;
            jsonObj['createdBy'] = auditData.createdBy;
            jsonObj['updatedBy'] = auditData.updatedBy;
            jsonObj['updateDate'] = auditData.updateDate;
            jsonObj['createDateEpoch'] = auditData.createdDateEpoch;
            jsonObj['updateDateEpoch'] = auditData.updatedDateEpoch;
            jsonObj['createdByID'] = auditData.createdByID;
            jsonObj['updatedByID'] = auditData.updatedByID;


            applicationObject = openidm.create("managed/alpha_kyid_application_access_data", null, jsonObj);
    }
    //update access count
    accessCount = applicationObject['accessCount'];
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    if (accessCount == 0) {
        openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
            "operation": "replace",
            "field": "firstAccess",
            "value": new Date().toISOString()
        }, {
            "operation": "replace",
            "field": "lastAccess",
            "value": new Date().toISOString()
        }, {
            "operation": "replace",
            "field": "updateDate",
            "value": auditData.updatedDate
        }, {

            "operation": "replace",
            "field": "updateDateEpoch",
            "value": auditData.updatedDateEpoch
        }, {

            "operation": "replace",
            "field": "updatedBy",
            "value": auditData.updatedBy
        }, {

            "operation": "replace",
            "field": "updatedByID",
            "value": auditData.updatedByID
        }]);
    } else {
        openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
            "operation": "replace",
            "field": "lastAccess",
            "value": new Date().toISOString()
        }, {
            "operation": "replace",
            "field": "updateDate",
            "value": auditData.updatedDate
        }, {

            "operation": "replace",
            "field": "updateDateEpoch",
            "value": auditData.updatedDateEpoch
        }, {

            "operation": "replace",
            "field": "updatedBy",
            "value": auditData.updatedBy
        }, {

            "operation": "replace",
            "field": "updatedByID",
            "value": auditData.updatedByID
        }]);
    }

    accessCount = accessCount + 1
    openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
        "operation": "replace",
        "field": "accessCount",
        "value": accessCount
    }, {
        "operation": "replace",
        "field": "type",
        "value": applicationType
    }, {
        "operation": "replace",
        "field": "updateDate",
        "value": auditData.updatedDate
    }, {

        "operation": "replace",
        "field": "updateDateEpoch",
        "value": auditData.updatedDateEpoch
    }, {

        "operation": "replace",
        "field": "updatedBy",
        "value": auditData.updatedBy
    }, {

        "operation": "replace",
        "field": "updatedByID",
        "value": auditData.updatedByID
    }

    ]);
}

// function setAppAccessCount(applicationName, applicationType) {
//     var applicationObject;
//     var accessCount, successCount, failureCount;
//     var response;
//     var jsonArray = []; 
    
//     response= openidm.query("managed/alpha_kyid_application_access_data", { "_queryFilter": "/name eq \""+applicationName+"\""}, ["name", "accessCount", "successCount", "failureCount"]);
//     nodeState.putShared('appCountDataName', applicationName);
    
//     if (response.result.length==1) {
//         //application object exists
//             applicationObject = response.result[0];
//             action.goTo('true');
//     } else {
//         //application object does not exist
//         var jsonObj = {};
//         jsonObj['name'] = applicationName;
//         jsonObj['type'] = applicationType;
//         jsonObj['accessCount'] = 0;
//         jsonObj['successCount'] = 0;
//         jsonObj['failureCount'] = 0;
//         applicationObject = openidm.create("managed/alpha_kyid_application_access_data", null, jsonObj);
//     }
//     //update access count
//     accessCount = applicationObject['accessCount'];

//     if (accessCount == 0) {
//       openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
//           "operation": "replace",
//           "field": "firstAccess",
//           "value": new Date().toISOString()
//         },{
//           "operation": "replace",
//           "field": "lastAccess",
//           "value": new Date().toISOString()
//         }]);
//     } else {
//         openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
//           "operation": "replace",
//           "field": "lastAccess",
//           "value": new Date().toISOString()
//         }]);
//     }
    
//     accessCount = accessCount + 1
//     openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
//       "operation": "replace",
//       "field": "accessCount",
//       "value": accessCount
//     },{
//       "operation": "replace",
//       "field": "type",
//       "value": applicationType
//     }]);
// }

function extractApplicationIdentifier(displayURL) {
    var urlWithoutHttps = ""
    var urlHost = ""
    var urlHome = ""
    urlWithoutHttps = displayURL.split("//")[1]
    urlHost = urlWithoutHttps.split("/")[0]
    urlHome = urlWithoutHttps.split("/")[1]

    if (urlHome === null || urlHome === undefined || !urlHome) {
        return "https://" + urlHost
    } else {
        return "https://" + urlHost + "/" + urlHome
    }
}


function readCookieValueFromSession(appCookieName) {

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
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=") + 1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();

            // Compare the cookie name with input param
            if (cookie.localeCompare(appCookieName) == 0) {
                nodeLogger.debug("Found matching cookie: " + cookieName[0]);
                logger.debug("Found matching cookie: " + cookieName[0]);

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
    } else {
        nodeLogger.debug("No cookies found in request headers");
    }
    //} 

    return matchedCookieValue;
}


function readSharedStateLoginCookieValues() {

    var cookieHeader = requestHeaders.get("Cookie");

    if (cookieHeader && cookieHeader.get(0)) {
        var rawCookie = cookieHeader.get(0);
        nodeLogger.debug("Cookies present in Session are: " + rawCookie);

        var rawCookieParams = rawCookie.split(";");

        // Loop through the cookies
        for (var i = 0; i < rawCookieParams.length; i++) {
            var cookieName = rawCookieParams[i].split("=");
            var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=") + 1);
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();
            logger.debug(cookie + " :: " + cookieValue);

            if (cookie.localeCompare("sharedStateLoginCookie") == 0) {
                var cookieJSON = JSON.parse(cookieValue.replace(/\\/g, '"'));
                logger.debug("cookieJSON " + cookieJSON.requestURL);

                nodeState.putShared("requestURL", cookieJSON.requestURL);
                nodeState.putShared("returnURL", cookieJSON.returnURL);
                nodeState.putShared("EntityID", cookieJSON.EntityID);
                nodeState.putShared("appType", cookieJSON.appType);
                nodeState.putShared("goto", cookieJSON.goto);
                nodeState.putShared("GoToURLPresent", cookieJSON.GoToURLPresent);
                nodeState.putShared("appCountDataName", cookieJSON.appCountDataName);
                nodeState.putShared("langCookie", cookieJSON.langCookie);
            }
        }
    }
}

//adding this logic to remove the rp-realm from the IDP SSO 
function deleteCookieFromSession(appCookieName) {
    var cookieHeader = requestHeaders.get("Cookie");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::"
        + nodeConfig.scriptName + "::printing existing cookieHeader" + cookieHeader);
    if (cookieHeader) {
        // Split the cookies into key-value pairs
        var cookies = cookieHeader.get(0).split("; ");
        // Specify the cookie name you want to remove
        var cookieToDelete = appCookieName;
        // Filter out the cookie to delete
        cookies = cookies.filter(cookie => !cookie.startsWith(cookieToDelete + "="));
        // Reconstruct the Cookie header
        var updatedCookieHeader = cookies.join("; ");
        requestHeaders.get("Cookie").set(0, updatedCookieHeader);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::"
            + nodeConfig.scriptName + "::printing cookieHeader after rp-realm removal" + requestHeaders.get("Cookie"));

    }
}

function getReqIDFromGoto(gotoLink) {
    var gotoLinkArray = null
    var gotoLinkParams = null;
    var gotoLinkReqIDParams = null;
    var reqID = null;

    try {
        if (gotoLink != null) {
            if (gotoLink.includes("?")) {
                gotoLinkArray = gotoLink.split("?")
                gotoLinkParams = gotoLinkArray[gotoLinkArray.length - 1]
                if (gotoLinkParams.includes("&")) {
                    gotoLinkReqIDParams = gotoLinkParams.split("&")[0]
                    if (gotoLinkReqIDParams.includes("=")) {
                        reqID = gotoLinkReqIDParams.split("=")[1]
                    }
                }
            }
        }
        return reqID

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}


function readReqIDCookieFromSession(reqID) {

    var returnURLCookieName = null
    var rprealmURLCookieName = null
    var reqIDCookies = {
        "rprealm": null,
        "ReturnURL": null
    }

    try {
        if (reqID != null) {
            returnURL = reqID + "-ReturnURL"
            reqIDCookies.ReturnURL = readCookieValueFromSession(returnURL)
            logger.debug("Return cookie value is - " + reqIDCookies.ReturnURL)
            rprealmURL = reqID + "-rp-realm"
            reqIDCookies.rprealm = readCookieValueFromSession(rprealmURL)
            logger.debug("rp-realm cookie value is - " + reqIDCookies.rprealm)
        }
        return reqIDCookies

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}


function main() {

    var gotoLink = null;
    var reqID = null;
    var reqIDCookies = {}

    try {
        //this is specific to IDP Initiated flow for SAML App to remove rp-realm from cookie
        if (requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                + nodeConfig.script + "::" + nodeConfig.scriptName + "::Printing all requestParameters before removal" + JSON.stringify(requestParameters));
            var gotoURL = requestParameters.get("goto").get(0)
            gotoLink = decodeURIComponent(requestParameters.get("goto").get(0));
            logger.error("gotoURL in SSO request - " + gotoLink)
            reqID = getReqIDFromGoto(gotoLink)
            logger.error("reqID in SSO request - " + reqID)
            if (reqID != null) {
                reqIDCookies = readReqIDCookieFromSession(reqID)
                nodeState.putShared("reqIDCookies", reqIDCookies);
                logger.error("reqIDCookies values are - " + JSON.stringify(reqIDCookies))
            }

            nodeLogger.debug(nodeConfig.script + "::" + nodeConfig.scriptName + "::Printing gotoURL" + gotoURL);
            if (gotoURL && gotoURL.includes("idpSSOInit.jsp")) {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                    + nodeConfig.script + "::" + nodeConfig.scriptName + " idpSSOInit.jsp is present in the goto parameter. Its an IDP Initiated request");
                deleteCookieFromSession("rp-realm");
                if (requestParameters && requestParameters.get("rp-realm") && requestParameters.get("rp-realm") != null) {
                    //requestParameters.remove("rp-realm");
                    delete requestParameters.rp - realm;
                    requestParameters = JSON.parse(requestParameters);
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                        + nodeConfig.script + "::" + nodeConfig.scriptName + "::Printing all requestParameters after removal" + JSON.stringify(requestParameters));
                }
                else {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                        + nodeConfig.script + "::" + nodeConfig.scriptName + "::Parameter rp-realm not found in requestParameters.");
                }
            } else {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                    + nodeConfig.script + "::" + nodeConfig.scriptName + " idpSSOInit.jsp is NOT present in the goto parameter.");
            }
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::"
                + nodeConfig.script + "::" + nodeConfig.scriptName + " goto parameter not found in requestParameters.");
        }

        createRequestURL(reqIDCookies);

        var requestURL = nodeState.get("requestURL");
        // if (!requestParameters.get("clocale")) {      
        //     if (requestCookies.get("UserLanguagePreference")) {            
        //         if (requestCookies.get("UserLanguagePreference") === "es-MX") {
        //             var link = requestURL + "&locale=es&clocale=es"
        //             nodeState.putShared("link", link);
        //             action.goTo(nodeOutcome.SetLocaleInURL);
        //         } else {
        //             var link = requestURL + "&locale=en&clocale=en"
        //             nodeState.putShared("link", link);
        //             action.goTo(nodeOutcome.SetLocaleInURL);
        //         }            
        //     } else {
        //         //Change for TFS 182954 on 4-Feb-2025 for accept language header
        //         var langCookie1 = nodeState.get("langCookie")
        //         var link = requestURL + "&locale=" + langCookie1 + "&clocale=" +langCookie1
        //         nodeState.putShared("link", link);
        //         action.goTo(nodeOutcome.SetLocaleInURL);
        //      }

        // } else 
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);

        var browser = requestHeaders.get("user-agent");
        var os = requestHeaders.get("sec-ch-ua-platform");

        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = browser;
        eventDetails["OS"] = os;
        nodeState.putShared("eventDetails", eventDetails)

        logger.debug("request headers in KYID.2B1.Journey.IsValidSessionExist.MasterLogin :: " + JSON.stringify(requestHeaders))
        nodeState.putShared("ipAdress", ipAdress)
        logger.debug("above existing session check")
        if (typeof existingSession != 'undefined') {
            logger.debug("session exist")
            action.goTo(nodeOutcome.SESSION_EXIST)
        } else {
            logger.debug("session does not exist")
            //Defect Fix# 211192 (Unknown Location) - 03/12
            var sessionRefId = {
                sessionRefId: "",
                city: "",
                state: "",
                country: ""
            }
            sessionRefId.sessionRefId = generateGUID();
            /*var sessionRefId = generateGUID();
            nodeState.putShared("sessionRefId", sessionRefId);
            action.goTo(nodeOutcome.SESSION_NOTEXIST).putSessionProperty("sessionRefId", sessionRefId);*/
            nodeState.putShared("sessionRefId", JSON.stringify(sessionRefId));          
            action.goTo(nodeOutcome.SESSION_NOTEXIST).putSessionProperty("sessionRefId", JSON.stringify(sessionRefId));
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}

//Invoke Main Function
main();

