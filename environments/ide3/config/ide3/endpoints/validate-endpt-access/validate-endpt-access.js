var validateEndptAccessLoggerPrefix = "VALIDATE-ENDPOINT-ACCESS";

(function () {

  if (request.method === 'create') {

    try {
      // POST
      const apiRequestPayload = request.content.payload
      const apiRequestAction = request.content.action
      logger.error(validateEndptAccessLoggerPrefix + "::apiRequestPayload in endpoint/validate-endpt-access::" + apiRequestPayload)
      logger.error(validateEndptAccessLoggerPrefix + "::apiRequestAction in endpoint/validate-endpt-access::" + apiRequestAction)

      if (apiRequestAction === 0) {
        //Controls whether endpoint authorization needs to be evaluated 
        if (!identityServer.getProperty("esv.validate.endpoint.access.enabled")) {
          logger.error(validateEndptAccessLoggerPrefix + "::Server not configured")
          return { status: 500, message: "Unauthorized" };
        }

        let validateEndptAccess = identityServer.getProperty("esv.validate.endpoint.access.enabled");
        logger.error(validateEndptAccessLoggerPrefix + "::validateEndptAccess value::" + validateEndptAccess)
        logger.error("esv.validate.endpoint.access.enabled value is: " + validateEndptAccess)
        if (validateEndptAccess == "true" || validateEndptAccess == true) {

          if (apiRequestPayload && apiRequestPayload.attributes &&
            apiRequestPayload.oauth2 && apiRequestPayload.oauth2.rawInfo) {
            logger.error("inside apiRequestPayload oauth2")
            let originalURI = apiRequestPayload.attributes.parent.parent.originalUri;
            let endpointName = apiRequestPayload.parent.matchedUri;
            let clientID = apiRequestPayload.oauth2.rawInfo.client_id;
            logger.error(validateEndptAccessLoggerPrefix + "::Endpoint::" + endpointName);

            if (clientID === "idm-provisioning") {
              logger.error(validateEndptAccessLoggerPrefix + "::Skip Authorize Check. ClientID in OAuth context::" + clientID);
              return { status: 200, message: "Authorized" };

            } else if (!originalURI.includes(endpointName)) {
              logger.error(validateEndptAccessLoggerPrefix + "::Skip Authorize Check. originalURI in Attributes context::"
                + apiRequestPayload.attributes.parent.parent.originalUri);
              return { status: 200, message: "Authorized" };

            } else {
              logger.error(validateEndptAccessLoggerPrefix + "::Proceed with Authorization Check");
              return validateAccessToken(apiRequestPayload)
            }
            //Scheduler Calling Endpoints Internally
          } else if (apiRequestPayload && apiRequestPayload.security && apiRequestPayload.security.authenticationId) {
            logger.error("inside apiRequestPayload security")
            let authenticationIdClient = apiRequestPayload.security.authenticationId
            if (authenticationIdClient === "system") {
              logger.error(validateEndptAccessLoggerPrefix + "::Skip Authorize Check. authenticationId in security context::"
                + authenticationIdClient);
              return { status: 200, message: "Authorized" };
            } else {
              logger.error("authenticationIdClient is not system, or no authenticationIdClient")
              return { status: 200, message: "Authorized" };
            }
          } else {
            logger.error("returning authorized ")
            return { status: 200, message: "Authorized" };
          }
        } else {
          logger.error("returning authorized without validating endpoint access")
          return { status: 200, message: "Authorized" };
        }
      }
    } catch (error) {
      logger.error(validateEndptAccessLoggerPrefix + ":: Error Encountered during validating endpoint authorization :: " + error)
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
  } else {
    logger.error(validateEndptAccessLoggerPrefix + ":: Unknown error ")
    throw { code: 500, message: 'Unknown error' };
  }
}());


/**
  * To validate client credentials from headers.
 * Expected headers:
  *   - x-client-id
  *   - x-client-secret
*/
function validateAccessToken(context) {
  let accessTokenToValidate = "";
  const httpHeadersInfo = context.http.headers;
  logger.error("endpoint/validate-endpt-access httpHeadersInfo => " + JSON.stringify(httpHeadersInfo))

  if (!identityServer.getProperty("esv.kyid.endpt.access.client")
    || !identityServer.getProperty("esv.kyid.endpt.access.secret")
    || !identityServer.getProperty("esv.kyid.introspect.url")) {
    logger.error(validateEndptAccessLoggerPrefix + "::Server not configured");
    return { status: 500, message: "Unauthorized" };
  }

  if (!httpHeadersInfo["x-authorize-endpt-access"]) {
    logger.error(validateEndptAccessLoggerPrefix + "::Missing token parameter");
    return { status: 401, message: "Unauthorized" };
  }
  logger.error("endpoint/validate-endpt-access httpHeadersInfo x-authorize-endpt-access => " + httpHeadersInfo["x-authorize-endpt-access"])

  const client = identityServer.getProperty("esv.kyid.endpt.access.client");
  const clientCreds = identityServer.getProperty("esv.kyid.endpt.access.secret")
  //const introspectUrl = "https://sso"+identityServer.getProperty("esv.kyid.cookie.domain")+"/am/oauth2/alpha/introspect";
  const introspectUrl = identityServer.getProperty("esv.kyid.introspect.url")
  logger.error(validateEndptAccessLoggerPrefix + "::introspectUrl in endpoint/validate-endpt-access::" + introspectUrl)

  accessTokenToValidate = httpHeadersInfo["x-authorize-endpt-access"];

  const body =
    "client_id=" + encodeURIComponent(client) +
    "&client_secret=" + encodeURIComponent(clientCreds) +
    "&token=" + encodeURIComponent(accessTokenToValidate);

  const params = {
    method: "POST",
    url: introspectUrl,
    body: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    }
  };

  //logger.error(validateEndptAccessLoggerPrefix+"::params in endpoint/validate-endpt-access::" + JSON.stringify(params));

  try {
    const introspectionResponse = openidm.action("external/rest", "call", params);
    logger.error(validateEndptAccessLoggerPrefix + "::introspectionResponse in endpoint/validate-endpt-access::" + JSON.stringify(introspectionResponse));

    if (introspectionResponse && introspectionResponse.active === true) {
      logger.error(validateEndptAccessLoggerPrefix + "::Token is active. Scopes::" + introspectionResponse.scope);
      return {
        status: 200,
        message: introspectionResponse
      };
    }

    logger.error(validateEndptAccessLoggerPrefix + "::Token is inactive or invalid");
    return {
      status: 401,
      message: "Unauthorized"
    };
  } catch (err) {
    logger.error(validateEndptAccessLoggerPrefix + "::Introspection request failed::" + err.message);
    return { status: 500, message: "Unauthorized" };
  }
}


/**
  * To validate client credentials from headers.
 * Expected headers:
  *   - x-client-id
  *   - x-client-secret
  */
function validateClientCredentials(context) {

  try {
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

    if (expectedIdsESVs.length > 0 && expectedSecretsESVs.length > 0) {

      for (let i = 0; i < expectedIdsESVs.length; i++) {
        expectedIds.push(identityServer.getProperty(expectedIdsESVs[i]))
      }

      for (let j = 0; j < expectedSecretsESVs.length; j++) {
        expectedSecrets.push(identityServer.getProperty(expectedSecretsESVs[j]))
      }

      if (expectedIds.indexOf(clientId) != -1) {
        expectedId = expectedIds[expectedIds.indexOf(clientId)]
        //logger.error("expectedId is => "+expectedId)
      }

      if (expectedSecrets.indexOf(clientSecret) != -1) {
        expectedSecret = expectedSecrets[expectedSecrets.indexOf(clientSecret)]
        //logger.error("expectedSecret is => "+expectedSecret)
      }

      if ((clientId.length !== expectedId.length) || (clientSecret.length !== expectedSecret.length)) {
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

  } catch (error) {
    logger.error("Exception caught in validateClientCredentials() in endpoint/validate-endpt-access => " + getException(error))
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
