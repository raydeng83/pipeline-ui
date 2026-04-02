var auditLib = require("KYID.2B1.Library.AuditLogger")
try {
var redirectURL = "";

var LoginPrereqRequired = nodeState.get("isLoginPrereqRequired");
logger.debug("LoginPrereqRequired from nodeState is: " + LoginPrereqRequired);

var logonAppId = nodeState.get("logonAppId");
logger.debug("logonAppId from nodeState is: " + logonAppId);

var loginauthz = nodeState.get("loginauthz");
logger.debug("loginauthz from nodeState is: " + loginauthz);

var route = nodeState.get("route");
logger.debug("route from nodeState is: " + route);

var appName = nodeState.get("appName");
logger.debug("appName from nodeState is in KYID.2B1.Journey.RouteToSuccessURL: " + appName);

// var authnTimestamp = nodeState.get("AuthenticationInstant") || new Date().toISOString();
// var authnTimestamp = null
// if((typeof existingSession != 'undefined') && existingSession.get("AuthenticationTime")){
//     authnTimestamp = existingSession.get("AuthenticationTime") 
// }else{
//     authnTimestamp = Date.now()
// }
var authnTimestamp = null
if(nodeState.get("AuthenticationTime")){
    authnTimestamp = nodeState.get("AuthenticationTime")
}else{
    authnTimestamp = "0-"+Date.now().toString()
}
var authnTime = authnTimestamp

// nodeState.putShared("AuthenticationTime",authnTimestamp)

// var authnTime = new Date(authnTimestamp).getTime()
// var authnTime = ""
// if(typeof existingSession == 'undefined'){
//     // nodeState.putShared("AuthenticationTime",authnTime)
//     authnTime = 0
// }

logger.debug("authnTimestamp is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTimestamp);
logger.debug("authnTime is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTime);


var softLogoutURL = nodeState.get("softLogoutURL")
logger.debug("softLogoutURL is in KYID.2B1.Journey.RouteToSuccessURL: " + softLogoutURL);

var ipAdress = null;
if(nodeState.get("ipAdress") && nodeState.get("ipAdress")!=null){
    ipAdress = nodeState.get("ipAdress")
}


var portalURL = systemEnv.getProperty("esv.portal.url")
logger.debug("portalURL is in KYID.2B1.Journey.RouteToSuccessURL: " + portalURL);

var appLogo = nodeState.get("appLogo") || ""
logger.debug("appLogo is in KYID.2B1.Journey.RouteToSuccessURL: " + appLogo);

if (nodeState.get("applicationURL")) {
    var applicationURL = nodeState.get("applicationURL")
    logger.debug("applicationURL is in KYID.2B1.Journey.RouteToSuccessURL: " + applicationURL);
}

var encodedsoftlogouturl = null;
if (applicationURL && (appName === (systemEnv.getProperty("esv.kyid.portal.name")) || appName === (systemEnv.getProperty("esv.kyid.businessportal.name")))) {
    // Encode the full URL with return param
    encodedsoftlogouturl = encodeURIComponent(applicationURL);
    logger.debug("Final encodedsoftlogouturl if kyid portal or kyid business portal: " + encodedsoftlogouturl);
}
else if (softLogoutURL && applicationURL) {
    // Encode the full URL with return param
    encodedsoftlogouturl = encodeURIComponent(softLogoutURL + "?returnURL=" + applicationURL);
    logger.debug("Final encodedsoftlogouturl: " + encodedsoftlogouturl);
} else if (softLogoutURL) {
    // Encode only softLogoutURL if return param not present
    encodedsoftlogouturl = encodeURIComponent(softLogoutURL);
    logger.debug("Final encodedsoftlogouturl without applicationURL: " + encodedsoftlogouturl);
}

var skippedLogonApps = [];
if (typeof existingSession != 'undefined') {
    if (existingSession.get("skippedLogonApps")) {
        // if(Array.isArray(existingSession.get("skippedLogonApps"))){
        //    skippedLogonApps = existingSession.get("skippedLogonApps") 
        // }
        // else{
        //     skippedLogonApps.push(existingSession.get("skippedLogonApps"))
        // }
        
        // logger.debug("Found skippedLogonApps:: " + skippedLogonApps);
        skippedLogonApps = JSON.parse(existingSession.get("skippedLogonApps"))
    }
}

//For requestAccess appname and applogo , checking the kogparentappname 
var requestAccessAppName = nodeState.get("kogParentApplicationName") || nodeState.get("appName")
var requestAccessAppResponse = openidm.query(
    "managed/alpha_kyid_businessapplication/",
    { _queryFilter: '/name eq "' + requestAccessAppName + '"' },
    ["*"]
);
 var requestAccessAppLogo = nodeState.get("appLogo")
 var requestAccessAppID = nodeState.get("logonAppId")
if (requestAccessAppResponse && requestAccessAppResponse.result && requestAccessAppResponse.result.length > 0) {
    logger.debug("The application id of the kogparentname in KYID.2B1.Journey.CheckLoginPreReqCheckviaLoginPolicy " +requestAccessAppResponse.result[0]._id)
  
    requestAccessAppLogo = requestAccessAppResponse.result[0].logoFileName
    requestAccessAppID = requestAccessAppResponse.result[0]._id
}
    

var userId = ""

if(nodeState.get("usrcreatedId")){
userId = nodeState.get("usrcreatedId");
}
else if(typeof existingSession != 'undefined'){
 userId = existingSession.get("UserId")
}

logger.debug("browser is :: "+ nodeState.get("browser"))
logger.debug("os is :: "+ nodeState.get("os"))
if(nodeState.get("appLogo")){
    var appLogo = nodeState.get("appLogo")
}
logger.debug("logo is in :: "+ nodeState.get("appLogo"))
var eventDetails = {
    applicationName : nodeState.get("appName") || nodeState.get("appname") || "",
    applicationLogo : appLogo || "",
    "sessionRefId" : nodeState.get("sessionRefId") || "",
    "ipAddress": ipAdress || "",
    "OS": nodeState.get("os") || "",
    "Browser": nodeState.get("browser") || "",
    "latitude" : nodeState.get("latitude") || "",
    "longitude": nodeState.get("longitude")|| "",
    "consentCapturedOnLogin":"true" 
    };
// var eventDetails = nodeState.get("eventDetails") || {} ;
// if(!eventDetails.applicationName){
//     eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name")
// }

var sessionDetails = {}
var sessionDetail = null
if(nodeState.get("sessionRefId")){
    sessionDetail = nodeState.get("sessionRefId") 
    sessionDetails["sessionRefId"] = sessionDetail
}else if(typeof existingSession != 'undefined'){
    sessionDetail = existingSession.get("UserId")
    sessionDetails["sessionRefId"] = sessionDetail
}else{
     sessionDetails = {"sessionRefId": ""}
}
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];


var isMandatoryPreRequisite = false;
var isoptionalPrerequisite = false;

if (nodeState.get("isMandatoryPreReq")) {
    isMandatoryPreRequisite = nodeState.get("isMandatoryPreReq")
    logger.debug("isMandatoryPreReq from nodeState is::appName "+  appName + " is::" +  isMandatoryPreRequisite);
}

if(nodeState.get("primaryEmail") != null && typeof nodeState.get("primaryEmail") != "undefined") {
   var email = nodeState.get("primaryEmail").toLowerCase();      
}

var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

if (nodeState.get("isOptionalPrereq")) {
    isoptionalPrerequisite = nodeState.get("isOptionalPrereq")
    logger.debug("isOptionalPrereq from nodeState is::appName "+  appName + " is::" + isoptionalPrerequisite);
}

if (LoginPrereqRequired === true || LoginPrereqRequired === "true") {
    logger.debug("LoginPrereqRequired is TRUE. running Authz code...");

    handleAuthzRouting(loginauthz, route, true,skippedLogonApps, isoptionalPrerequisite,isMandatoryPreRequisite, logonAppId);
    // if(nodeState.get("skippedLogonApps")){
    if(skippedLogonApps.length>0){
        // var skippedLogonApps = nodeState.get("skippedLogonApps")
        logger.debug("the skippedLogonApps after handleAuthz::"+skippedLogonApps)
        
        auditLib.auditLogger("LOG001", sessionDetails, "Successful Login", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId  )
        var skippedLogonAppsString = JSON.stringify(skippedLogonApps)
        action.goTo("true").putSessionProperty("skippedLogonApps", skippedLogonAppsString).putSessionProperty("authTime", authnTime).putSessionProperty("logonAppId", logonAppId)
        if(nodeState.get("firstTimeLoginPerformed") == "true"){
              auditLib.auditLogger("PSS001", sessionDetails, "KYID Profile Setup Success", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        }
    } else {
        auditLib.auditLogger("LOG001", sessionDetails, "Successful Login", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        if(nodeState.get("firstTimeLoginPerformed") == "true"){
              auditLib.auditLogger("PSS001", sessionDetails, "KYID Profile Setup Success", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        }
        action.goTo("true").putSessionProperty("authTime", authnTime).putSessionProperty("logonAppId", logonAppId)
    }
    
} else {
    logger.debug("LoginPrereqRequired is FALSE. running Authz code...");
    handleAuthzRouting(loginauthz, route, false,skippedLogonApps, isoptionalPrerequisite,isMandatoryPreRequisite, logonAppId);
    
    // if(nodeState.get("skippedLogonApps")){
    if(skippedLogonApps.length>0){
        // var skippedLogonApps = nodeState.get("skippedLogonApps")
        logger.debug("the skippedLogonApps after handleAuthz::"+skippedLogonApps)
        //auditLib.auditLogger("LOG001",sessionDetails,"Successful Login", eventDetails, userId, userId, transactionId)
        auditLib.auditLogger("LOG001", sessionDetails, "Successful Login", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        if(nodeState.get("firstTimeLoginPerformed") == "true"){
              auditLib.auditLogger("PSS001", sessionDetails, "KYID Profile Setup Success", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        }
        action.goTo("true").putSessionProperty("skippedLogonApps", skippedLogonApps)
    } else {
        auditLib.auditLogger("LOG001", sessionDetails, "Successful Login", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        if(nodeState.get("firstTimeLoginPerformed") == "true"){
              auditLib.auditLogger("PSS001", sessionDetails, "KYID Profile Setup Success", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
        }
        action.goTo("true")
    }
}
} catch (error) {
    logger.error("Error Occurred While Execution Main Function of KYID.2B1.Journey.RouteToSuccessURL" +error)
}



// Function to route the user
function handleAuthzRouting(loginauthz, route, isPrereq,skippedLogonApps, isoptionalPrerequisite,isMandatoryPreRequisite, logonAppId) {
    logger.debug("the logonAppId in handleAuthzRouting" +logonAppId )
     logger.debug("the skippedLogonApps in handleAuthzRouting" +skippedLogonApps )
         logger.debug("the type of skippedLogonApps in handleAuthzRouting" + typeof skippedLogonApps )        
    try {
// if (isoptionalPrerequisite && !isMandatoryPreRequisite && skippedLogonApps && skippedLogonApps.includes(logonAppId) && typeof existingSession != 'undefined') {
//         logger.debug("Found skippedLogonApps included :: " + skippedLogonApps);
//         //redirect back to the application
//         nodeState.putShared("successfullogin", "true")
//         return true

// } 
 if (isoptionalPrerequisite && !isMandatoryPreRequisite) {
    logger.debug("user has a session and optional pre req is yes")
    
    skippedLogonApps.push(logonAppId)
    
    if(skippedLogonApps.length > 0){
        logger.debug("skippedLogonApps length is greater than 0 : " + skippedLogonApps.length)
         // nodeState.putShared("skippedLogonApps", skippedLogonApps)
    }
    
       
}

if (route === "hascontext") {
        logger.debug("hascontext");
        var contextID = nodeState.get("contextID");
        if (isPrereq) {
            redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + portalURL + "/appenroll?contextId=" + contextID
            logger.debug("the redirect url is hascontext::" + redirectURL)

        } else {
            redirectURL = "/appenroll?contextId=" + contextID;
            logger.debug("the redirect url is hascontext::" + redirectURL)
        }

    }
    // else if (route === "noactiveenrollment") {
    //     logger.debug("noactiveenrollment");
    //     if (isPrereq) {
    //         var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/request-access?appId=" + appName + "&appLogo=" + appLogo)

    //         redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
    //         logger.debug("the redirect url is noactiveenrollment::" + redirectURL)
    //     } else {
    //         redirectURL = "/authorization/request-access?appId=" + appName + "&appLogo=" + appLogo
    //         logger.debug("the redirect url is noactiveenrollment::" + redirectURL)
    //     }

    // }
        else if (route === "noactiveenrollment") {
        logger.debug("noactiveenrollment");
        if (isPrereq) {
            var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/request-access?appId=" + requestAccessAppName + "&appLogo=" + requestAccessAppLogo)

            redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
            logger.debug("the redirect url is noactiveenrollment::" + redirectURL)
        } else {
            redirectURL = "/authorization/request-access?appId=" + requestAccessAppName + "&appLogo=" + requestAccessAppLogo
            logger.debug("the redirect url is noactiveenrollment::" + redirectURL)
        }

    }
    else if (route === "userhasRolesActiveEnrolment") {
        logger.debug("userhasRolesActiveEnrolment");
        if (isPrereq) {
            var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + requestAccessAppID + "&appLogo=" + requestAccessAppLogo + "&appName=" + requestAccessAppName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)

            redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
            logger.debug("the redirect url is userhasRolesActiveEnrolment::" + redirectURL)
        } else {
            redirectURL = "/authorization/active-enrollment?appId=" + requestAccessAppID + "&appLogo=" + requestAccessAppLogo + "&appUrl=" + encodedsoftlogouturl
            logger.debug("the redirect url is userhasRolesActiveEnrolment::" + redirectURL)
        }

    }
    else if (route === "activeenrollment") {
        logger.debug("activeenrollment");
        if (isPrereq) {

            var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + requestAccessAppID + "&appLogo=" + requestAccessAppLogo + "&appName=" + requestAccessAppName)

            redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
            logger.debug("the redirect url is activeenrollment::" + redirectURL)
        } else {
            redirectURL = "/authorization/active-enrollment?appId=" + requestAccessAppID + "&appLogo=" + requestAccessAppLogo + "&appName=" + requestAccessAppName
            logger.debug("the redirect url is activeenrollment::" + redirectURL)
        }
    }
    else if (loginauthz === "userhasroles") {
        logger.debug("userhasroles");
        nodeState.putShared("loginauthz", null);
        if (isPrereq) {
            redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedsoftlogouturl
            logger.debug("the redirect url is userhasroles::" + redirectURL)
        }else if(nodeState.get("isAutoProvision") == "true"){
            logger.debug("redirecting after successful autoprovision :: => "+ encodedsoftlogouturl )
            redirectURL =  encodedsoftlogouturl;
        }else {
            nodeState.putShared("successfullogin", "true")
            logger.debug("the redirect url when NO PreReq Required and user has roles::" + redirectURL)
        }
    }
    nodeState.putShared("redirecturl", redirectURL)
        
    } catch (error) {
        logger.error("Eror Occurred While Executing handleAuthzRouting "+ error)
        
    }


}

    



// logger.debug("KYID.2B1.Journey.RouteToSuccessURL started")
// var redirectURL = "";

// var LoginPrereqRequired = nodeState.get("isLoginPrereqRequired");
// logger.debug("LoginPrereqRequired from nodeState is: " + LoginPrereqRequired);

// var logonAppId = nodeState.get("logonAppId");
// logger.debug("logonAppId from nodeState is: " + logonAppId);

// var loginauthz = nodeState.get("loginauthz");
// logger.debug("loginauthz from nodeState is: " + loginauthz);

// var route = nodeState.get("route");
// logger.debug("route from nodeState is: " + route);

// var appName = nodeState.get("appName");
// logger.debug("appName from nodeState is in KYID.2B1.Journey.RouteToSuccessURL: " + appName);

// var authnTimestamp = nodeState.get("AuthenticationInstant"); 

// var authnTime = new Date(authnTimestamp).getTime()
// logger.debug("authnTimestamp is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTimestamp);
// logger.debug("authnTime is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTime);


// var softLogoutURL = nodeState.get("softLogoutURL")
// logger.debug("softLogoutURL is in KYID.2B1.Journey.RouteToSuccessURL: " + softLogoutURL);


// var portalURL = systemEnv.getProperty("esv.portal.url")
// logger.debug("portalURL is in KYID.2B1.Journey.RouteToSuccessURL: " + portalURL);

// var appLogo = nodeState.get("appLogo") || ""
// logger.debug("appLogo is in KYID.2B1.Journey.RouteToSuccessURL: " + appLogo);

// if(nodeState.get("applicationURL")){
//     var applicationURL = nodeState.get("applicationURL")
//     logger.debug("applicationURL is in KYID.2B1.Journey.RouteToSuccessURL: " + applicationURL);
// }

// var encodedsoftlogouturl = null;
// if (softLogoutURL && applicationURL) {
//     // Encode the full URL with return param
//     encodedsoftlogouturl = encodeURIComponent(softLogoutURL + "?returnURL=" + applicationURL);
//     logger.debug("Final encodedsoftlogouturl: " + encodedsoftlogouturl);
// } else if (softLogoutURL) {
//     // Encode only softLogoutURL if return param not present
//     encodedsoftlogouturl = encodeURIComponent(softLogoutURL);
//     logger.debug("Final encodedsoftlogouturl without applicationURL: " + encodedsoftlogouturl);
// }

// var skippedLogonApps = [];
//  if(typeof existingSession != 'undefined'){
// if(existingSession.get("skippedLogonApps")){
//   skippedLogonApps = existingSession.get("skippedLogonApps")
//   logger.debug("Found skippedLogonApps:: " + skippedLogonApps);
// }
//  }


// var isMandatoryPreRequisite = false;
// var isoptionalPrerequisite = false;

// if(nodeState.get("isMandatoryPreReq")){
// isMandatoryPreRequisite = nodeState.get("isMandatoryPreReq")
// logger.debug("isMandatoryPreReq from nodeState is: " + isMandatoryPreRequisite);
// } 

// if(nodeState.get("isOptionalPrereq")){
// isoptionalPrerequisite = nodeState.get("isOptionalPrereq")
// logger.debug("isOptionalPrereq from nodeState is: " + isoptionalPrerequisite);
// } 

// if (LoginPrereqRequired === true || LoginPrereqRequired === "true") {
//     logger.debug("LoginPrereqRequired is TRUE. running Authz code...");
//     handleAuthzRouting(loginauthz, route, true, skippedLogonApps,isoptionalPrerequisite, isMandatoryPreRequisite);
//     action.goTo("true")
// } else {
//     logger.debug("LoginPrereqRequired is FALSE. running Authz code...");
//     handleAuthzRouting(loginauthz, route, false, skippedLogonApps, isoptionalPrerequisite, isMandatoryPreRequisite);
//     action.goTo("true")
// }




// function handleAuthzRouting(loginauthz, route, isPrereq, skippedLogonApps, isoptionalPrerequisite,isMandatoryPreRequisite) {
//     var logonRedirectJourney = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=/alpha&authIndexType=service&authIndexValue=kyid_2B1_LogonRedirect&logonAppId=";
//     if (isoptionalPrerequisite && skippedLogonApps && skippedLogonApps.includes(logonAppId)) {
//         logger.debug("Found skippedLogonApps included :: " + skippedLogonApps);
//         //redirect back to the application
//         nodeState.putShared("successfullogin", "true")

//     }

//     else if (route === "hascontext") {
//         logger.debug("hascontext");
//         var contextID = nodeState.get("contextID");
//         if (isPrereq) {
            
//             if (isMandatoryPreRequisite) {
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + portalURL + "/appenroll?contextId=" + contextID
//                 logger.debug("the redirect url is::" + redirectURL)

//             } else {
                
//                 var encodedRedirectURL = portalURL + "/appenroll?contextId=" + contextID
                
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodeURIComponent(logonRedirectJourney +
//                     logonAppId +"&redirect=" + encodedRedirectURL)

//                 logger.debug("the redirect url is::" + redirectURL)

//             }
//         } else {
//             redirectURL = "/appenroll?contextId=" + contextID;
//             logger.debug("the redirect url is::" + redirectURL)
//         }

//     }
//     else if (route === "noactiveenrollment") {
//         logger.debug("noactiveenrollment");
//         if (isPrereq) {
           
//             if (isMandatoryPreRequisite) {
//                 var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/request-access?appId=" + appName + "&appLogo=" + appLogo + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
//                 logger.debug("the redirect url is::" + redirectURL)
//             }
//             else {
                
//                 var encodedRedirectURL = portalURL + "/authorization/request-access?appId=" + appName + "&appLogo=" + appLogo + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL
                
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodeURIComponent(logonRedirectJourney +
//                     logonAppId +"&redirect=" + encodedRedirectURL)

//                 logger.debug("the redirect url is::" + redirectURL)


//             }
//         } else {
//             redirectURL = "/authorization/request-access?appId=" + appName + "&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
//             logger.debug("the redirect url is::" + redirectURL)
//         }

//     }
//     else if (route === "userhasRolesActiveEnrolment") {
//         logger.debug("userhasRolesActiveEnrolment");
//         if (isPrereq) {
//             if (isMandatoryPreRequisite) {
//                 var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)

//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
//               //  logger.debug("the redirect url is::" + redirectURL)
//                 logger.debug("the redirect url in userhasRolesActiveEnrolment and mandatory prereq is ::" + redirectURL)

//             }
//             else {
                
//                 var encodedRedirectURL = portalURL + "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL
                
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodeURIComponent(logonRedirectJourney +
//                     logonAppId +"&redirect=" + encodedRedirectURL)

//                 logger.debug("the redirect url in userhasRolesActiveEnrolment and optional prereq is ::" + redirectURL)

//             }

//         } else {
//             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
//             logger.debug("the redirect url in userhasRolesActiveEnrolment and only authorization and no prereq is :::" + redirectURL)
//         }

//     }
//     else if (route === "activeenrollment") {
//         logger.debug("activeenrollment");
//         if (isPrereq) {
//             if (isMandatoryPreRequisite) {
//                 var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)

//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedReturnURL
//                 logger.debug("the redirect url is::" + redirectURL)

//             }
//             else {
                
//                 var encodedRedirectURL = portalURL + "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL
                
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodeURIComponent(logonRedirectJourney +
//                     logonAppId + "&redirect=" + encodedRedirectURL)

//                 logger.debug("the redirect url is::" + redirectURL)

//             }


//         } else {
//             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId + "&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
//             logger.debug("the redirect url is::" + redirectURL)
//         }
//     }
//     else if (loginauthz === "userhasroles") {
//         logger.debug("userhasroles");
//         nodeState.putShared("loginauthz", null);
//         if (isPrereq) {
//             if (isMandatoryPreRequisite) {
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodedsoftlogouturl
//                 logger.debug("the redirect url is::" + redirectURL)

//             }
//             else {
                
//                 redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime + "&returnURL=" + encodeURIComponent(logonRedirectJourney +
//                     logonAppId + "&redirect=" + encodedsoftlogouturl)

//                 logger.debug("the redirect url is::" + redirectURL)

//             }

//         } else {
//             nodeState.putShared("successfullogin", "true")
//             logger.debug("the redirect url when NO PreReq Required and user has roles::" + redirectURL)
//         }
//     }
//     nodeState.putShared("redirecturl", redirectURL)
// }


// // // Function to route the user
// // function handleAuthzRouting(loginauthz, route, isPrereq, skippedLogonApps) {
// // if (isoptionalPrerequisite && skippedLogonApps && skippedLogonApps.includes(logonAppId)){
// //                 logger.debug("Found skippedLogonApps included :: " + skippedLogonApps);
// //                 //redirect back to the application
// //                 nodeState.putShared("successfullogin","true")

// //             }

// // else if (route === "hascontext") {
// //         logger.debug("hascontext");
// //         var contextID = nodeState.get("contextID");
// //         if (isPrereq) {
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" +portalURL+ "/appenroll?contextId=" + contextID
// //             logger.debug("the redirect url is::" +redirectURL)

// //             if(isMandatory){

// //             } else {
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" +portalURL+ "/appenroll?contextId=" + contextID
            
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=/alpha&authIndexType=service&authIndexValue=kyid_2B1_LogonRedirect?logonAppId=" + logonAppId &redirect= encodedReturnURL

// //             logger.debug("the redirect url is::" +redirectURL)

// //             }
// //         } else {
// //             redirectURL = "/appenroll?contextId=" + contextID;
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "noactiveenrollment") {
// //         logger.debug("noactiveenrollment");
// //         if (isPrereq) {
// //             var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/request-access?appId=" + appName +"&appLogo=" + appLogo + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
            
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/request-access?appId=" + appName +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "userhasRolesActiveEnrolment") {
// //         logger.debug("userhasRolesActiveEnrolment");
// //         if (isPrereq) {
// //             var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
            
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "activeenrollment") {
// //         logger.debug("activeenrollment");
// //         if (isPrereq) {
             
// // 			var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
              
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
// //     } 
// //     else if (loginauthz === "userhasroles") {
// //         logger.debug("userhasroles");
// //         nodeState.putShared("loginauthz", null);
// //         if (isPrereq) {
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" +encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             nodeState.putShared("successfullogin","true")
// //             logger.debug("the redirect url when NO PreReq Required and user has roles::" +redirectURL)
// //         }
// //     }
// //     nodeState.putShared("redirecturl",redirectURL)
// // }



// // var redirectURL = "";

// // var LoginPrereqRequired = nodeState.get("isLoginPrereqRequired");
// // logger.debug("LoginPrereqRequired from nodeState is: " + LoginPrereqRequired);

// // var logonAppId = nodeState.get("logonAppId");
// // logger.debug("logonAppId from nodeState is: " + logonAppId);

// // var loginauthz = nodeState.get("loginauthz");
// // logger.debug("loginauthz from nodeState is: " + loginauthz);

// // var route = nodeState.get("route");
// // logger.debug("route from nodeState is: " + route);

// // var appName = nodeState.get("appName");
// // logger.debug("appName from nodeState is in KYID.2B1.Journey.RouteToSuccessURL: " + appName);

// // var authnTimestamp = nodeState.get("AuthenticationInstant"); 

// // var authnTime = new Date(authnTimestamp).getTime()
// // logger.debug("authnTimestamp is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTimestamp);
// // logger.debug("authnTime is in KYID.2B1.Journey.RouteToSuccessURL: " + authnTime);


// // var softLogoutURL = nodeState.get("softLogoutURL")
// // logger.debug("softLogoutURL is in KYID.2B1.Journey.RouteToSuccessURL: " + softLogoutURL);


// // var portalURL = systemEnv.getProperty("esv.portal.url")
// // logger.debug("portalURL is in KYID.2B1.Journey.RouteToSuccessURL: " + portalURL);

// // var appLogo = nodeState.get("appLogo") || ""
// // logger.debug("appLogo is in KYID.2B1.Journey.RouteToSuccessURL: " + appLogo);

// // if(nodeState.get("applicationURL")){
// //     var applicationURL = nodeState.get("applicationURL")
// //     logger.debug("applicationURL is in KYID.2B1.Journey.RouteToSuccessURL: " + applicationURL);
// // }

// // var encodedsoftlogouturl = null;
// // if (softLogoutURL && applicationURL) {
// //     // Encode the full URL with return param
// //     encodedsoftlogouturl = encodeURIComponent(softLogoutURL + "?returnURL=" + applicationURL);
// //     logger.debug("Final encodedsoftlogouturl: " + encodedsoftlogouturl);
// // } else if (softLogoutURL) {
// //     // Encode only softLogoutURL if return param not present
// //     encodedsoftlogouturl = encodeURIComponent(softLogoutURL);
// //     logger.debug("Final encodedsoftlogouturl without applicationURL: " + encodedsoftlogouturl);
// // }

// // if (LoginPrereqRequired === true || LoginPrereqRequired === "true") {
// //     logger.debug("LoginPrereqRequired is TRUE. running Authz code...");
// //     handleAuthzRouting(loginauthz, route, true);
// //     action.goTo("true")
// // } else {
// //     logger.debug("LoginPrereqRequired is FALSE. running Authz code...");
// //     handleAuthzRouting(loginauthz, route, false);
// //     action.goTo("true")
// // }


// // // Function to route the user
// // function handleAuthzRouting(loginauthz, route, isPrereq) {
// //     if (route === "hascontext") {
// //         logger.debug("hascontext");
// //         var contextID = nodeState.get("contextID");
// //         if (isPrereq) {
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" +portalURL+ "/appenroll?contextId=" + contextID
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/appenroll?contextId=" + contextID;
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "noactiveenrollment") {
// //         logger.debug("noactiveenrollment");
// //         if (isPrereq) {
// //             var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/request-access?appId=" + appName +"&appLogo=" + appLogo + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
            
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/request-access?appId=" + appName +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "userhasRolesActiveEnrolment") {
// //         logger.debug("userhasRolesActiveEnrolment");
// //         if (isPrereq) {
// //             var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
            
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
        
// //     } 
// //     else if (route === "activeenrollment") {
// //         logger.debug("activeenrollment");
// //         if (isPrereq) {
             
// // 			var encodedReturnURL = encodeURIComponent(portalURL + "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appName=" + appName + "&appUrl=" + softLogoutURL + "?returnURL=" + applicationURL)
              
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" + encodedReturnURL
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             redirectURL = "/authorization/active-enrollment?appId=" + logonAppId +"&appLogo=" + appLogo + "&appUrl=" + encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         }
// //     } 
// //     else if (loginauthz === "userhasroles") {
// //         logger.debug("userhasroles");
// //         nodeState.putShared("loginauthz", null);
// //         if (isPrereq) {
// //             redirectURL = "/login-prereq?logonAppId=" + logonAppId + "&authTime=" + authnTime +"&returnURL=" +encodedsoftlogouturl
// //             logger.debug("the redirect url is::" +redirectURL)
// //         } else {
// //             nodeState.putShared("successfullogin","true")
// //             logger.debug("the redirect url when NO PreReq Required and user has roles::" +redirectURL)
// //         }
// //     }
// //     nodeState.putShared("redirecturl",redirectURL)
// // }
