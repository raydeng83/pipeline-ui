/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Username Collector",
    script: "Script",
    scriptName: "KYID.Journey.UsernameCollector",
    errorMail: "Invalid email format",
    errorPhone: "Invalid phone number format.",
    defaultURL: "esv.default.app.url",
    timestamp: dateTime
}

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

// Node outcomes
var nodeOutcome = {
    TRUE: "True"
};

nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

if (callbacks.isEmpty()) {
    var logo = null;
    var name = null;
    var contextid = null;
    var contextid = requestParameters.get("contextId");
    var jsonobj = {};
    var defaultAppName = null;
    logger.debug("Context ID type is :: " + typeof contextid)
    var spUrl = null;
    var isDefault = false;
    var kogAppName = null;
    var appLogo = null;
    var displayappName = null;
    var displayApplicationName = null;

    if(contextid!=null){
        logger.debug("Context ID value :: " + contextid[0])
        var contextdetails = getContextDetails(contextid[0]);
        logger.debug("contextdetails is in "+ JSON.stringify(contextdetails));
        var contextObj = contextdetails;
        if (typeof contextdetails === "string") {
            try {
                contextObj = JSON.parse(contextdetails);
            } catch (e) {
                logger.debug("Failed to parse contextdetails: " + e);
                contextObj = null;
            }
        }
        
        if (contextObj && contextObj.application ) {
            logo = contextObj.application.logo || null;
            nodeState.putShared("appLogo" , logo);
            name = contextObj.application.name || null;
            nodeState.putShared("appname", name)
            nodeState.putShared("appName" , name);

        }
        //PageHeader
        logger.debug("CollectUserName")
        jsonobj = {"pageHeader": "1_Enter_email"}; 
        callbacksBuilder.textOutputCallback(0, `{"applogo": "${logo}", "appname": "${name}"}`);
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        if(nodeState.get("apireturnederror")){
            var invalidEmail = nodeState.get("apireturnederror");
            nodeState.putShared("apireturnederror", null);
            callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`);
        }
        else if(nodeState.get("errorMessage")){
            var error = nodeState.get("errorMessage");
            nodeState.putShared("errorMessage", null);
            callbacksBuilder.textOutputCallback(2,error); 
        }else if (nodeState.get("loginauthz")=="norolesfound"){
        var errormsg="Access_Denied"
        nodeState.putShared("loginauthz", null);
        callbacksBuilder.textOutputCallback(2,errormsg);        
        }else{
            callbacksBuilder.textOutputCallback(0,"Enter_Email");
        }
        callbacksBuilder.textInputCallback("Enter_Email");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    }else{
         try {
            // To get business application record by query
            function getBusinessAppRecord(query) {
                var records = openidm.query("managed/alpha_kyid_businessapplication", query, ["*"]);
                if (records && records.resultCount > 0) {
                    return records.result[0];
                }
                return null;
            }

            // To get default business application record
            function getDefaultBusinessAppRecord() {
                var defaultAppName = systemEnv.getProperty("esv.kyid.portal.name");
                if (!defaultAppName) return null;
                var query = { "_queryFilter": '/name eq "' + defaultAppName + '"' };
                var record = getBusinessAppRecord(query);
                return record;
            }

            try {
                var ReturnURL=null;
                // 1. Try ReturnURL cookie
                logger.debug("reqIDCookies :: => "+ JSON.stringify(nodeState.get("reqIDCookies")))
                if(nodeState.get("reqIDCookies")){
                    var reqIDCookies = nodeState.get("reqIDCookies");  
                    //var ReturnURL = reqIDCookies.ReturnURL || null;
                    if(reqIDCookies.rprealm && reqIDCookies.rprealm!=null){
                         ReturnURL = reqIDCookies.rprealm ;
                    }else if(reqIDCookies.ReturnURL && reqIDCookies.ReturnURL!=null){
                         ReturnURL = reqIDCookies.ReturnURL;
                    }
                    if(ReturnURL && ReturnURL!= null){
                      spUrl = getDomainAndFirstSegment(ReturnURL);  
                    }
                    else{
                       spUrl = null; 
                    }
                    
                }else{
                    spUrl = null;
                }
                if (spUrl) {
                    nodeState.putShared("spUrl",spUrl)
                    nodeLogger.debug("spUrl from cookie: " + spUrl);
                    var query = { "_queryFilter": 'forgerockAppId sw "' + spUrl + '" or applicationURL sw "' + spUrl + '"' };
                    var businessRecord = getBusinessAppRecord(query);
                    logger.debug("businessRecord is :: => "+ JSON.stringify(businessRecord))
                    if (!businessRecord && systemEnv.getProperty("esv.kyid.portal.name")) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }
                // 2. Try EntityID from nodeState
                else if (nodeState.get("EntityID")) {
                    spUrl = nodeState.get("EntityID");
                    spUrl = getDomainAndFirstSegment(spUrl);
                    logger.debug("query is :: => "+ JSON.stringify(query))
                    var query = { "_queryFilter": 'forgerockAppId sw "' + spUrl + '" or applicationURL sw "' + spUrl + '"' };
                    var businessRecord = getBusinessAppRecord(query);
                    logger.debug("businessRecord is :: => "+ JSON.stringify(businessRecord))
                    if (!businessRecord && systemEnv.getProperty("esv.kyid.portal.name")) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }
                // 3. Fallback to default portal
                else if (systemEnv.getProperty("esv.kyid.portal.name")) {
                    defaultAppName = systemEnv.getProperty("esv.kyid.portal.name");
                    var query = {"_queryFilter": '/name eq "' + defaultAppName + '"'};
                    var businessRecord = getBusinessAppRecord(query);
                    if (!businessRecord) {
                        businessRecord = getDefaultBusinessAppRecord();
                    }
                }


                // Set kogAppName and appLogo if found
                if (businessRecord) {
                    kogAppName = businessRecord.name || null;
                    appLogo = businessRecord.logoFileName || businessRecord.logoURL || null;
                    displayappName = (businessRecord.content && businessRecord.content[0] && businessRecord.content[0].title) 
                        ? JSON.stringify(businessRecord.content[0].title)
                        : JSON.stringify({ "en": businessRecord.name, "es": businessRecord.name });

                    nodeLogger.debug("appName: " + kogAppName);
                    nodeLogger.debug("appLogo: " + appLogo);
                    nodeLogger.debug("displayappName: " + displayappName);
                } else {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + (nodeConfig.missingAppURL || "missingAppURL") + ":: No business application record found");
                }
            } catch (error) {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + (nodeConfig.idmQueryFail || "idmQueryFail") + "::" + error);
            }

        } catch (error) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmQueryFail + "::" + error);
            // action.goTo(nodeOutcome.ERROR);
        }

        logger.debug("text callback starts")
        if((kogAppName!==null && kogAppName) || (appLogo!==null && appLogo) || (displayappName!==null && displayappName)){
            name = kogAppName || null;
            logo = appLogo || null;
            displayApplicationName = displayappName || null;
            nodeState.putShared("appName", name);
            nodeState.putShared("appLogo", logo) 
            nodeState.putShared("displayApplicationName", displayApplicationName) 
        } else{
            name = null;
            logo = null;
            nodeState.putShared("appName", name);
            nodeState.putShared("appLogo", logo);
        }  
        if(nodeState.get("errorMessage")){
            var error = nodeState.get("errorMessage");
            //nodeState.putShared("errorMessage", null);
           callbacksBuilder.textOutputCallback(2,error);
        }
        //PageHeader
        logger.debug("CollectUserName")
        var jsonobj = {"pageHeader": "1_Enter_email"};
           callbacksBuilder.textOutputCallback(0, `{"applogo": "${logo}", "appname": "${name}", "displayappname": "${displayApplicationName}"}`);
            callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        if(nodeState.get("apireturnederror")){
            logger.debug("Incorrect email inside username collector" +nodeState.get("apireturnederror"));
            var invalidEmail = nodeState.get("apireturnederror");
            nodeState.putShared("failedOrInactive", null);
            callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidEmail+`</div>`);
        }
        else if(nodeState.get("errorMessage")){
            var error = nodeState.get("errorMessage");
            //nodeState.putShared("errorMessage", null);
            callbacksBuilder.textOutputCallback(2,error);
        }else if (nodeState.get("loginauthz")=="norolesfound"){
            var errormsg="Access_Denied"
            nodeState.putShared("loginauthz", null);
            callbacksBuilder.textOutputCallback(2,errormsg);        
        }else{
           callbacksBuilder.textOutputCallback(0,"Enter_Email");
        }
           callbacksBuilder.textInputCallback("Enter_Email");
           callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } 
}
else {
  var userInput = callbacks.getTextInputCallbacks()[0].trim(); 
    nodeState.putShared("verifiedPrimaryEmail",userInput);
    var transactionId = nodeState.get("transactionId")
    logger.debug("transactionIdinuserNameCollector:"+transactionId)

    if (isValidMail(userInput)){
        nodeState.putShared("username", userInput);
        nodeState.putShared("mail",userInput);
        nodeState.putShared("primaryEmail",userInput);
        nodeState.putShared("searchAttribute","mail");
        nodeState.putShared("errorMessage",null);
        nodeState.putShared("outcome","mail");

        var query = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+userInput+"\""}, ["_id", "userName"]);
        if (query && query.result && query.result.length === 1) {
        var KOGID = query.result[0].userName
            logger.debug("KOG ID while login is" +KOGID)
            nodeState.putShared("KOGID",KOGID);
        }

        action.goTo(nodeOutcome.TRUE).putSessionProperty('KOGID', KOGID);
    }else{
      if(isEmail(userInput)){
         nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorMail); 
      }else{
         nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+nodeConfig.errorPhone);  
      }
        var jsonobj = {"pageHeader": "1_Enter_email"};
        if(nodeState.get("appLogo") || nodeState.get("appName")||nodeState.get("displayApplicationName")){
             callbacksBuilder.textOutputCallback(0, `{"applogo": "${logo}", "appname": "${name}", "displayappname": "${displayApplicationName}"}`);
        }
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        var invalidFormat = "ERR-INP-LOG-001 Invalid Email. Please try again";
        callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidFormat+`</div>`);
        callbacksBuilder.textInputCallback("Enter Email");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    }
}
  

function getDomainAndFirstSegment(url) {
    var match = url.match(/^(https?:\/\/[^\/]+\/[^\/]+)(\/.*)?$/);
    if (match) {
        return match[1];
    }
    // If there's no path segment, return domain root without trailing slash
    match = url.match(/^(https?:\/\/[^\/]+)\/?$/);
    if (match) {
        return match[1];
    }
    return url;
}


function isValidMail(mail) {
    var mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return mailRegex.test(mail);
}



function isEmail(userInput) {
  return userInput.includes("@");
 }

function getContextDetails(contextid) {
    var transactionId = nodeState.get("transactionId")
    try {
        var lib = require("KYID.2B1.Library.GenericUtils");
        var roleId = null;
        var roleName = null;
        var appResponse = null;
        var contextdetails = openidm.query("managed/alpha_kyid_enrollment_contextId/", { "_queryFilter": '/_id eq "' + contextid + '"' }, [""]);
        logger.debug("contextdetails is in "+ JSON.stringify(contextdetails));
        if (contextdetails.result.length > 0) {
            roleName = contextdetails.result[0].applicationRoles[0].roleId;
            logger.debug("roleName is in "+ contextdetails.result[0].applicationRoles[0]);
            var roleResponse =openidm.query("managed/alpha_role/", { "_queryFilter": '/_id eq "' +roleName+ '"' }, [""]);
            logger.debug("roleResponse is in "+ JSON.stringify(roleResponse));
            roleId = roleResponse.result[0]._id;
            appResponse = lib.getBusinessAppInfo(roleId);
            logger.debug("appResponse is in "+ JSON.stringify(appResponse));
            return appResponse;
        } else {
            return ("no_record_found");
        }
    } catch (error) {
        return error;
    }
}
