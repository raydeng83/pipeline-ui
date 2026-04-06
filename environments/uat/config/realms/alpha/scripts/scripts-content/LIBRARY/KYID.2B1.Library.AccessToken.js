/*
Script Name# KYID.Library.KOGAPIAccessToken

Script Description# This library is used to retrieve access token for KOG APIs.  

Functions#
1) getAccessToken

Input Params#
    apiURL<String>: API Request URL
    
Output Params#
    apiResponse<Object>: Response with status code & access token
*/


function getAccessToken(TOKEN_API_URL) {
    
    var resultJSON = {}
    
    try{
        var apiRequest = {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              form: {
                client_id: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"),
                client_secret:systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientcredentials"),
                scope:systemEnv.getProperty("esv.kyid.kogapi.token.scope"),
                grant_type:systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }
    
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
        logger.error("API Response Access Token: "+apiResponse);
        resultJSON = {
            "status":apiResponse.status,
            "response":apiResponse.json().get("access_token")
         }
        
    }catch(error){
          //callbacksBuilder.textOutputCallback(0, "Error: "+error);
        logger.error("API Response Access Token: "+apiResponse);
         resultJSON = {
            "status":apiResponse.status,
            "error":error
         }
    }
    logger.error("TokenAPIRespnse:"+JSON.stringify(resultJSON))
    return resultJSON;
}

function getAccessTokenCreateAccount(TOKEN_API_URL) {
    
    var resultJSON = {}
    
    try{
        var apiRequest = {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              form: {
                client_id: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"),
                client_secret: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientcredentials"),
                scope: systemEnv.getProperty("esv.kyid.kogapi.token.scope.createaccount"),
                grant_type: systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }
    
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
        resultJSON = {
            "status":apiResponse.status,
            "response":apiResponse.json().get("access_token")
         }
        logger.debug("TokenAPIRespnse in try:"+JSON.stringify(resultJSON))
        
    }catch(error){
          //callbacksBuilder.textOutputCallback(0, "Error: "+error);
        logger.error("getAccessTokenCreateAccount catch block:"+error)
         resultJSON = {
            "status":"500",
            "error":error
         }
    }
    logger.debug("TokenAPIRespnse:: getAccessTokenCreateAccount"+JSON.stringify(resultJSON))
    return resultJSON;
}

function getKOGKYIDAccessToken(TOKEN_API_URL,apiscope) {
    
    var resultJSON = {}
    
    try{
        var apiRequest = {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              form: {
                client_id: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"),
                client_secret: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientcredentials"),
                scope: apiscope,
                grant_type: systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }

        logger.debug("apiRequest in getKOGKYIDAccessToken =>"+JSON.stringify(apiRequest))
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
        logger.debug("apiResponse in getKOGKYIDAccessToken =>"+apiResponse.text())
        resultJSON = {
            "status":apiResponse.status,
            "response":apiResponse.json().get("access_token")
         }
        logger.error("TokenAPIRespnse in getKOGKYIDAccessToken:"+JSON.stringify(resultJSON))
        
    }catch(error){
        logger.error("Exception caught in getKOGKYIDAccessToken => "+error)
          //callbacksBuilder.textOutputCallback(0, "Error: "+error);
         resultJSON = {
            "status":apiResponse.status,
            "error":error
         }
    }
    logger.error("TokenAPIRespnse:"+JSON.stringify(resultJSON))
    return resultJSON;
}

exports.getAccessTokenCreateAccount = getAccessTokenCreateAccount;
exports.getKOGKYIDAccessToken = getKOGKYIDAccessToken;
exports.getAccessToken = getAccessToken;