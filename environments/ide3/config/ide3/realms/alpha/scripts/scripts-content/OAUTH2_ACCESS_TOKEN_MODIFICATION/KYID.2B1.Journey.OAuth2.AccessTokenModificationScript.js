/*
 * Copyright 2019-2023 ForgeRock AS. All Rights Reserved.
 *
 * Use of this code requires a commercial software license with ForgeRock AS
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
 * This script lets you modify information associated with an OAuth2 access token
 * with methods provided by the AccessToken (1) interface.
 * The changes made to OAuth2 access tokens will directly impact the size of the CTS tokens,
 * and, similarly, the size of the JWTs if client-based OAuth2 tokens are utilized.
 * When adding/updating fields make sure that the token size remains within client/user-agent limits.
 *
 * Defined variables:
 * accessToken - AccessToken (1).
 *               The access token to be updated.
 *               Mutable object, all changes to the access token will be reflected.
 * scopes - Set<String> (6).
 *          Always present, the requested scopes.
 * requestProperties - Unmodifiable Map (5).
 *                     Always present, contains a map of request properties:
 *                     requestUri - The request URI.
 *                     realm - The realm that the request relates to.
 *                     requestParams - A map of the request params and/or posted data.
 *                                     Each value is a list of one or more properties.
 *                                     Please note that these should be handled in accordance with OWASP best practices:
 *                                     https://owasp.org/www-community/vulnerabilities/Unsafe_use_of_Reflection.
 * clientProperties - Unmodifiable Map (5).
 *                    Present if the client specified in the request was identified, contains a map of client properties:
 *                    clientId - The client's URI for the request locale.
 *                    allowedGrantTypes - List of the allowed grant types (org.forgerock.oauth2.core.GrantType) for the client.
 *                    allowedResponseTypes - List of the allowed response types for the client.
 *                    allowedScopes - List of the allowed scopes for the client.
 *                    customProperties - A map of the custom properties of the client.
 *                                       Lists or maps will be included as sub-maps; for example:
 *                                       customMap[Key1]=Value1 will be returned as customMap -> Key1 -> Value1.
 *                                       To add custom properties to a client, update the Custom Properties field
 *                                       in AM Console > Realm Name > Applications > OAuth 2.0 > Clients > Client ID > Advanced.
 * identity - AMIdentity (3).
 *            Always present, the identity of the resource owner.
 * session - SSOToken (4).
 *           Present if the request contains the session cookie, the user's session object.
 * scriptName - String (primitive).
 *              Always present, the display name of the script.
 * logger - Always present, the "OAuth2Provider" debug logger instance:
 *          https://backstage.forgerock.com/docs/am/7/scripting-guide/scripting-api-global-logger.html#scripting-api-global-logger.
 *          Corresponding log files will be prefixed with: scripts.OAUTH2_ACCESS_TOKEN_MODIFICATION.
 * httpClient - HTTP Client (8).
 *              Always present, the HTTP Client instance:
 *              https://backstage.forgerock.com/docs/am/7/scripting-guide/scripting-api-global-http-client.html#scripting-api-global-http-client.
 *
 * Return - no value is expected, changes shall be made to the accessToken parameter directly.
 *
 * Class reference:
 * (1) AccessToken - https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/oauth2/core/AccessToken.html.
 * (3) AMIdentity - https://backstage.forgerock.com/docs/am/7/apidocs/com/sun/identity/idm/AMIdentity.html.
 * (4) SSOToken - https://backstage.forgerock.com/docs/am/7/apidocs/com/iplanet/sso/SSOToken.html.
 * (5) Map - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashMap.html,
 *           or https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/LinkedHashMap.html.
 * (6) Set - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashSet.html.
 * (8) Client - https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/http/Client.html.
 */

/* EXAMPLE
(function () {
    var frJava = JavaImporter(
        org.forgerock.http.protocol.Request,
        org.forgerock.http.protocol.Response
    );

    // Always includes this field in the token.
    accessToken.setField('key1', 'value1');

    // Receives and adds to the access token additional values by performing a REST call to an external service.
    // WARNING: Below, you will find a reference to a third-party site, which is provided only as an example.
    var uri = 'https://jsonplaceholder.typicode.com/posts';

    try {
        var request = new frJava.Request();

        // You can chain methods that return the request object.
        request.setUri(uri)
            .setMethod('POST')
            .setEntity(JSON.stringify({
                updatedFields: {
                    key2: 'value2',
                    key3: 'value3'
                }
            }));

        // You can call a method when chaining is not possible.
        request.getHeaders().add('Content-Type', 'application/json; charset=UTF-8');

        // Sends the request and receives the response.
        var response = httpClient.send(request).getOrThrow();

        // Checks if the response status is as expected.
        if (response.getStatus() === org.forgerock.http.protocol.Status.CREATED) {
            var result = JSON.parse(response.getEntity().getString());

            // Set multiple token fields at once.
            accessToken.setFields(result.updatedFields);
        } else {
            logger.error('Unable to obtain access token modifications. Status: ' + response.getStatus() + '. Content: ' + response.getEntity().getString());
        }
    } catch (e) {
        logger.error('The request processing was interrupted. ' + e);

        // The access token request fails with the HTTP 500 error in this case.
        throw ('Unable to obtain response from: ' + uri);
    }

    // Adds new fields containing identity attribute values to the access token.
    accessToken.setField('mail', identity.getAttribute('mail'));
    accessToken.setField('phone', identity.getAttribute('telephoneNumber').toArray()[0]);

    // Adds new fields containing the session property values.
    // NOTE: session may not be available for non-interactive authorization grants.
    if (session) {
        try {
            accessToken.setField('ipAddress', session.getProperty('Host'));
        } catch (e) {
            logger.error('Unable to retrieve session property value. ' + e);
        }
    }

    // Removes a native field from the token entry, that was set by AM.
    // WARNING: removing native fields from the token may result in loss of functionality.
    // accessToken.removeTokenName()

    // No return value is expected. Let it be undefined.
}());
*/



var fr = JavaImporter(
    com.sun.identity.idm.IdType
);
var bearerToken = getAccessToken()
var groups = [];
identity.getMemberships(fr.IdType.GROUP).toArray().forEach(function (group) {
    groups.push(group.getAttribute("cn").toArray());
});
accessToken.setField("groups", groups);

var internalRole = identity.getAttribute("fr-idm-custom-attrs").toArray()[0];
logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: InternalRole is in :: " + internalRole)

// var internal_role = getUserInternalRoles(internalRole)
// if (internal_role) {
//     accessToken.setField("roleCategoryName", internal_role);
// }
var oidcClientID = clientProperties.clientId
var appName = null
logger.error("oidcClientID is --> " + JSON.stringify(oidcClientID))
var logonAppId = null
var authTime = null 
if(session && session.getProperty("logonAppId") && session.getProperty("authTime")) {
            
logonAppId = session.getProperty("logonAppId")

authTime = session.getProperty("authTime")

}



if(logonAppId !== null && authTime !== null && isLoginPrereqMandatory(logonAppId,authTime)){
   accessToken.setField("roleCategoryName", "KYID-Login-Prerequisite"); 
}
else if (oidcClientID === "kyid-business-support-id" || oidcClientID === "kyid-business-support-id-perf") {
    appName = systemEnv.getProperty("esv.kyid.businessportal.name")
    setRolesinToken(oidcClientID,appName,bearerToken)
}
else if (oidcClientID === "kyid-portal-id" || oidcClientID === "kyid-portal-id-perf") {
    appName = systemEnv.getProperty("esv.kyid.portal.name")
var internal_role = getUserInternalRoles(internalRole)
if (internal_role) {
    accessToken.setField("roleCategoryName", internal_role);
}
}
logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Mail is  :: " + identity.getAttribute("mail").toArray()[0]);
var userInfo = getUserInfoFromUserIdentity(identity.getAttribute("mail").toArray()[0]);
logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Userinfo is  :: " + JSON.stringify(userInfo));
if (userInfo) {
    accessToken.setField("firstname", userInfo.givenName);
    accessToken.setField("lastname", userInfo.sn);
    accessToken.setField("logon", userInfo.logon);
    
}
accessToken.setField("mail", identity.getAttribute("mail").toArray()[0]);
accessToken.setField("usertype", identity.getAttribute("fr-attr-str1").toArray()[0]);
//accessToken.setField("logon", identity.getAttribute("custom_logon").toArray()[0]);

var sessionRefId = null;

// Try to get sessionRefId from session first
if (session) {
    var tokenId = session.getTokenID ? session.getTokenID().toString() : "unknown";
    logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript session exists, tokenId: " + tokenId);

    var existingSessionRefId = session.getProperty("sessionRefId");
    if (existingSessionRefId) {
        sessionRefId = existingSessionRefId;
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript sessionRefId from session: " + sessionRefId);
    } else {
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript session exists but sessionRefId property is missing");
    }
} else {
    logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript session is null or undefined");
}

// If not available in session, generate a new UUID using Java
if (!sessionRefId) {
    try {
        sessionRefId = java.util.UUID.randomUUID().toString();
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript generated new sessionRefId: " + sessionRefId);
    } catch (e) {
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript failed to generate UUID: " + e);
    }
}

// Add sessionRefId to access token only if it exists
if (sessionRefId) {
    accessToken.setField("sessionRefId", sessionRefId);
} else {
    logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript WARNING: sessionRefId is null or empty");
}

function getUserInternalRoles(internalRole) {
    try {
        // var userCustomAttributes = internalRole;
        // var jsonString = userCustomAttributes.toArray()[0];
        var jsonData = JSON.parse(internalRole);
        var kyidAccountType = jsonData.custom_kyidAccountType;
        var logonAppId = null
        var authTime = null
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: custom_kyidAccountType " + jsonData.custom_kyidAccountType);
        if(session && session.getProperty("logonAppId") && session.getProperty("authTime")) {
            
            logonAppId = session.getProperty("logonAppId")
            
            authTime = session.getProperty("authTime")
        }
        // logonAppId = "789c84c0-0e75-4c2b-af6c-32b07e463334"
        // authTime = 1756142447390
        logger.error("logonAppId is --> "+ logonAppId)
        logger.error("authTime is --> "+ authTime)
        if(logonAppId !== null && authTime !== null){
        if(isLoginPrereqMandatory(logonAppId,authTime)){
            return "KYID-Login-Prerequisite";
        }
            
        }

        if (kyidAccountType === "P") {
            return "KYID-Portal-Personal";
        }

        if (kyidAccountType === "C") {
            return "KYID-Portal-Commonwealth";
        }

        if (kyidAccountType === "B") {
            return "KYID-Portal-Business";
        }

        return null;

    } catch (e) {
        message = 'Error in KYID.2B1.Journey.OIDC.AccessTokenModification :: => ' + e;
    }

}

function isLoginPrereqMandatory(logonAppId,authnTime) {
    try {
    var hostUrl = requestProperties.get('requestUri').getHost();
    var clientId = systemEnv.getProperty("esv.kyid.mooperation.clientid");
    var isMandatoryPreReq = false;
   
    var clientSecret = systemEnv.getProperty("esv.kyid.mooperation.secret");

    var scope = "fr:idm:*";
    if (!hostUrl || hostUrl.trim() === "") {
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Tenant FQDN is null. Unable to proceed");
        return null;
    }
    var tokenUrl = "https://" + hostUrl + "/am/oauth2/realms/root/realms/alpha/access_token";
    var requestBody = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=" + scope;
    var tokenRequest = new org.forgerock.http.protocol.Request();
    tokenRequest.setUri(tokenUrl);
    tokenRequest.setMethod("POST");
    tokenRequest.getHeaders().add("Content-Type", "application/x-www-form-urlencoded");
    tokenRequest.setEntity(requestBody);
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Token URL : "+tokenUrl);
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Request Body : "+requestBody);


    var tokenResponse = httpClient.send(tokenRequest).get();
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenResponse : "+tokenResponse);
    var tokenApiResponse = tokenResponse.getEntity().getString();
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenApiResponse : "+tokenApiResponse);
    var jsonObject = JSON.parse(tokenApiResponse)
    var bearerToken = jsonObject.access_token;
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token : "+bearerToken);
     if (bearerToken) {
    var request = new org.forgerock.http.protocol.Request();
     logger.error("User Id is from session --> "+session.getProperty("UserId"))

    var loginPrereqRequestBody = {
        "payload": {
            "userId": session.getProperty("UserId"),
            "logonAppId": logonAppId,
            "authTime": authnTime
        },
        "action": "11"
    };
    request.setUri("https://" + hostUrl + "/openidm/endpoint/loginprerequisite");
    request.setMethod("POST");
    request.getHeaders().add("Content-Type", "application/json");
    request.getHeaders().add("Authorization", "Bearer " + bearerToken);
    request.setEntity(JSON.stringify(loginPrereqRequestBody));

    var response = httpClient.send(request).get();
    var apiResponse = response.getEntity().getString();
       logger.error("Login Prereq apiResponse is --> "+ JSON.stringify(apiResponse))
    
   apiResponse = JSON.parse(apiResponse)

    if (apiResponse && apiResponse.payload && apiResponse.payload.result) {
        isMandatoryPreReq = apiResponse.payload.result.mandatoryPrerequisite;
    }

    logger.error("isMandatoryPreReq is --> "+ isMandatoryPreReq)
    return isMandatoryPreReq
     }
    else{
            return false
    }
        
    } catch (error) {
        logger.error("Execption Occureed in -> isLoginPrereqMandatory "+error)
        return false
        
    }
}

function getUserInfoFromUserIdentity(username) {
    var hostUrl = requestProperties.get('requestUri').getHost();
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: AM Host URL : "+hostUrl);
    var clientId = systemEnv.getProperty("esv.kyid.mooperation.clientid");
    var clientSecret = systemEnv.getProperty("esv.kyid.mooperation.secret");
    var scope = "fr:idm:*";
    if (!hostUrl || hostUrl.trim() === "") {
        logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Tenant FQDN is null. Unable to proceed");
        return null;
    }
    var tokenUrl = "https://" + hostUrl + "/am/oauth2/realms/root/realms/alpha/access_token";
    // logger.error("##### requestUrl is in " + requestUrl);
    var requestBody = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=" + scope;
    var tokenRequest = new org.forgerock.http.protocol.Request();
    tokenRequest.setUri(tokenUrl);
    tokenRequest.setMethod("POST");
    tokenRequest.getHeaders().add("Content-Type", "application/x-www-form-urlencoded");
    tokenRequest.setEntity(requestBody);
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Token URL : "+tokenUrl);
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Request Body : "+requestBody);


    var tokenResponse = httpClient.send(tokenRequest).get();
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenResponse : "+tokenResponse);
    var tokenApiResponse = tokenResponse.getEntity().getString();
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenApiResponse : "+tokenApiResponse);
    var jsonObject = JSON.parse(tokenApiResponse)
    var bearerToken = jsonObject.access_token;
    logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token : "+bearerToken);
    //var bearerToken = "";
    if (bearerToken) {
        var request = new org.forgerock.http.protocol.Request();
        request.setUri("https://" + hostUrl + "/openidm/managed/alpha_user?_queryFilter=mail+eq+'" + encodeURIComponent(username) + "'&_fields=userName,custom_logon,custom_userIdentity/sn,custom_userIdentity/givenName");
        request.setMethod("GET");
        request.getHeaders().add("Authorization", "Bearer " + bearerToken);
        var response = httpClient.send(request).get();
        var apiResponse = response.getEntity().getString();
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: API Response : "+apiResponse);
        var userAttributeJson = JSON.parse(apiResponse)
        if (userAttributeJson && userAttributeJson.result[0] && userAttributeJson.result[0].custom_userIdentity) {
            return { givenName: userAttributeJson.result[0].custom_userIdentity.givenName, sn: userAttributeJson.result[0].custom_userIdentity.sn, logon:userAttributeJson.result[0].custom_logon };
        } else {
            return null;
        }
    }
}


    function getApplicationRoles(appName, bearerToken) {
    try {
    if (bearerToken) {
        var hostUrl = requestProperties.get('requestUri').getHost();
        if (!hostUrl || hostUrl.trim() === "") {
            logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Tenant FQDN is null. Unable to proceed");
            return null;
        }
        var request = new org.forgerock.http.protocol.Request();
        request.setUri("https://" + hostUrl + "/openidm/managed/alpha_kyid_businessapplication?_queryFilter=name+eq+'" + encodeURIComponent(appName) + "'&_fields=roleAppId/*");
        request.setMethod("GET");
        request.getHeaders().add("Authorization", "Bearer " + bearerToken);
        var response = httpClient.send(request).get();
        var apiResponse = response.getEntity().getString();
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Application API Response : " + apiResponse);
        var appResponse = JSON.parse(apiResponse)
        if (appResponse && appResponse.result[0] && appResponse.result[0].roleAppId) {
            return appResponse.result[0].roleAppId
        } else {
            return [];
        }
    }
        
    } catch (error) {
         logger.error("Error Occurred in getApplicationRoles Function " +error)
    }
    // var hostUrl = requestProperties.get('requestUri').getHost();
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: AM Host URL : "+hostUrl);
    // var clientId = systemEnv.getProperty("esv.kyid.mooperation.clientid");
    // var clientSecret = systemEnv.getProperty("esv.kyid.mooperation.secret");
    // var scope = "fr:idm:*";
    // if (!hostUrl || hostUrl.trim() === "") {
    //     logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Tenant FQDN is null. Unable to proceed");
    //     return null;
    // }
    // var tokenUrl = "https://" + hostUrl + "/am/oauth2/realms/root/realms/alpha/access_token";
    // // logger.error("##### requestUrl is in " + requestUrl);
    // var requestBody = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=" + scope;
    // var tokenRequest = new org.forgerock.http.protocol.Request();
    // tokenRequest.setUri(tokenUrl);
    // tokenRequest.setMethod("POST");
    // tokenRequest.getHeaders().add("Content-Type", "application/x-www-form-urlencoded");
    // tokenRequest.setEntity(requestBody);
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Token URL : "+tokenUrl);
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Request Body : "+requestBody);


    // var tokenResponse = httpClient.send(tokenRequest).get();
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenResponse : "+tokenResponse);
    // var tokenApiResponse = tokenResponse.getEntity().getString();
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenApiResponse : "+tokenApiResponse);
    // var jsonObject = JSON.parse(tokenApiResponse)
    // var bearerToken = jsonObject.access_token;
    // logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token : "+bearerToken);
    //var bearerToken = "";

}

function setRolesinToken(oidcClientID,appName,bearerToken) {
    try {

        var userRoles = [];
        var userEffectiveRoles = identity.getAttribute("fr-idm-effectiveRole")
        userEffectiveRoles = JSON.parse(userEffectiveRoles)

        if (!Array.isArray(userEffectiveRoles)) {
            logger.error("Inside userEffectiveRoles If Not Array ")
            userEffectiveRoles = [];
        }

        userEffectiveRoles.forEach(userRoleVal => {
            logger.error("Executing For loop ")
            userRoles.push(userRoleVal._refResourceId);
        });

        
        var businessApplicationRoles = []
        if(appName && bearerToken){
            businessApplicationRoles = getApplicationRoles(appName,bearerToken)
            logger.error("businessApplicationRoles are  "+businessApplicationRoles)
        }
        var appRoles = []
        if (businessApplicationRoles && businessApplicationRoles.length > 0) {

            businessApplicationRoles.forEach(appRole => {
                appRoles.push(appRole._refResourceId)
            })
        }
        var roles = []
        var commonRoles = []
        commonRoles = appRoles.filter(item => userRoles.includes(item))
        logger.error("commonRoles are  "+commonRoles)

        if (commonRoles && commonRoles.length > 0) {

            commonRoles.forEach(roleId => {

                businessApplicationRoles.forEach(val => {

                    if (roleId === val._refResourceId) {
                        if (val.name) {
                            roles.push(val.name)
                        }

                    }
                })
            })
        }
        // roles.push("KYID-Self-Service-Personal")
        //accessToken.setField("roles", roles);
        logger.error("roles are  "+commonRoles)
        if(roles.length>0){
          accessToken.setField("roleCategoryName", roles[0]);  
          accessToken.setField("roles", roles);    
        }
        else{
            accessToken.setField("roleCategoryName",""); 
            accessToken.setField("roles", []);
        }
        
        logger.error("Adding Roles to the ACcess Toeken --> " + roles)

    } catch (error) {
        logger.error("Error Occurred While Setting the Role in Access Token" + error)
    }

}

function getAccessToken() {
    try {
        var hostUrl = requestProperties.get('requestUri').getHost();
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: AM Host URL : " + hostUrl);
        var clientId = systemEnv.getProperty("esv.kyid.mooperation.clientid");
        var clientSecret = systemEnv.getProperty("esv.kyid.mooperation.secret");
        var scope = "fr:idm:*";
        if (!hostUrl || hostUrl.trim() === "") {
            logger.error("KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Tenant FQDN is null. Unable to proceed");
            return null;
        }
        var tokenUrl = "https://" + hostUrl + "/am/oauth2/realms/root/realms/alpha/access_token";
        // logger.error("##### requestUrl is in " + requestUrl);
        var requestBody = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=" + scope;
        var tokenRequest = new org.forgerock.http.protocol.Request();
        tokenRequest.setUri(tokenUrl);
        tokenRequest.setMethod("POST");
        tokenRequest.getHeaders().add("Content-Type", "application/x-www-form-urlencoded");
        tokenRequest.setEntity(requestBody);
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Token URL : " + tokenUrl);
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Request Body : " + requestBody);


        var tokenResponse = httpClient.send(tokenRequest).get();
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenResponse : " + tokenResponse);
        var tokenApiResponse = tokenResponse.getEntity().getString();
        logger.error("##### KYID.2B1.Journey.OAuth2.AccessTokenModificationScript :: Bearer Token tokenApiResponse : " + tokenApiResponse);
        var jsonObject = JSON.parse(tokenApiResponse)
        var bearerToken = jsonObject.access_token;
        if (bearerToken) {
            return bearerToken
        }

    } catch (error) {
        logger.error("Error Occurred While getting bearerToken Token" +error)
    }
}


