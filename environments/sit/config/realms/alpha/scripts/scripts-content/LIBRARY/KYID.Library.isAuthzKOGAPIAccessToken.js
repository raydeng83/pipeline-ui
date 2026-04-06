/*
Script Name# KYID.Library.isAuthzKOGAPIAccessToken

Script Description# This library is used to retrieve access token for KOG APIs related to helpdesk.  

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
                //"Content-Type": "application/json"
                  "Content-Type":   "application/x-www-form-urlencoded"
              },
              form: {
                client_id: systemEnv.getProperty("esv.kyid.kogapi.isauthz.token.clientid"),
                client_secret:systemEnv.getProperty("esv.kyid.kogapi.isauthz.token.clientcredentials"),
                audience:systemEnv.getProperty("esv.kyid.kogapi.isauthztoken.audience"),
                grant_type:systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }
    
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
            //logger.error(apiResponse.text());
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