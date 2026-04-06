var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "GetUserID",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetUserIDfromKOGID",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUND: "User Found",
    NOT_FOUND: "User Not Found",
    ERROR: "Error"
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

function queryUserByKOGID(KOGID) {
    var userInfoJSON = {}
    var ridpReferenceID = generateGUID();
    try {
        logger.debug("KOGID in Get User Script" + KOGID);
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail", "frIndexedString2", "frIndexedString1", "custom_selfEnrollMFA", "givenName", "sn", "custom_userIdentity/*"]);
        nodeState.putShared("audit_KOGID", KOGID)
        nodeState.putShared("audit_LOGON", userQueryResult.result[0].frIndexedString1)
        nodeState.putShared("audit_ID", userQueryResult.result[0]._id)

          if(userQueryResult.result[0].custom_userIdentity){
              var userIdentity = userQueryResult.result[0].custom_userIdentity;
              var givename = userIdentity.givenName || "";
              var sn = userIdentity.sn || "";
              var middleName = userIdentity.middleName || "";
              var gender = userIdentity.gender || "";
              var dob = userIdentity.dob || "";
              var addressLine1 = userIdentity.addressLine1 || "";
              var addressLine2 = userIdentity.addressLine2 || "";
              var city = userIdentity.city || "";
              var state = userIdentity.state || "";
              var postalCode = userIdentity.postalCode || "";
              var stateCode = userIdentity.stateCode || "";
              var countyCode = userIdentity.countyCode || "";
              var countryCode = userIdentity.countryCode || "";
              var zip = userIdentity.zip || "";       
              var zipExtension = userIdentity.zipExtension || "";
              var suffix = userIdentity.suffix || "";
              var title = userIdentity.title || "";

            if(userIdentity && userIdentity.riskIndicatorDetails){
                nodeState.putShared("exisitingRiskIndicatorDetails", JSON.stringify(userIdentity.riskIndicatorDetails))
            }
                
            if(userIdentity && userIdentity.highRiskOverrideDate){
                nodeState.putShared("exisitingHighRiskOverrideDate", userIdentity.highRiskOverrideDate)
            }
            
            if(userIdentity && userIdentity.riskIndicator){
                nodeState.putShared("exisitingRiskIndicator",userIdentity.riskIndicator)
            }

              userInfoJSON["givenName"] = givename;
              userInfoJSON["sn"] = sn;
              userInfoJSON["middleName"] = middleName;
              userInfoJSON["gender"] = gender;
              userInfoJSON["dob"] = dob;
              userInfoJSON["addressLine1"] = addressLine1;
              userInfoJSON["addressLine2"] = addressLine2;
              userInfoJSON["city"] = city;
              userInfoJSON["state"] = state;
              userInfoJSON["postalCode"] = postalCode;
              userInfoJSON["stateCode"] = stateCode;
              userInfoJSON["countyCode"] = countyCode;
              userInfoJSON["countryCode"] = countryCode;
              userInfoJSON["zip"] = zip;
              userInfoJSON["zipExtension"] = zipExtension;
              userInfoJSON["suffix"] = suffix;
              userInfoJSON["title"] = title;
              userInfoJSON["referenceNumber"] = ridpReferenceID;
        }
        nodeState.putShared("ridpReferenceID", ridpReferenceID)
        nodeState.putShared("userInfoJSON", userInfoJSON);

        logger.debug("userQueryResult" + userQueryResult);
        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            logger.debug("Inside" + userQueryResult.result[0]);
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
        return null;
    }
}


function generateGUID() {     
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';     
    var result = '';   
    var length = 8;  
    for (var i = 0; i < length; i++) {         
        result += chars.charAt(Math.floor(Math.random() * chars.length)); 
    } return result; 
}


function getMFAObject(usrKOGID) {
    try {
        var mfaValue = null;
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
        });

        if (mfaMethodResponses.result.length > 0) {
            for (var i = 0; i < mfaMethodResponses.result.length; i++) {
                var mfaMethod = mfaMethodResponses.result[i].MFAMethod;
                if (mfaMethod === "SECONDARY_EMAIL") {
                    mfaValue = mfaMethodResponses.result[i].MFAValue;
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " SECONDARY_EMAIL: " + mfaValue + " " + KOGID);

                }
            }
        }

        return mfaValue;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

// Main execution
try {
    var KOGID = nodeState.get("KOGID");
  
    if (KOGID) {
        var user = queryUserByKOGID(KOGID);
        logger.debug("the KOGID in KYID.2B1.Journey.GetUserIDfromKOGID"+ KOGID)
        var alternateEmail = getMFAObject(KOGID);
        nodeState.putShared("alternateEmail",alternateEmail);
         
        if (user && user._id) {
            nodeState.putShared("_id", user._id);
            nodeState.putShared("userMail",user.mail);
            nodeState.putShared("mail",user.mail);
            nodeState.putShared("searchAttribute","mail");
            nodeState.putShared("firstName",user.givenName);
            nodeState.putShared("lastName",user.sn);
            if (user.frIndexedString1){
                nodeState.putShared("UPN",user.frIndexedString1)
                nodeState.putShared("orig_logOn",user.frIndexedString1)
            }

            if(user.custom_organdonor){
                nodeState.putShared("orig_organDonorRegistrationStatus", userResponse.custom_organdonor);
            }
            
           if (user.frIndexedString2 && user.frIndexedString2.indexOf("@") !== -1) {
                var Logon = user.frIndexedString2;
                var domain = Logon.split("@");
                if (domain.length > 1) {
                    var domainParts = domain[1].split(".");
                    if (domainParts.length > 0) {
                        var prefix = domainParts[0];
                        nodeState.putShared("domain", domain[1]);
                        nodeState.putShared("orig_upn", user.frIndexedString2);
                    }
                }
            }

            // if(user.custom_selfEnrollMFA){
            //     nodeState.putShared("selfEnrollMFA", user.custom_selfEnrollMFA);
            // }

            if (typeof user.custom_selfEnrollMFA !== "undefined") {
                logger.debug("the selfEnrollMFA from nodeState: "+user.custom_selfEnrollMFA)
                nodeState.putShared("selfEnrollMFA", user.custom_selfEnrollMFA);
            }
            
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Session valid for user " +user.mail);
            action.goTo(NodeOutcome.FOUND);
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            action.goTo(NodeOutcome.NOT_FOUND);
        }
    } else {
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}