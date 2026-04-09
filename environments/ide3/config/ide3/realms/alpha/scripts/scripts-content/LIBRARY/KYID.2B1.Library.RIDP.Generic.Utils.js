/**
 * Queries the ping status using a Lexical ID.
 * @function
 * @name queryPingByLexicalID
 */


function searchUserByKOGID(id, nodeConfig, transactionId){
    var id = id;
    try{
        var pingSearchResponse = openidm.query("managed/alpha_user/", { "_queryFilter": '_id eq "' + id + '"' }, ["*","custom_userIdentity/*"]);
        if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
            return pingSearchResponse.result[0];
        }else{
            return null;
        }
    }catch(error){
        logger.error(transactionId + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in searchUserByKOGID Function" + error.message);
        return null;
    }

}


function queryPingByLexiID(lexID, nodeConfig,transactionid){
    var lexID = lexID;
    var userIdentityResponse = null;
    var searchAccountArray = []
    try {
        userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'uuid eq "' + lexID + '"' }, ["account/*","*"]);
        if(userIdentityResponse && userIdentityResponse.result && userIdentityResponse.result.length > 0){
            //var accounts = userIdentityResponse.result[0].account;
            var accounts = userIdentityResponse.result;
            //logger.debug("queryPingByLexiID is :: " + JSON.stringify(userIdentityResponse))
            accounts.forEach(function(account){
                if(account.account[0].mail && account.account[0].mail !== null){
                    logger.debug("searchMail is --> "+ account.account[0].mail);  
                    searchAccountArray.push(account.account[0])
                }
            })
            return searchAccountArray;
        }else{
            return searchAccountArray;
        }
    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in queryPingByLexiID Function" + error.message);
        return {"error": error};
    }
}

/**
 * Queries the ping status using a Lexical ID.
 * @function
 * @name isHighRiskAccount
 */
function isHighRiskAccount(accounts, nodeConfig, transactionid){
    var highRiskAccountArray = []
    try {
        if(!accounts || accounts.length === 0){
            return highRiskAccountArray;
        }else{
            for(var i=0; i<accounts.length; i++){
                var account = accounts[i];
                if(account.accountStatus && account.accountStatus.toLowerCase() === "terminated" && account.custom_riskLevel && account.custom_riskLevel.toLowerCase() === "high"){
                    logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "High Risk Account Found with mail: " + account.mail);
                    highRiskAccountArray.push(account);
                }
            }
            return highRiskAccountArray;
        }
    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in isHighRiskAccount Function" + error.message);
        return {"error": error};
    }
}

function searchUserInPingResponse(kogID, verifiedLexId){
    var outcome = null;
    logger.debug("verifiedLexId :: " + verifiedLexId)
    try {
        logger.debug("kogID in library is :: "+ kogID)
        var pingSearchResponse = openidm.query("managed/alpha_user/", { "_queryFilter": 'userName eq "' + kogID + '"' }, ["*","custom_userIdentity/*"]); 
        logger.debug("pingSearchResponse in library is :: "+ JSON.stringify(pingSearchResponse))
        logger.debug("uuid in library is :: "+ pingSearchResponse.result[0].custom_userIdentity.uuid)
        if(pingSearchResponse && pingSearchResponse.resultCount>0){
            if(pingSearchResponse.result[0].userName &&  pingSearchResponse.result[0].custom_userIdentity && (pingSearchResponse.result[0].custom_userIdentity.uuid === verifiedLexId || verifiedLexId == null || pingSearchResponse.result[0].custom_userIdentity.uuid == null || pingSearchResponse.result[0].custom_userIdentity.uuid === "")){
                 logger.debug("custom_userIdentity in library is :: "+ JSON.stringify(pingSearchResponse.result[0].custom_userIdentity))
                if(pingSearchResponse.result[0].mail && pingSearchResponse.result[0].accountStatus && pingSearchResponse.result[0].custom_riskLevel ){
                    logger.debug("mail in library is :: "+ pingSearchResponse.result[0].mail)
                    outcome = {"mail": pingSearchResponse.result[0].mail,"kogID": pingSearchResponse.result[0].userName, "riskLevel": pingSearchResponse.result[0].custom_riskLevel || "low", "accountStatus": pingSearchResponse.result[0].accountStatus, "_id":pingSearchResponse.result[0]._id, "lexID":pingSearchResponse.result[0].custom_userIdentity.uuid || "","logOn" : (pingSearchResponse.result[0].custom_logon ? pingSearchResponse.result[0].custom_logon : ""), "upn": (pingSearchResponse.result[0].frIndexedString1 ? pingSearchResponse.result[0].frIndexedString1 : "")}
                }else{
                    outcome = {"mail": pingSearchResponse.result[0].mail,"kogID": pingSearchResponse.result[0].userName, "riskLevel": "low", "accountStatus": pingSearchResponse.result[0].accountStatus, "_id":pingSearchResponse.result[0]._id, "lexID":pingSearchResponse.result[0].custom_userIdentity.uuid || ""}
                }
            }else if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity.uuid !== verifiedLexId){
                outcome = {"error": "lexid_mismatch", "_id":pingSearchResponse.result[0]._id, "accountStatus": pingSearchResponse.result[0].accountStatus, "riskLevel": pingSearchResponse.result[0].custom_riskLevel || "low"};
            }else{
                // Create user Identity in this scenario
                outcome = {"mail": pingSearchResponse.result[0].mail,"kogID": pingSearchResponse.result[0].userName};
            }

            // if(pingSearchResponse.result[0].accountStatus && pingSearchResponse.result[0].accountStatus.toLowerCase() === "terminated" && pingSearchResponse.result[0].riskLevel && pingSearchResponse.result[0].riskLevel.toLowerCase() === "high"){
            //     logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "High Risk Account Found with mail: " + account.mail);
            //     return {"mail": pingSearchResponse.result[0].mail, "riskLevel": pingSearchResponse.result[0].riskLevel, "accountStatus": pingSearchResponse.result[0].accountStatus};
            // }else if(pingSearchResponse.result[0].accountStatus && (pingSearchResponse.result[0].accountStatus.toLowerCase() === "terminated" && pingSearchResponse.result[0].riskLevel && pingSearchResponse.result[0].riskLevel.toLowerCase() === "low")){
            //     return {"mail": pingSearchResponse.result[0].mail, "riskLevel": pingSearchResponse.result[0].riskLevel, "accountStatus": pingSearchResponse.result[0].accountStatus};
            // }else if(pingSearchResponse.result[0].accountStatus && (pingSearchResponse.result[0].accountStatus.toLowerCase() === "active" || pingSearchResponse.result[0].accountStatus.toLowerCase() === "suspended")){
            //     return {"mail": pingSearchResponse.result[0].mail, "riskLevel": pingSearchResponse.result[0].riskLevel, "accountStatus": pingSearchResponse.result[0].accountStatus};
            // }
        } else{
            return null;
        }  
        logger.debug("outcome in library is :: "+ JSON.stringify(outcome))
        return outcome;
    } catch (error) {
        logger.error("Error in searchUserInPing Function" + error.message);
        return null
    }  
} 



exports.queryPingByLexiID = queryPingByLexiID;
exports.isHighRiskAccount = isHighRiskAccount;
exports.searchUserInPingResponse = searchUserInPingResponse;
exports.searchUserByKOGID = searchUserByKOGID;