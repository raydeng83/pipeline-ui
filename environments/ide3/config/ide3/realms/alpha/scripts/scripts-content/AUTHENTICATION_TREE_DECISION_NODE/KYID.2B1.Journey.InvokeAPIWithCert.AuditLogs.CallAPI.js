/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


var input = JSON.parse(nodeState.get("input"))
var url = input.url
var payload = input.payload
var method = input.method
var scope = input.scope
logger.debug("Scope is --> "+scope)


    if (callbacks.isEmpty()) {
        var response = getApiResponse(url,payload,method,scope);
        callbacksBuilder.textOutputCallback(0, JSON.stringify(response) );
         callbacksBuilder.confirmationCallback(0, ["next"], 0);
    } else {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; 
        action.goTo("True")
       
    }


function getApiResponse(url,payload,method,scope) {
try {
   //var apiURL = systemEnv.getProperty(url);
    logger.debug("url in getApiResponse is - "+url)
    //var apiURL =url;
    var result = {
        status:null,
        response:null
    }


 
    var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client")


    var kogTokenApi= systemEnv.getProperty("esv.kyid.2b.kogapi.token")

    var sihcertforlogapi;
if (systemEnv.getProperty("esv.kyid.cert.logs.client") && systemEnv.getProperty("esv.kyid.cert.logs.client") != null) {
    sihcertforlogapi = systemEnv.getProperty("esv.kyid.cert.logs.client");
    logger.error("the sihcertforlogapi"+sihcertforlogapi)
} else {
    logger.error("sihcertforlogapi is missing");
}

    var apiDBURL;
if (systemEnv.getProperty("esv.kyid.sih.auditlogsdb") && systemEnv.getProperty("esv.kyid.sih.auditlogsdb") != null) {
    apiDBURL = systemEnv.getProperty("esv.kyid.sih.auditlogsdb");
    logger.error("the apiDBURL"+apiDBURL)
} else {
    logger.error("apiDBURL is missing");
} 

    var apiDBHeader;
if (systemEnv.getProperty("esv.kyid.cert.logs.header") && systemEnv.getProperty("esv.kyid.cert.logs.header") != null) {
    apiDBHeader = systemEnv.getProperty("esv.kyid.cert.logs.header");
    logger.error("the apiDBHeader"+apiDBHeader)
} else {
    logger.error("apiDBHeader is missing");
}
     logger.debug("Payload From Custom Endpoint: " + JSON.stringify(payload));

    // var apiTokenRequest = require('KYID.2B1.Library.AccessToken');

    if(scope!=null){
        var kogAPITokenResponse = getAccessToken(kogTokenApi,scope);
        logger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse))
        
        if (kogAPITokenResponse.status === 200) {
            logger.debug("KYID.2B1.Journey.InvokeAPIWithCert.CallAPI   -- access token status is 200"+JSON.stringify(kogAPITokenResponse) )
            var bearerToken = kogAPITokenResponse.response;
            var requestOptions = {
                "clientName": sihcertforapi,
                "method": method,
                "headers": {
                    "Content-Type": "application/json"
                  },
                "token": bearerToken,
                "body": payload
             };

            logger.debug("requestOptions value -"+JSON.stringify(requestOptions))
        
            var res = httpClient.send(url,requestOptions).get(); 
            logger.debug("API call Result is "+ JSON.stringify(JSON.parse(res.text())))
            action.withHeader(`Response code: ${res.status}`); 
            logger.debug("Status is - "+`${res.status}`)
            logger.debug("API call Result is "+ JSON.stringify(JSON.parse(res.text())))
            result.status = `${res.status}`
            result.response = JSON.parse(res.text())
            logger.debug("API call Response is "+JSON.stringify(result))
            if(res){
                //return JSON.parse(res.text())
                return result
            }
            else{
                return {code:400, message:"no response from api"}
            }
        }
    
    } else {
        var requestOptions = {
                "clientName": sihcertforlogapi,
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": apiDBHeader
                  },
                "body": payload
             };
           var apiURL = apiDBURL
            var res = httpClient.send(apiURL,requestOptions).get(); 
            logger.error("API call Result is1 "+ JSON.stringify(JSON.parse(res.text())))
            action.withHeader(`Response code: ${res.status}`); 
            logger.error("Status is - "+`${res.status}`)
            logger.error("API call Result is2 "+ JSON.stringify(JSON.parse(res.text())))
            result.status = `${res.status}`
            result.response = JSON.parse(res.text())
            logger.error("API call Response is3 "+JSON.stringify(result))
            if(res){
                //return JSON.parse(res.text())
                return result
            }
            else{
                return {code:400, message:"no response from api"}
            }
    }
    

    
    } catch (error) {
        logger.error("Error Occurred while Calling API" +error)
        return {code:400,message:"Error Occurred while Calling API"+ error.message}
    }


    
}





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




function getAccessToken(TOKEN_API_URL,scope) {
    
    var resultJSON = {}
    logger.debug("getAccessToken Scope is --> "+scope)
    try{
        var apiRequest = {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              form: {
                client_id: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"),
                client_secret: systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientcredentials"),
                // scope: systemEnv.getProperty("esv.kyid.kogapi.token.scope.createaccount"),
                scope: scope,
                grant_type: systemEnv.getProperty("esv.kyid.kogapi.token.granttype")
              }
        }
        logger.debug("getAccessToken apiRequest is --> "+JSON.stringify(apiRequest));
    
        var apiResponse = httpClient.send(TOKEN_API_URL, apiRequest).get();
        resultJSON = {
            "status":apiResponse.status,
            "response":apiResponse.json().get("access_token")
         }
        logger.debug("TokenAPIRespnse in try:"+JSON.stringify(resultJSON))
        
    }catch(error){
          //callbacksBuilder.textOutputCallback(0, "Error: "+error);
         resultJSON = {
            "status":apiResponse.status,
            "error":error
         }
    }
    logger.debug("TokenAPIRespnse:"+JSON.stringify(resultJSON))
    return resultJSON;
}



