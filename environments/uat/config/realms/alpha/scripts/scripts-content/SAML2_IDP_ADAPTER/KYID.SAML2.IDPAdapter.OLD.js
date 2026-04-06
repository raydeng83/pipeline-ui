/*
 * Copyright 2021-2023 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
 
/*
 * The script has these top level functions that could be executed during a SAML2 flow.
 *      - preSingleSignOn
 *      - preAuthentication
 *      - preSendResponse
 *      - preSignResponse
 *      - preSendFailureResponse
 *
 * Please see the javadoc for the interface definition and more information about these methods.
 * https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/sun/identity/saml2/plugins/SAML2IdentityProviderAdapter.html
 * Note that the initialize method is not supported in the scripts.
 *
 * Defined variables. Check the documentation on the respective functions for the variables available to it.
 *
 * hostedEntityId - String
 *     Entity ID for the hosted IDP
 * realm - String
 *     Realm of the hosted IDP
 * idpAdapterScriptHelper - IdpAdapterScriptHelper (1)
 *     An instance of IdpAdapterScriptHelper containing helper methods. See Javadoc for more details.
 * request - HttpServletRequest (2)
 *     Servlet request object
 * response - HttpServletResponse (3)
 *     Servlet response object
 * authnRequest - AuthnRequest (4)
 *     The original authentication request sent from SP
 * reqId - String
 *     The id to use for continuation of processing if the adapter redirects
 * res - Response (5)
 *     The SAML Response
 * session - SSOToken (6)
 *     The single sign-on session. The reference type of this is Object and would need to be casted to SSOToken.
 * relayState - String
 *     The relayState that will be used in the redirect
 * faultCode - String
 *     the fault code that will be returned in the SAML response
 * faultDetail - String
 *     the fault detail that will be returned in the SAML response
 * logger - Logger instance
 *     https://backstage.forgerock.com/docs/am/7.3/scripting-guide/scripting-api-global-logger.html.
 *     Corresponding log files will be prefixed with: scripts.<script name>
 *
 * Throws SAML2Exception (7):
 *     for any exceptions occurring in the adapter. The federation process will continue
 *
 * Class reference:
 * (1) idpAdapterScriptHelper - https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/sun/identity/saml2/plugins/scripted/IdpAdapterScriptHelper.html.
 * (2) HttpServletRequest - https://tomcat.apache.org/tomcat-7.0-doc/servletapi/javax/servlet/http/HttpServletRequest.html.
 * (3) HttpServletResponse - https://tomcat.apache.org/tomcat-7.0-doc/servletapi/javax/servlet/http/HttpServletResponse.html.
 * (4) AuthnRequest - https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/sun/identity/saml2/protocol/AuthnRequest.html.
 * (5) Response - https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/sun/identity/saml2/protocol/Response.html.
 * (6) SSOToken - https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/iplanet/sso/SSOToken.html.
 * (7) SAML2Exception - https://backstage.forgerock.com/docs/am/7.3/_attachments/apidocs/com/sun/identity/saml2/common/SAML2Exception.html.
 */
 
/*
 * Template/default script for SAML2 IDP Adapter scripted plugin.
 */
 
/*
 * Available variables for preSingleSignOn:
 *     hostedEntityId
 *     realm
 *     idpAdapterScriptHelper
 *     request
 *     authnRequest
 *     response
 *     reqId
 *     logger
 *
 * Return - true if browser redirection is happening after processing, false otherwise. Default to false.
 */
function preSingleSignOn() {
     return false;
}
 
/*
 * Available variables for preAuthentication:
 *     hostedEntityId
 *     realm
 *     idpAdapterScriptHelper
 *     request
 *     authnRequest
 *     response
 *     reqId
 *     session
 *     relayState
 *     logger
 *
 * Return - true if browser redirection is happening after processing, false otherwise. Default to false.
 */
function preAuthentication() {
 
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    logger.error("************INSIDE preSingleSignOn FUNCTION*************");
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var issuer = "";
    var finalUrl = null;
    if (authnRequest) {
    	issuer = authnRequest.getIssuer().getValue().toString();
    }
    if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0 && !session) {
        finalUrl = systemEnv.getProperty("esv.logout.app.url") + "loggedout/";
        response.sendRedirect(finalUrl);
        return true;
    } else if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        displayUrl = issuer;
    }
    else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
 
        //wsfed application coming from on-prem app
        var authnRequestExtensionList = authnRequest.getExtensions().getAny();
        var rawDisplayUrl = authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
        displayUrl = rawDisplayUrl.substring(1, rawDisplayUrl.length() - 2);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        if (authnRequestExtensionList.size() > 1) {
            var rawWtRealmUrl = authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
            wtrealmUrl = rawWtRealmUrl.substring(1, rawWtRealmUrl.length() - 2);
        } else {
            wtrealmUrl = displayUrl;
        }
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Path=/; HttpOnly");
        isWsfedApp = true;
    } else if (issuer.localeCompare("kyidsp") == 0) {
        displayUrl = systemEnv.getProperty("esv.default.app.url");
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    } else if (relayState !== null && relayState.startsWith("https")) {
        //SAML Application with a full proper relayState URL
        displayUrl = relayState;
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    } else if (issuer.startsWith("https")) {
        //SAML Application with a relayState URI only
        displayUrl = authnRequest.getIssuer().getValue() + relayState;
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    }
 
    var scheme = request.getScheme();
    var host = request.getServerName();
    var port = request.getServerPort();
    var login = "kyid_loginMain";
    var reqID = authnRequest.getID();
    var rawCookie = null;
    var cookieName = null;
    var lang = "en";
    if (request.getHeader("Cookie") && request.getHeader("Cookie") != null) {
        rawCookie = request.getHeader("Cookie");
        var rawCookieParams = rawCookie.split(";");
        for (i = 0; i < rawCookieParams.length; i++) {
            cookieName = rawCookieParams[i].split("=");
            var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();
            if (cookie.localeCompare("UserLanguagePreference") == 0) {
                if (cookieName[1].startsWith("en")) {
                    lang = "en"
                } else if (cookieName[1].startsWith("es")) {
                    lang = "es"
                } else {
                    lang = "en"
                }
            }
        }
    }
    var tenantCookieDomain = systemEnv.getProperty("esv.kyid.cookie.domain");
    response.addHeader("Set-Cookie", "locale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain=" + tenantCookieDomain);
    response.addHeader("Set-Cookie", "clocale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain=" + tenantCookieDomain);
    logger.error("Set language value in a locale cookie: " + lang);
 
    var goto = scheme + "://" + host + ":" + port + "/am/saml2/continue/metaAlias" + realm + "/kyidp?" + "secondVisitUrl=/am/SSOPOST/metaAlias/alpha/kyidp?ReqID%3D" + reqID;
    finalUrl = scheme + "://" + host + "/am/UI/Login?" +
        "realm=/alpha" +
        "&spEntityID=" + issuer +
        "&goto=" + encodeURIComponent(goto);
    finalUrl = finalUrl + "&clocale=" + lang + "&locale=" + lang + "&ForceAuth=true" + "&AMAuthCookie=";
    logger.error("Final URL is::::::" + finalUrl);
    if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) !== 0 && finalUrl) {
        logger.error("Final URL is::::::" + finalUrl);
        if(session != null && session.getProperty("visitedUrl").localeCompare("FALSE") == 0) {
           logger.error("Final url set in session:"+finalUrl );
            session.setProperty("redirectUrl", finalUrl);
            response.addHeader("Set-Cookie", "redirectUrl=" + "unset" + "; Path=/; HttpOnly; sameSite=Lax; domain=" + tenantCookieDomain);
        } else {
            response.addHeader("Set-Cookie", "redirectUrl=" + finalUrl + "; Path=/; HttpOnly; sameSite=Lax; domain=" + tenantCookieDomain);
        }
       
    }
    return false;
}
 
/*
 * Available variables for preSendResponse:
 *     hostedEntityId
 *     realm
 *     idpAdapterScriptHelper
 *     request
 *     authnRequest
 *     response
 *     reqId
 *     session
 *     relayState
 *     logger
 *
 * Return - true if browser redirection happened after processing, false otherwise. Default to false.
 */
function preSendResponse() {
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    logger.error("************INSIDE PRESEND RESPONSE FUNCTION*************");
    var finalUrl=null;
    var issuer = "";
    if (authnRequest) {
    	issuer = authnRequest.getIssuer().getValue().toString();
    }
    if(session != null && session.getProperty("redirectUrl") != null) {
        logger.error("SAML Final Redirect URL: "+session.getProperty("redirectUrl"))
        finalUrl=session.getProperty("redirectUrl");
        logger.error("visitedUrl value: "+session.getProperty("visitedUrl"))
    } else {
		var scheme = request.getScheme();
		var host = request.getServerName();
		var port = request.getServerPort();
		var login = "kyid_loginMain";
		var reqID = authnRequest.getID();
		var goto = scheme + "://" + host + ":" + port + "/am/saml2/continue/metaAlias" + realm + "/kyidp?" + "secondVisitUrl=/am/SSOPOST/metaAlias/alpha/kyidp?ReqID%3D" + reqID;
		finalUrl = scheme + "://" + host + "/am/UI/Login?" +
			"realm=" + realm +
			"&spEntityID=" + issuer +
			"&goto=" + encodeURIComponent(goto);
	}
	
	
 
    try {
        if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
            return false;
        }
        else if (session.getProperty("visitedUrl").localeCompare("FALSE") == 0) {
            logger.error("SAML Final Redirect URL2 : " + finalUrl);
            response.sendRedirect(finalUrl);
            return true;
        }
        else if (session && session.getProperty("needKogSuccess") && session.getProperty("needKogSuccess").startsWith(systemEnv.getProperty("esv.kyid.kog.redirect.url"))) {
            finalUrl = session.getProperty("needKogSuccess");
            logger.error("*********finalUrl: " + finalUrl)
            session.setProperty("needKogSuccess", "FALSE");
            response.sendRedirect(finalUrl);
            return true;
        }
    } catch (e) {
        logger.error("An unexpected error occurred while processing claims in preSendResponse: " + e);
        return false;
    }
    session.setProperty("visitedUrl", "FALSE");
    var tenantCookieDomain = systemEnv.getProperty("esv.kyid.cookie.domain");
    response.addHeader("Set-Cookie", "redirectUrl=" + "unset" + "; Path=/; HttpOnly; sameSite=Lax; domain=" + tenantCookieDomain);
    return false;
 
}
 
/*
 * Available variables for preSignResponse:
 *     hostedEntityId
 *     realm
 *     idpAdapterScriptHelper
 *     request
 *     authnRequest
 *     session
 *     relayState
 *     res
 *     logger
 */
function preSignResponse() {
}
 
/*
 * Available variables for preSendFailureResponse:
 *     hostedEntityId
 *     realm
 *     idpAdapterScriptHelper
 *     request
 *     response
 *     faultCode
 *     faultDetail
 *     logger
 */
function preSendFailureResponse() {
}