/**
 * Script: KYID.Journey.kyLoginPTAForgotPassword
 * Description: This script is used to reteive email and clocale value form session cookie
 * Date: 12th September 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Login PTA ForgotPassword",
    script: "Script",
    scriptName: "KYID.Journey.kyLoginPTAForgotPassword",
    timestamp: dateTime,
    tokenziedMailCreateSuccess: "Successfully created tokenized email",
    end: "Node Execution Completed",
};


// Define NodeOutcome object
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


function createTokenizedMailObject(tokenizedEmail) {
    var status=true;
    var tokenjsonObj = {};
    tokenjsonObj['tokenmail'] = tokenizedEmail;
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(tokenjsonObj));
    try {
        openidm.create("managed/alpha_kyid_token_email", null, tokenjsonObj);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.tokenziedMailCreateSuccess);
    } catch (e){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +e);
        status=false;
    }
    return status;
}


function main() {
    var token = generateGUID();
    var RequestURL=requestCookies.get("RequestURL");
    logger.error("Value_of_RequestURL:"+RequestURL)
    var email = requestCookies.get("fpemail");
    var tokenizedEmail = email+token;
    nodeLogger.error("**************Tokenized Email: ****************"+tokenizedEmail);
    nodeState.putShared("tokenizedEmail",tokenizedEmail);
    if(!createTokenizedMailObject(tokenizedEmail)){
        action.goTo(NodeOutcome.FALSE);
    
    } else {
        nodeLogger.error("**************Email cookie: ****************"+email);
        nodeState.putShared("email",email);
        var clocale = requestCookies.get("clocale");
        nodeLogger.error("************locale cookie:*************** "+clocale);
        nodeState.putShared("clocale",clocale);
        //logger.error("************locale shared state:***************8 "+nodeState.get("clocale"));
        //var link = "https://openam-commkentwf-useast1-uat.id.forgerock.io/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=test-LanguageKYID-ForgotPassword&email="+decodeURIComponent(email);
        
        //var redirect = callbacksBuilder.redirectCallback(link, null, "POST");
        //action.goTo(redirect);  
        
        action.goTo(NodeOutcome.TRUE);
    }
}

//Main Function 
main();