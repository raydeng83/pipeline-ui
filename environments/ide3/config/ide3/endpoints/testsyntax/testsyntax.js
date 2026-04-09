  (function () {
    if (request.method === 'create') {
      // POST
      const apiRequestPayload = request.content.payload
      const apiRequestAction = request.content.action
      //logger.error("apiRequestPayload in endpoint/validate-endpt-access is => " + JSON.stringify(apiRequestPayload))
      logger.error("apiRequestAction in endpoint/validate-endpt-access is => " + apiRequestAction)
      if (apiRequestAction === 0) {
        return validateAccessToken(apiRequestPayload)
      }
        
    } else if (request.method === 'read') {
      // GET
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());


/**
  * To validate client credentials from headers.
 * Expected headers:
  *   - x-client-id
  *   - x-client-secret
  */
 function validateAccessToken(context) {
   
      let res = {}
      let accessTokenToValidate = ""
      const httpHeadersInfo = context.http.headers
      const client = "kyid-endpt-access"
      const clientCreds = "3aIzELYA3j3QlLFBUC7xspR1CPeni751XA5N"
      let introspectUrl = "https://sso.ide3.kyid.ky.gov/am/oauth2/alpha/introspect";
     
      if (!httpHeadersInfo["x-authorize-endpt-access"]) {
        logger.error("Missing token parameter")
        return { "status": 403, message: "Unauthorized" };
      }
      accessTokenToValidate = httpHeadersInfo["x-authorize-endpt-access"]; 
      //logger.error("accessTokenToValidate => "+JSON.stringify(accessTokenToValidate))

      let params = {
         method: "POST",
         url: introspectUrl, 
         form: {
           client_id:client,
           client_secret: clientCreds,
           token:accessTokenToValidate
         },
         headers: {
             "Content-Type": "application/x-www-form-urlencoded"
          }
      };
      logger.error("params1 => "+JSON.stringify(params))

      try {
        const introspectionResponse = openidm.action("external/rest", "call", params);
        logger.error("introspectionResponse => "+JSON.stringify(introspectionResponse))
        
        // Response contain an "active": true or false element
        if (introspectionResponse && introspectionResponse.active === true) {
          logger.error("Token is active. Scopes: " + jsonResponse.scope);
            // Token is active
            return {
                "status": "200",
                "userInfo": introspectionResponse
            };
        } else {
            // Token is inactive or invalid
            logger.error("Token is inactive or invalid.");
            return {
                "status": "403",
                "message": "Unauthorized"
            };
        }

      } catch (err) {
          logger.error("Introspection request failed: " + err.message)
          return { "status": 500, message: "Unauthorized" };
      }
     
 }


/**
  * To validate client credentials from headers.
 * Expected headers:
  *   - x-client-id
  *   - x-client-secret
  */
 function validateClientCredentials(context) {

   try{
     const httpHeaders = context.http.headers
     //logger.error("Print context http Info => "+JSON.stringify(context.http.headers))
     //logger.error("Print context http client Info => "+httpHeaders["x-client-id"])
     //logger.error("Print context http client Info => "+httpHeaders["x-client-secret"])
     const clientId = httpHeaders["x-client-id"]
     const clientSecret = httpHeaders["x-client-secret"]
     let expectedIdsESVs = null
     let expectedSecretsESVs = null
     let expectedIds = []
     let expectedSecrets = []
     let expectedId = ""
     let expectedSecret = ""
     let res = {}
  
     if (!clientId || !clientSecret) {
       res.status = 403
       res.message = "Not Authorized"
       logger.error("Missing client credentials")
       return res
     }
  
     /*
       Format of Endpoint Access client credentials -
       esv.kyid.endpt.access.client = esv.kyid.bsp.endpt.access.client (**Sample Value Eg. esv.kyid.bsp.endpt.access.client esv.kyid.ssp.endpt.access.client)
       esv.kyid.endpt.access.secret = esv.kyid.bsp.endpt.access.secret (**Sample Value Eg. esv.kyid.bsp.endpt.access.secret esv.kyid.ssp.endpt.access.secret) 
     */
     if (!identityServer.getProperty("esv.kyid.endpt.access.client") 
         || !identityServer.getProperty("esv.kyid.endpt.access.secret")) {
       res.status = 500
       res.message = "Server not configured"
       return res
     }
  
     expectedIdsESVs = identityServer.getProperty("esv.kyid.endpt.access.client").split(" ")
     //logger.error("expectedIdsESVs are => "+expectedIdsESVs)
     expectedSecretsESVs = identityServer.getProperty("esv.kyid.endpt.access.secret").split(" ")
     //logger.error("expectedSecretsESVs are => "+expectedSecretsESVs)
  
     //logger.error("Total clientIDs => "+expectedIdsESVs.length)
     //logger.error("Total secrets => "+expectedSecretsESVs.length)
  
     if(expectedIdsESVs.length>0 && expectedSecretsESVs.length>0) {
  
       for(let i=0; i<expectedIdsESVs.length; i++){
        expectedIds.push(identityServer.getProperty(expectedIdsESVs[i]))
       }
       
       for(let j=0; j<expectedSecretsESVs.length; j++){
        expectedSecrets.push(identityServer.getProperty(expectedSecretsESVs[j]))
       }   
    
       if(expectedIds.indexOf(clientId)!=-1){
         expectedId = expectedIds[expectedIds.indexOf(clientId)]
         //logger.error("expectedId is => "+expectedId)
       }
  
       if(expectedSecrets.indexOf(clientSecret)!=-1){
         expectedSecret = expectedSecrets[expectedSecrets.indexOf(clientSecret)]
         //logger.error("expectedSecret is => "+expectedSecret)
       }
      
       if ((clientId.length !== expectedId.length) || (clientSecret.length !== expectedSecret.length)){
           logger.error("****endpoint/validate-endpt-access :: You're not Authorized****")
           res.status = 403
           res.message = "Not Authorized"
           return res
       }
    
       if ((clientId === expectedId) && (clientSecret === expectedSecret)) {
         logger.error("****endpoint/validate-endpt-access :: You're Authorized****")
         res.status = 200
         res.message = "Authorized"
         return res
       }
       
     } else {
         logger.error("****endpoint/validate-endpt-access :: You're not Authorized****")
         res.status = 403
         res.message = "Not Authorized"
         return res
     } 
     
   } catch(error){
       logger.error("Exception caught in validateClientCredentials() in endpoint/validate-endpt-access => "+getException(error))
       res.status = 500
       res.message = "Not Authorized"
       return res
   }
    
 }


/**
* @name <getException>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getException(e) {
    let _ = require('lib/lodash');
    if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
        return e.javaException.cause.localizedMessage || e.javaException.cause.message;
    } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
        return e.messageDetail.message;
    } else if (_.has(e, 'message')) {
        return e.message;
    } else {
        return e;
    }
}
