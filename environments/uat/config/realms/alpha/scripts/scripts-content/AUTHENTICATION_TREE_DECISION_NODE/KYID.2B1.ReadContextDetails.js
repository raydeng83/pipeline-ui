/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var lib = require("KYID.2B1.Library.GenericUtils");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.ReadContextDetails",
    timestamp: dateTime,
    errorId_InvalidContextId: "errorID::KYID016",
    errorId_InvalidContextId: "errorID::KYID017",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "True",
    FALSE: "False"
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


//adding this logic to remove the returnURL cookie from the session
function deleteCookieFromSession(appCookieName) {
    var cookieHeader = requestHeaders.get("Cookie");
    logger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"
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
       logger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"
                        +nodeConfig.scriptName+"::printing cookieHeader after returnURL cookie removal" + requestHeaders.get("Cookie"));
   }
}


function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// main Execution
logger.error("Inside Main Function of KYID.2B1.ReadContextDetails");
try {
    nodeState.putShared("userInput", "false");
    nodeState.putShared("journeyName","createAccount")
    var contextid = requestParameters.get("contextId");
if(contextid && contextid!==null){
nodeState.putShared("contextid", contextid[0])
}
    
    logger.error("Context ID is:: " + contextid)
    logger.error("requestHeaders ID is:: " + requestHeaders)
    logger.error("requestParameters ID is:: " + requestParameters)

    //Defect Fix# 211192 (Unknown Location) - 03/12 ---START
    var sessionRefId = {
        sessionRefId: "",
        city: "",
        state: "",
        country: ""
    }
    sessionRefId.sessionRefId =  generateGuid();
    nodeState.putShared("sessionRefId", JSON.stringify(sessionRefId));
    //Defect Fix# 211192 (Unknown Location) - 03/12 ---END
    
    if(requestParameters.get("source")!=null && requestParameters.get("source")){
        logger.debug("sourceValue is - "+requestParameters.get("source")[0])
        var sourceValue = requestParameters.get("source")[0]
        if(sourceValue==="home"){
            logger.debug("Valid query param found for source")
            deleteCookieFromSession("ReturnURL")
        }  else {
            logger.debug("Not a valid query param for source")
        }    
    }

    
    if (contextid != null) {
        if (readCookieValueFromSession("ReturnURL") != null && readCookieValueFromSession("ReturnURL")) {
            spUrl = readCookieValueFromSession("ReturnURL")
            nodeLogger.debug("spUrl in returnURL:: " + spUrl);
            var businessRecords = openidm.query("managed/alpha_kyid_businessapplication", {"_queryFilter": 'forgerockAppId eq "' + spUrl + '" or applicationURL eq "' + spUrl + '"'}, ["*"]);
            nodeLogger.debug("businessRecords in returnURL: " + businessRecords);
            if (businessRecords && businessRecords.resultCount > 0) {
                businessRecord = businessRecords.result[0];
                if (businessRecord && (businessRecord.logoFileName || businessRecord.name)) {
                    var appLogo = businessRecord.logoFileName || null;
                    kogAppName = businessRecord.name || null;
                    var applicationDisplayName = {}
                    if(businessRecord && businessRecord.content && businessRecord.content.length>0 && businessRecord.content[0].title){
                        applicationDisplayName = businessRecord.content[0].title
                    }
                    var contextdetails = returnURLformatJSON(kogAppName, appLogo, spUrl,applicationDisplayName);
                    nodeState.putShared("kogAppName",kogAppName);
                    logger.debug("contextdetails in returnURL::: => " + JSON.stringify(contextdetails))
                    handleContextDetails(JSON.stringify(contextdetails), true);
                    nodeLogger.debug("appLogo: " + appLogo);
                } else {
                    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingAppURL + "::" + error);
                }
            } else {
                logger.debug("contextid value: " + contextid[0]);
                contextid = contextid[0];
                var contextdetails = getContextDetails(contextid);
                nodeState.putShared("contextid",contextid)
                handleContextDetails(contextdetails, false);
            }
        } else {
            logger.debug("contextid value: " + contextid[0]);
            contextid = contextid[0];
            var contextdetails = getContextDetails(contextid);
            nodeState.putShared("contextid",contextid)
            handleContextDetails(contextdetails, false);
        }
    } else {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "context ID not present" + nodeConfig.errorId_InvalidContextId);
        if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(2, "contextId_empty");
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        } else {
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        }
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "unexpected error occured in main execution" + "::" + contextid + "::" + error);
}


function handleContextDetails(contextdetails) {
    if (callbacks.isEmpty()) {
        if (contextdetails == "no_record_found") {
            callbacksBuilder.textOutputCallback(0, contextdetails);
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        }
        else if (contextdetails == "expired_contextId") {
            callbacksBuilder.textOutputCallback(0, contextdetails);
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        }        
        else {
            callbacksBuilder.textOutputCallback(0, contextdetails);
            action.goTo(NodeOutcome.TRUE);
        }
    } else {
        if (contextdetails == "no_record_found") {
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        }
        else if (contextdetails == "expired_contextId") {
            callbacksBuilder.textOutputCallback(0, contextdetails);
            nodeState.putShared("outcome", "false");
            action.goTo(NodeOutcome.TRUE);
        }        
        else {
            action.goTo(NodeOutcome.TRUE);
        }
    }
}

function readCookieValueFromSession(appCookieName){
 
    var matchedCookieValue = null;  // Initialize matchedCookieValue to store the matched cookie value
     nodeLogger.debug("Cookies present in Request Header are: " + requestHeaders);
    // Use requestHeaders.get to get the cookie header
    var cookieHeader = requestHeaders.get("Cookie");
    nodeLogger.debug("Cookies present in Request Header are: " + cookieHeader);
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
            nodeLogger.debug("No cookies found in request headers");
    }
   //} 
    return matchedCookieValue;
}

function getContextDetails(contextid) {
    try {
        var roleId = null;
        var appResponse = null;
        var userAccountAttributes=null;
        // var contextdetails = openidm.query("managed/Kyid_alpha_context_details/", { "_queryFilter": '/contextId eq "'+contextid+'"'}, ["contextId","locale","whoisthisfor","whadoyouneed","howmuctime","additionalhelp","imageId","applicationName"]);
        // var contextdetails = openidm.query("managed/alpha_kyid_enrolmentcontext/", { "_queryFilter": '/_id eq "' + contextid + '"' }, [""]);
        var contextdetails = openidm.query("managed/alpha_kyid_enrollment_contextId/", { "_queryFilter": '/_id eq "' + contextid + '"' }, [""]);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "IDM contextdetails Response : " + contextdetails);
        if (contextdetails.result.length > 0) {
            //roleId = contextdetails.result[0].applicationRoles[0].roleName;
            // roleId = contextdetails.result[0].roleId[0];
            if(contextdetails.result[0].requestedUserAccountAttibutes && contextdetails.result[0].requestedUserAccountAttibutes.length>0){
                userAccountAttributes=contextdetails.result[0].requestedUserAccountAttibutes
            }       
            roleId = contextdetails.result[0].applicationRoles[0].roleId;
            var roleResponse = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id eq "' +roleId+ '"' }, [""]);
            // if(roleResponse.result.length>0){
            // roleId = roleResponse.result[0].role._refResourceId;
            appResponse = lib.getBusinessAppInfo(roleId);
            logger.debug("appResponse is in "+ JSON.stringify(appResponse))
            var currentDateEpoch = Date.now()
            if((contextdetails.result[0].status && contextdetails.result[0].status != "0") || (contextdetails.result[0].expiryDateEpoch &&  currentDateEpoch> contextdetails.result[0].expiryDateEpoch) || (contextdetails.result[0].recordState && contextdetails.result[0].recordState != "0" )){
                return ("expired_contextId");
            }else{
               var contextdetailsResponse = formatJSON(roleResponse,appResponse,contextid,userAccountAttributes)
              return (contextdetailsResponse);
                
            }
        } else {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Enrollment Context for context ID" + "::" + contextid + "::" + "is Invalid" + "::" + nodeConfig.errorId_InvalidContextId);
            return ("no_record_found");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "unexpected error occured while searching context ID" + "::" + contextid + "::" + error);
        return error;
    }
}

function formatJSON(contextdetails,appResponse,contextId,userAccountAttributes) {
    try {
        var logo = null;
        var name = null;
        var url = null;
        var applicationDisplayName = {}
        var optionalInformation = [];
        var localizedContent = [];
        if(appResponse){
            appResponse= JSON.parse(appResponse);
            logo = appResponse.application.logo;
            name = appResponse.application.name;
            url = appResponse.application.url;
        }
            if(appResponse.application.applicationDisplayName){
                applicationDisplayName = appResponse.application.applicationDisplayName
            }
            else{
                applicationDisplayName = {"en":name,"es":name}
            }

        nodeState.putShared("kogAppName",name);
        logger.debug("PrintingLOGO:"+logo);
        var transformedResponse = [];
        for (var i = 0; i < contextdetails.result.length; i++) {
            var item = contextdetails.result[i];
            if(item.createAccount_enrollmentContent){
                localizedContent = item.createAccount_enrollmentContent
            }

            if(item.createAccount_optionalContent){
               optionalInformation= item.createAccount_optionalContent
            }

            var transformedItem = {
                "contextId": contextId,
                "applicationTitle": name,
                "applicationIcon": logo,
                "applicationURL": url,
                // applicationInfo: []
                "applicationDisplayName":applicationDisplayName,
                "localizedContent":localizedContent,
                "optionalInformation":optionalInformation,
                "requestedUserAccountAttributes":userAccountAttributes
                //optionalInformation:item.optionalInformation || null
            };
           

            transformedResponse.push(transformedItem);
        }

        response = JSON.stringify(transformedResponse[0]);
        return response;

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "unexpected error occured while formating JSON" + "::" + contextdetails + "::" + error);
    }
}

function returnURLformatJSON(appName,appLogo,applicationURL,applicationDisplayName) {
    try {
        var logo = appLogo || null;
        var name = appName || null;
        var url = applicationURL || null;

        //var transformedResponse = [];
            var transformedItem = {
                "applicationTitle": name,
                "applicationIcon": logo,
                "applicationURL": url,
                "localizedContent": [],
                "optionalInformation":[],
                "applicationDisplayName":applicationDisplayName || {"en":appName,"es":appName}
            }

        //response = JSON.stringify(transformedResponse[0]);
        return transformedItem;

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "unexpected error occured while formating JSON" + "::" + contextdetails + "::" + error);
    }
}
