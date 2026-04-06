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
    //var authnRequestExtensions=authnRequest.getExtensions().toXMLString();
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var issuer = "";
    var finalUrl = null;
    if (authnRequest) {
        logger.error("************AUTHN REQUEST PRESENT IN PREAUTHN*************");
        var getIssuerTime = new Date().toISOString();
        var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
        response.addHeader("Set-Cookie", "getIssuerTime=" + getIssuerTime + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
        logger.error("************REQUEST PRESENT IN PREAUTH *************" + request);
        issuer = authnRequest.getIssuer().getValue().toString();
    }
    if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0 && !session) {
        finalUrl = systemEnv.getProperty("esv.logout.app.url")+"loggedout/";
        response.sendRedirect(finalUrl);
        return true;
    } else if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        displayUrl = issuer;
    }
    else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
		
        //wsfed application coming from on-prem app
        var authnRequestExtensionList=authnRequest.getExtensions().getAny();
        //logger.error("SAML PreAuthentication AUTHNREQUEST-EXTLIST: "+authnRequestExtensionList);
        var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
        displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        //logger.error("Set displayUrl in a ReturnURL cookie: " + displayUrl);
        
        if(authnRequestExtensionList.size()>1) {
            var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
            wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
        } else {
            wtrealmUrl=displayUrl;
        }
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Path=/; HttpOnly");
        //logger.error("Set wtrealmUrl in a rp-realm cookie: " + wtrealmUrl);
        //logger.error("WSFed PreAuthentication DISPLAY URL: "+displayUrl);
        isWsfedApp=true;
    } else if(issuer.localeCompare("kyidsp") == 0 ) {
            displayUrl=systemEnv.getProperty("esv.default.app.url");
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
            response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    } else if(relayState !== null && relayState.startsWith("https")) {
        //SAML Application with a full proper relayState URL
        displayUrl = relayState;
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        //logger.error("Set displayUrl in a ReturnURL cookie: " + displayUrl);
    } else if(issuer.startsWith("https")) {
        //SAML Application with a relayState URI only 
        displayUrl = authnRequest.getIssuer().getValue() + relayState;
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        //logger.error("Set displayUrl in a ReturnURL cookie: " + displayUrl);
    }

    var scheme = request.getScheme();
    var host = request.getServerName();
    var port = request.getServerPort();
    var login = "kyid_loginMain";
    var reqID = authnRequest.getID();
  	var rawCookie = null;
    var cookieName = null;
    var lang = "en";
        if(request.getHeader("Cookie") && request.getHeader("Cookie")!=null){
    	rawCookie = request.getHeader("Cookie");
        //logger.error("Cookies present in Request Header are: "+rawCookie);
        var rawCookieParams = rawCookie.split(";");
        for(i=0;i<rawCookieParams.length;i++){
          cookieName= rawCookieParams[i].split("=");
          var cookie = String(cookieName[0]).replace(/\s+/g,' ').trim();
          if(cookie.localeCompare("UserLanguagePreference")==0){
              //logger.error("locale cookie found & it's value is: "+cookieName[1]);
              if(cookieName[1].startsWith("en")){
                lang = "en"
              } else if(cookieName[1].startsWith("es")){
                lang = "es"
              } else {
                lang = "en"
              }           
           } 
        }
     }
     var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
     response.addHeader("Set-Cookie", "locale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
     response.addHeader("Set-Cookie", "clocale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
     logger.error("Set language value in a locale cookie: " + lang);
  
    var goto = scheme + "://" + host + ":" + port + "/am/saml2/continue/metaAlias" + realm + "/kyidp?" + "secondVisitUrl=/am/SSOPOST/metaAlias/alpha/kyidp?ReqID%3D" + reqID;

    /* if (isWsfedApp) {
        finalUrl = scheme + "://" + host + "/am/UI/Login?"+
            "realm=/alpha" +
            "&spEntityID=" + issuer +
            "&goto=" + encodeURIComponent(goto)
            + "&ReturnURL=" + displayUrl + "&rp-realm=" + wtrealmUrl;
    } else {
        finalUrl = scheme + "://" + host + "/am/UI/Login?"+
            "realm=/alpha" +
            "&spEntityID=" + issuer +
            "&goto=" + encodeURIComponent(goto);
    }
    finalUrl=finalUrl+"&clocale="+lang+"&locale="+lang+"&ForceAuth=true"+"&AMAuthCookie=";
    logger.error("Final URL is::::::"+finalUrl);
   try {
        if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) !== 0 && finalUrl) {
            logger.error("Final URL is::::::"+finalUrl);
            response.sendRedirect(finalUrl);
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        logger.error("******************************************preAuthentication ERROR*********************************");
        return false;
    }
    */
    logger.error("******************************************NORMAL LOGIN AND ASSERTION GENERATION*********************************");

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
    logger.error("************INSIDE PRESEND RESPONSE FUNCTION*************");
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;

    var issuer = null;
    if (authnRequest) {
        logger.error("************AUTHN REQUEST PRESENT*************" );
        issuer = authnRequest.getIssuer().getValue().toString();
    }else {
        logger.error("************NO AUTHN REQUEST*************");
        response.sendRedirect(systemEnv.getProperty("esv.default.app.url"));
        return true;
    }
    if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        displayUrl = issuer;
    } 
    else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
        //wsfed application coming from on-prem app
        var authnRequestExtensionList=authnRequest.getExtensions().getAny();
        //logger.error("SAML preSendResponse AUTHNREQUEST-EXTLIST: "+authnRequestExtensionList);
        var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
        displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
         if(authnRequestExtensionList.size()>1) {
            var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
            wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
        } else {
            wtrealmUrl=displayUrl;
        }
        //logger.error("SAML preSendResponse DISPLAY URL: "+displayUrl);
        isWsfedApp=true;
    } else if(relayState!=null && relayState.startsWith("https")) {
        //SAML Application with a full proper relayState URL
        displayUrl = relayState;
    } else if(issuer.startsWith("https")) {
        //SAML Application with a relayState URI only 
        displayUrl = authnRequest.getIssuer().getValue() + relayState;
    }
    var url = request.getScheme() + "://" + request.getServerName()
        + request.getRequestURI() + "?" + request.getQueryString();
    //logger.error("**************KY POC SAML IDP Adapter preSendResponse*************   " + url);

    var scheme = request.getScheme();
    //logger.error("############### Entering preSendResponse ############### scheme " + host);
    var host = request.getServerName();
    //logger.error("############### Entering preSendResponse ############### host " + host);
    var port = request.getServerPort();
    var issuer = authnRequest.getIssuer().getValue();
    //logger.error("############### Entering preSendResponse ############### issuer " + issuer);
    //logger.error("############### Entering preAuthentication ############### entitlement "+entitlement.getAttributes());
    //var login = entitlement.getAttributes().get(issuer).iterator().next();
    var login = "kyid_loginMain";
    //logger.error("############### Entering preSendResponse ############### login " + login);
    var reqID = authnRequest.getID();
    //logger.error("############### Entering preSendResponse ############### reqID " + reqID);
    // In the goto URL hostedEntityID must be lowercase, even if you declard it as Upper case
    var goto = scheme + "://" + host + ":" + port + "/am/saml2/continue/metaAlias" + realm + "/kyidp?" + "secondVisitUrl=/am/SSOPOST/metaAlias/alpha/kyidp?ReqID%3D" + reqID;
    //logger.error("*********************preSendResponse Goto******************** " + goto);
    var finalUrl = "";
    if (isWsfedApp && displayUrl && wtrealmUrl) {
        finalUrl = scheme + "://" + host + "/am/UI/Login?service=" + login +
            "&realm=/alpha" +
            "&spEntityID=" + issuer +
            "&goto=" + encodeURIComponent(goto) +
            "&ReturnURL=" + displayUrl + "&rp-realm=" + wtrealmUrl + "&ForceAuth=true"
            "&AMAuthCookie=";
    } else {
      finalUrl = scheme + "://" + host + "/am/UI/Login?service=" + login +
            "&realm=/alpha" +
            "&spEntityID=" + issuer +
            "&goto=" + encodeURIComponent(goto) +
            "&ForceAuth=true"+
            "&AMAuthCookie=";
    } 
   

    //logger.error("**************KY POC SAML IDP Adapter preSendResponse*************   " + finalUrl);

    try {
        //logger.error("************************Before Session Validation & Re-Direction to forceAuth*****" + session.getProperty("visitedUrl"));

        if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
            return false;
        }
        else if (session.getProperty("visitedUrl").localeCompare("FALSE") == 0) {

            //logger.error("******************************************Redirecting to force auth****************************" + session.getProperty("visitedUrl"));
            //logger.error("******************************************Redirecting to force auth****************************" + finalUrl);
            logger.error("SAML Final Redirect URL2 : "+finalUrl);
            //response.sendRedirect(finalUrl);
            return false;
        }
        else if (session && session.getProperty("needKogSuccess") && session.getProperty("needKogSuccess").startsWith(systemEnv.getProperty("esv.kyid.kog.redirect.url"))) {
            finalUrl = session.getProperty("needKogSuccess");
            logger.error("*********finalUrl: "+finalUrl)
            session.setProperty("needKogSuccess", "FALSE");
            response.sendRedirect(finalUrl);
            return true;
        } 
        else if (session && session.getProperty("authTimeoutRedirect") && session.getProperty("authTimeoutRedirect").startsWith("true")) {
            var defaultUrl=systemEnv.getProperty("esv.default.app.url");
            logger.error("*********defaultUrl: "+defaultUrl)
            session.setProperty("authTimeoutRedirect", "false");
            response.sendRedirect(defaultUrl);
            return true;
        }
    } catch (e) {
        logger.error("An unexpectd error occurred while processing claims in preSendResponse: "+e);
        return false;
    }
    //logger.error("******************************************NORMAL LOGIN AND ASSERTION GENERATION*********************************");
    session.setProperty("visitedUrl", "FALSE");
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