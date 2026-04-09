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
                client_id: systemEnv.getProperty("esv.kyid.kogapi.token.clientid"),
                client_secret:systemEnv.getProperty("esv.kyid.kogapi.token.clientcredentials"),
                audience:systemEnv.getProperty("esv.kyid.kogapi.token.audience"),
                grant_type:systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }
    
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
        resultJSON = {
            "status":apiResponse.status,
            "response":apiResponse.json().get("access_token")
         }
        
    }catch(error){
          //callbacksBuilder.textOutputCallback(0, "Error: "+error);
         resultJSON = {
            "status":apiResponse.status,
            "error":error
         }
    }
    
    return resultJSON;
}

exports.getAccessToken = getAccessToken;