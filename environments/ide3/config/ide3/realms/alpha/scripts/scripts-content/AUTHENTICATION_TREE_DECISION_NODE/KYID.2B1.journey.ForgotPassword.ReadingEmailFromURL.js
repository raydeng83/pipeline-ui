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
        // var emailId =nodeState.get("objectAttributes").get("mail");
        var emailId =nodeState.get("mail");
        logger.debug("email from nodestate : "+emailId);
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
        logger.debug("email in function : "+email);
        var filter='mail eq "' + email + '" and accountStatus eq "ACTIVE"';
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": filter
        }, ["_id", "userName", "givenName","sn", "mail","frIndexedString1","frIndexedString2","custom_secondaryMail"]);
        logger.debug("userQueryResult is -- "+ userQueryResult)
        
        if (userQueryResult && userQueryResult.result && userQueryResult.result.length > 0) {
            var userIdenitityQueryResult = openidm.query("managed/alpha_kyid_user_identity", {"_queryFilter": 'account/_refResourceId eq "' + userQueryResult.result[0]._id + '"' }, []);
            if(userIdenitityQueryResult.resultCount>0){
                var userIdenitity = userIdenitityQueryResult.result[0]
            }
        }

        if(userIdenitity){
            var lexId = userIdenitity.uuid;
            if(userIdenitity.languagePreference){
              nodeState.putShared("languagePreference", userIdenitity.languagePreference)  
            }
            nodeState.putShared("uuid", lexId)
            nodeState.putShared("userIdentity", userIdenitity._id)
            nodeState.putShared("verificationAttempt",userIdenitity.verificationAttempt)
            nodeState.putShared("lastVerificationDate",userIdenitity.lastVerificationDate)
            nodeState.putShared("orig_proofingMethod","4")

            if(userIdenitity && userIdenitity.riskIndicatorDetails){
                nodeState.putShared("exisitingRiskIndicatorDetails", JSON.stringify(userIdenitity.riskIndicatorDetails))
            }

            if(userIdenitity && userIdenitity.highRiskOverrideDate){
                nodeState.putShared("exisitingHighRiskOverrideDate", userIdenitity.highRiskOverrideDate)
            }
            
            if(userIdenitity && userIdenitity.riskIndicator){
                nodeState.putShared("exisitingRiskIndicator",userIdenitity.riskIndicator)
            }
        }

         if (userQueryResult && userQueryResult.result && userQueryResult.result.length > 0) {
            logger.debug("userQueryResult.result[0] : "+userQueryResult.result[0]);
            logger.debug("typeof result : "+ typeof(userQueryResult.result[0]))
            var  userResponse = userQueryResult.result[0];
            logger.debug("userResponse : "+userResponse);
            nodeState.putShared("audit_LOGON", userResponse.frIndexedString1)
           nodeState.putShared("audit_ID", userResponse._id)
           
            //fetch alternate email
            nodeState.putShared("UPN",userResponse.frIndexedString1);
            var userName= userResponse.userName
            nodeState.putShared("KOGID",userName)
            nodeState.putShared("UserId",userResponse._id)
            nodeState.putShared("orig_logOn", userResponse.frIndexedString1);
            nodeState.putShared("orig_upn", userResponse.frIndexedString2);
            nodeState.putShared("orig_organDonorRegistrationStatus", userResponse.custom_organdonor);
            logger.debug("PrintingUsrNameId:"+userName)
            var queryFilter='MFAMethod eq "SECONDARY_EMAIL" and KOGId eq "'+userName+'"';
            var querySecEmailResult= openidm.query("managed/alpha_kyid_mfa_methods",{
            "_queryFilter": queryFilter,
            "_fields": "MFAValue"
            });

            if(querySecEmailResult && querySecEmailResult.result && querySecEmailResult.result.length>0)
            {
                logger.debug("PrintingValueforAlternateEmailJSON:"+querySecEmailResult.result[0]);
                logger.debug("PrintingValueforAlternateEmail:"+querySecEmailResult.result[0].MFAValue);
                nodeState.putShared("alternatemail",querySecEmailResult.result[0].MFAValue);
           }  
            else{
                logger.debug("secondary mail not present");
                nodeState.putShared("alternatemail",null);
            }
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
        logger.debug("tokenizedEmail is --"+ tokenizedEmail);
        var response = openidm.query("managed/alpha_kyid_token_email", { "_queryFilter": '/tokenmail eq "' + tokenizedEmail + '"' });
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(response));
        if (response.result.length > 0) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.mailTokenValid);
            var result = response.result[0];
            //logger.debug("result: "+JSON.stringify(result));
            //logger.debug("result._id : "+result._id);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + response.result.length);
            deleteEmailTokenObject(result._id,result._rev);
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.mailTokenNotValid);
        }
    } catch(e){
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + e);
    }
    return false;
}


function deleteEmailTokenObject(id,rev) {
    try {
        var response = openidm.delete("managed/alpha_kyid_token_email/"+id,rev);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.deleteTokenSuccess);
    } catch(e){
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + e);
    }
    return false;
}


// Main execution
function main(){
    var lang = getLocale();
    nodeState.putShared("lang", lang);
    // var emailId = getEmailId();
     var emailId = nodeState.get("mail");
     logger.debug("email from nodestate : "+emailId);
    if (emailId) {
        // var tokenizedEmail = decodeAndCleanEmail(emailId);
        var tokenizedEmail =emailId;
        lookupInEmailTokenObject(tokenizedEmail);
        
        try {
            var email = nodeState.get("mail")
            logger.debug("email from nodestate 2 : "+email);
            // var email = nodeState.get("objectAttributes").get("mail");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.valueMail+"::"+email);
            if (email) {
                var user = queryUserByEmail(email);
                logger.debug("user from email: "+user);
                if (user) {
                    // Ensure that user properties exist before using them
                    if (user._id && user.mail) {
                        nodeState.putShared("mail", email);
                        nodeState.putShared("_id", user._id);
                        nodeState.putShared("username", user.mail);
                        nodeState.putShared("KOGID",user.userName);
                        nodeState.putShared("UPN",user.frIndexedString1);
                        nodeState.putShared("givenName",user.givenName);
                        nodeState.putShared("lastName",user.sn);
                        

                        // Extract domain - prefer frIndexedString2, fallback to frIndexedString1
                        var domainString = user.frIndexedString2 || user.frIndexedString1;
                        if (domainString && domainString.indexOf("@") !== -1) {
                            var domain = domainString.split("@")[1];
                            // var domainValue = domain.split(".");
                            // var prefix = domainValue[0];
                            nodeState.putShared("domain", domain);
                        } else {
                            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.nodeName + "::Cannot extract domain, both frIndexedString2 and frIndexedString1 are null or invalid");
                        }
                        
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID from query result: " + user._id);
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Shared state - mail: " + nodeState.get("mail") + ", username: " + nodeState.get("username"));
        
                        action.goTo(NodeOutcome.TRUE);
                    } else {
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is incomplete: _id or mail is missing.");
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
