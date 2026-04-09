/*
Script Name# KYID.Library.ProcessKOGAPIRequest

Script Description# This library script is used to process HTTP Client REST API Request.  

Functions#
1) processHttpRequest
2) processKOGProfileAPIHttpResponse

Input Params#
    apiName<String>: KOG API Name
    apiURL<String>: API Request URL
    methodType<String>: POST, GET
    jsonObjBody<JSON Object>: Data to be sent alongside an API request
    bearerToken<String>: access-token
    
Output Params#
    apiResponse<Object>: Response to an API Request
*/
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

function processKOGProfileAPIHttpResponse(status, apiResponse) {
   var resultJSON = {};
    var apiResponse = JSON.parse(apiResponse);
    
    if(apiResponse.ResponseStatus == 0){
          resultJSON = {
            "status":status,
            "apiresponsestatus":apiResponse.ResponseStatus,
            "response":apiResponse.UserProfileFR
         }
     } else if(apiResponse.ResponseStatus == 1){
         resultJSON = {
            "status":status,
            "apiresponsestatus":apiResponse.ResponseStatus,
            "response":apiResponse.MessageResponses
         }
     } else { 
         resultJSON = {
            "status":status,
            "apiresponsestatus":apiResponse.ResponseStatus,
            "response":apiResponse.MessageResponses
         }
     }
    
    return resultJSON;   
}    

function processHttpRequest(apiName,apiURL,methodType,jsonObjBody,bearerToken) {
    
    var resultJSON = {};
    try{
         if(JSON.stringify(jsonObjBody).length > 2 && jsonObjBody!=null){
             var apiRequest = {
                            method: methodType,
                            headers: {
                                "Content-Type": "application/json"
                              },
                            token: bearerToken,
                            body: jsonObjBody
             }         
         } else {             
             var apiRequest = {
                            method: methodType,
                            headers: {
                                "Content-Type": "application/json"
                              },
                            token: bearerToken
             }
         }
         var apiResponse = httpClient.send(apiURL, apiRequest).get();
         var status = apiResponse.status;
        if(apiName!=null) {
            if(apiName.localeCompare("KOG_USR_PROFILE")==0){
                resultJSON = processKOGProfileAPIHttpResponse(status, apiResponse.text());
            }
        } else {
            resultJSON = {
            "status":status,
            "success":apiResponse.text()
            }
        }   
        
    } catch(error){
        nodeLogger.error("the error in http request" + error);
        resultJSON = {
            "status":status,
            "error":error
         }
    } 

    return resultJSON;
    
}

exports.processHttpRequest = processHttpRequest;