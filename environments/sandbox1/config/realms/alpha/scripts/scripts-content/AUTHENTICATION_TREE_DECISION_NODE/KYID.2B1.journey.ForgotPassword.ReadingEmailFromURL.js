var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "ReadingEmailFromURL",
    script: "Script",
    scriptName: "KYID.2B1.journey.ForgotPassword.ReadingEmailFromURL",
    timestamp: dateTime,
    valueMail: "Email Address is",
    mailTokenValid: "Email Token validated successfully",
    mailTokenNotValid: "Email Token validated failed",
    deleteTokenSuccess: "Email Token entry deleted successfully",
    end: "Node Execution Completed"
};


// Define NodeOutcome object
var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    DEFAULT: "Default"
};

// Function to log errors
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

// Function to get the email ID from request parameters
function getEmailId() {
    try {
        var emailId =nodeState.get("objectAttributes").get("mail");
        logger.error("email"+emailId);
        if (!emailId || !emailId[0]) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email ID not provided.");
            return null;
        }
        return emailId[0]; // Return the first item if it's an array
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving email ID: " + error.message);
        return null;
    }
}

// Function to decode and clean the email ID
function decodeAndCleanEmail(emailId) {
    try {
        var decodedEmail = decodeURIComponent(emailId);
        var emailParts = decodedEmail.split('"');
        return emailParts.length > 1 ? emailParts[1] : emailParts[0];
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error decoding email ID: " + error.message);
        return null;
    }
}

// Function to query user data based on email
function queryUserByEmail(email) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + email + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length > 0) {
            return userQueryResult.result[0]; // Return the first result
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "No user found for email: " + email);
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error querying user by email: " + error.message);
        return null;
    }
}

function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}


function lookupInEmailTokenObject(tokenizedEmail) {
    try {
        var response = openidm.query("managed/alpha_kyid_token_email", { "_queryFilter": '/tokenmail eq "' + tokenizedEmail + '"' });
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(response));
        if (response.result.length > 0) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.mailTokenValid);
            var result = response.result[0];
            //logger.error("result: "+JSON.stringify(result));
            //logger.error("result._id : "+result._id);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + response.result.length);
            deleteEmailTokenObject(result._id,result._rev);
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.mailTokenNotValid);
        }
    } catch(e){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + e);
    }
    return false;
}


function deleteEmailTokenObject(id,rev) {
    try {
        var response = openidm.delete("managed/alpha_kyid_token_email/"+id,rev);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.deleteTokenSuccess);
    } catch(e){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + e);
    }
    return false;
}


// Main execution
function main(){
    var lang = getLocale();
    nodeState.putShared("lang", lang);
    var emailId = getEmailId();
    if (emailId) {
        var tokenizedEmail = decodeAndCleanEmail(emailId);
        lookupInEmailTokenObject(tokenizedEmail);
        
        try {
            var email = nodeState.get("objectAttributes").get("mail")
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.valueMail+"::"+email);
            if (email) {
                var user = queryUserByEmail(email);
                if (user) {
                    // Ensure that user properties exist before using them
                    if (user._id && user.mail) {
                        nodeState.putShared("mail", email);
                        nodeState.putShared("_id", user._id);
                        nodeState.putShared("username", user.mail);
        
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID from query result: " + user._id);
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Shared state - mail: " + nodeState.get("mail") + ", username: " + nodeState.get("username"));
        
                        action.goTo(NodeOutcome.TRUE);
                    } else {
                        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is incomplete: _id or mail is missing.");
                        action.goTo(NodeOutcome.FALSE);
                    }
                } else {
                    action.goTo(NodeOutcome.FALSE);
                }
            } else {
                action.goTo(NodeOutcome.DEFAULT);
            }
          } catch (error) {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An error occurred: " + error.message);
                action.goTo(NodeOutcome.DEFAULT);
          } 
    } else {
        action.goTo(NodeOutcome.DEFAULT);
    }   
}

//Main Function 
main();
