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

//Global Logger PREFIX
var adapterLoggerPrefix = "KYID_SAML2IDP_ADAPTER_LOG";

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
   
   logger.debug(adapterLoggerPrefix+"::"+"ENTERING PREAuthentication FUNCTION"+"::"+reqId);
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var issuer = "";
    var finalUrl = null;
    var returnUrlCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
  // var returnUrlCookieDomain=".sso.dev2.kyid.ky.gov";
   //var returnUrlCookieDomain=".dev2.kyid.ky.gov";
    
    
    if(authnRequest) {
        logger.debug(adapterLoggerPrefix+"::"+"AUTHN REQUEST PRESENT IN PREAuthentication");
        // issuer = authnRequest.getIssuer().getValue().toString();
        issuer = authnRequest.getIssuer().getValue();
        logger.debug("Issuer Value without String" + authnRequest.getIssuer().getValue())
        logger.debug("Type Of" + typeof(authnRequest.getIssuer().getValue()))
        logger.debug(adapterLoggerPrefix+"::"+"ISSUER PRESENT IN PREAuthentication"+"::"+issuer);

        var getIssuerTime = new Date().toISOString();       
        var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
        //var tenantCookieDomain=".sso.dev2.kyid.ky.gov
        //var tenantCookieDomain=".dev2.kyid.ky.gov"
        response.addHeader("Set-Cookie", "getIssuerTime=" + getIssuerTime + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
        logger.debug("get issuer time Mani :::"+getIssuerTime);
    }
    
    if(issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0 && !session) {
        finalUrl = systemEnv.getProperty("esv.logout.app.url")+"loggedout/";
        logger.debug(adapterLoggerPrefix+"::"+"finalUrl PRESENT IN PREAuthentication"+"::"+finalUrl);
        response.sendRedirect(finalUrl);
        return true;
    
    } else if(issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        displayUrl = issuer;
       logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
    
    } else if(issuer.startsWith("kyidsp") && authnRequest.getExtensions()) {	
        //wsfed application coming from on-prem app
        var authnRequestExtensionList=authnRequest.getExtensions().getAny();
        var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
        displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
        logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication one"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        logger.debug("URL Constructed ::"+decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        
        if(authnRequestExtensionList.size()>1) {
            var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
            wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
        } else {
            wtrealmUrl=displayUrl;
        }
        logger.debug(adapterLoggerPrefix+"::"+"wtrealmUrl PRESENT IN PREAuthentication"+"::"+wtrealmUrl);
       // response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly" );
        response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        isWsfedApp=true;
      
    } else if(issuer.startsWith("kyidsp")) {
        displayUrl=systemEnv.getProperty("esv.default.app.url");
		logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
    
    } else if(relayState !== null && relayState.startsWith("https")) {
        //SAML Application with a full proper relayState URL
        displayUrl = relayState;
        logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
       // response.addHeader("Set-Cookie", "rp-realm=" + "; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + "; Domain="+returnUrlCookieDomain+ "; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
    
    } else if (relayState !== null){
        //SAML Application with a relayState URI only 
      	if(relayState.includes("dest=")){                                                      /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
        	displayUrl = authnRequest.getIssuer().getValue() + relayState.substring(5);       /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
        } else {                                                                             /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
        	//displayUrl = authnRequest.getIssuer().getValue() + relayState;                  /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
            displayUrl = authnRequest.getIssuer().getValue();								/**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
        }                                                                                  
        logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");

        } else {
        displayUrl = authnRequest.getIssuer().getValue();
        logger.debug(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", "rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + decodeURIComponent(displayUrl) + "; Domain="+returnUrlCookieDomain+"; Path=/; HttpOnly");
        response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
    }
    
    //TFS 182954 - For accept language header change on 4-feb-2025
    //var lang = readLangFromRequestHeader(request);
    //var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
    //Commenting the below two lines for accept language header fix on 4-Feb-2025
    // response.addHeader("Set-Cookie", "locale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
    // response.addHeader("Set-Cookie", "clocale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
    //logger.error(adapterLoggerPrefix+"::"+"Language value in a locale cookie IN PREAuthentication"+"::"+lang);
	
  	logger.debug(adapterLoggerPrefix+"::"+"EXITING PREAuthentication");	
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
    logger.debug(adapterLoggerPrefix+"::"+"ENTERING PRESEND RESPONSE FUNCTION"+"::"+reqId);
    var issuer = null;
    var finalUrl = null;
    var returnUrlCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
  
    if(authnRequest) {
        logger.debug(adapterLoggerPrefix+"::"+"AUTHN REQUEST PRESENT IN PRESEND RESPONSE");
        // issuer = authnRequest.getIssuer().getValue().toString();
        issuer = authnRequest.getIssuer().getValue();
        logger.debug("Issure Value without String" + authnRequest.getIssuer().getValue())
        logger.debug("Type Of" + typeof(authnRequest.getIssuer().getValue()))
        logger.debug(adapterLoggerPrefix+"::"+"ISSUER IN PRESEND RESPONSE FUNCTION"+"::"+issuer);
      
      	if(issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
          logger.debug(adapterLoggerPrefix+"::"+"issuerURL PRESENT IN preSendResponse"+"::"+issuer);
          response.addHeader("Set-Cookie", "ReturnURL=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
          response.addHeader("Set-Cookie", "rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
    	}
    } else {
        logger.debug(adapterLoggerPrefix+"::"+"NO AUTHN REQUEST IN PRESEND RESPONSE");
        //response.sendRedirect(systemEnv.getProperty("esv.default.app.url"));
        return false;
    }
  
    try {
        if (session && session.getProperty("needKogSuccess") && session.getProperty("needKogSuccess").startsWith(systemEnv.getProperty("esv.kyid.kog.redirect.url"))) {
            finalUrl = session.getProperty("needKogSuccess");
            logger.debug(adapterLoggerPrefix+"::"+"finalUrl for needKOGVisit PRESENT IN PRESEND RESPONSE"+"::"+finalUrl);
            session.setProperty("needKogSuccess", "FALSE");
            response.sendRedirect(finalUrl);
            return true;
        } 
    } catch (e) {
        logger.error(adapterLoggerPrefix+"::"+"An unexpected error occurred while processing claims in preSendResponse"+"::"+e);
        return false;
    }
    session.setProperty("visitedUrl", "FALSE");
    response.addHeader("Set-Cookie", reqId+"-"+"ReturnURL=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
    response.addHeader("Set-Cookie", reqId+"-"+"rp-realm=" + "; Domain="+returnUrlCookieDomain+"; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly");
  	logger.debug(adapterLoggerPrefix+"::"+"EXITING PRESEND RESPONSE");  
    return false;

}

//TFS 182954 - For accept language header change on 4-feb-2025
function readLangFromRequestHeader(request){
    var lang = "en";
    logger.debug(adapterLoggerPrefix+"::"+"accept-language in header is"+"::"+request.getHeader("accept-language"));
    if(request.getHeader("accept-language")){
        var acceptLanguageValue = request.getHeader("accept-language");
        if (acceptLanguageValue.includes("es") ){
            var lang = "es"
        }
        else{
            var lang = "en"
        }
    } else {
        var lang = "en" 
    }   
   return lang;
}

// function readLangFromSessionCookie(request){
// 	var rawCookie = null;
//     var cookieName = null;
//     var lang = "en";
//     if(request.getHeader("Cookie") && request.getHeader("Cookie")!=null){
//     	rawCookie = request.getHeader("Cookie");
//         //logger.error("Cookies present in Request Header are: "+rawCookie);
//         var rawCookieParams = rawCookie.split(";");
//         for(i=0;i<rawCookieParams.length;i++){
//           cookieName= rawCookieParams[i].split("=");
//           var cookie = String(cookieName[0]).replace(/\s+/g,' ').trim();
//           if(cookie.localeCompare("UserLanguagePreference")==0){
//               //logger.error("locale cookie found & it's value is: "+cookieName[1]);
//               if(cookieName[1].startsWith("en")){
//                 lang = "en"
//               } else if(cookieName[1].startsWith("es")){
//                 lang = "es"
//               } else {
//                 lang = "en"
//               }           
//            } 
//         }
//      }
//    return lang;
// }


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
   logger.debug(adapterLoggerPrefix+"::ENTERING preSignResponse FUNCTION");
  
   var MFA_URI = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract";
   var UNSPECIFIED_URI = "urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified";  
   var PWD_URI = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport";

   if(systemEnv.getProperty("esv.mobiletwofactorcontract.authcontext.uri")){
       MFA_URI = systemEnv.getProperty("esv.mobiletwofactorcontract.authcontext.uri")
   }
 
   if(systemEnv.getProperty("esv.unspecified.authcontext.uri")){
       UNSPECIFIED_URI = systemEnv.getProperty("esv.unspecified.authcontext.uri")
   }
 
   if(systemEnv.getProperty("esv.passwordprotectedtransport.authcontext.uri")){
       PWD_URI = systemEnv.getProperty("esv.passwordprotectedtransport.authcontext.uri")
   }  

   if(session.getProperty("evaluateSSOAuthContext")=="true"){  
   
   /*var mfaCompleted = false;
   try {
    if(session.getProperty("sessionAssuranceLevelforMFA")=="3" || 
   session.getProperty("sessionAssuranceLevelforMFA")=="4" ||
   session.getProperty("sessionAssuranceLevelforMFA")=="5"){
   mfaCompleted = true
   logger.error(adapterLoggerPrefix+"::mfaCompleted = [" + mfaCompleted + "] type = " + typeof mfaCompleted);
    }
   } catch (e) {
    logger.error(adapterLoggerPrefix+"::Error reading 'sessionAssuranceLevelforMFA' property::" + e);
   }*/

 
   // Use == instead of === to handle Java String vs JS string comparison
   //if (mfaCompleted != null && String(mfaCompleted) == "true") {
    //logger.error(adapterLoggerPrefix+"::MFA detected! Switching to MobileTwoFactorContract");

    try {
     var newXml = null;
     var assertions = res.getAssertion();
     if (assertions != null && assertions.size() > 0) {
      var assertion = assertions.get(0);
      var xmlStr = assertion.toXMLString(true, true);
      logger.debug(adapterLoggerPrefix+"::Original assertion contains PWD_URI::" + (xmlStr.indexOf(PWD_URI) >= 0));
      logger.debug(adapterLoggerPrefix+"::Original assertion contains UNSPECIFIED_URI::" + (xmlStr.indexOf(UNSPECIFIED_URI) >= 0));

      // RepnewXml = xmlStr.replace(PWD_URI, MFA_URI);Replace AuthnContextClassRef in the XML string
      if(xmlStr.indexOf(PWD_URI) >= 0){
      newXml = xmlStr.replace(PWD_URI, MFA_URI);
     } else if(xmlStr.indexOf(UNSPECIFIED_URI) >= 0){        
      newXml = xmlStr.replace(UNSPECIFIED_URI, MFA_URI);
     }
      //var newXml = xmlStr.replace(PWD_URI, MFA_URI);
      logger.debug(adapterLoggerPrefix+"::Modified XML contains MFA_URI::" + (newXml.indexOf(MFA_URI) >= 0));

      // Create new assertion from modified XML using AssertionFactory
      var factory = com.sun.identity.saml2.assertion.AssertionFactory.getInstance();
      var newAssertion = factory.createAssertion(newXml);
                
      logger.error(adapterLoggerPrefix+"::New assertion XML::" + newAssertion.toXMLString(true, true));

      // Replace the assertion in the response list
      assertions.set(0, newAssertion);
      logger.error(adapterLoggerPrefix+"::Successfully replaced assertion in response!");
     }
    } catch (e) {
     logger.error(adapterLoggerPrefix+"::Error in XML replacement approach::" + e);
    }
  /*} else {
    logger.error(adapterLoggerPrefix+"::No MFA - Default authentication context is set");
   }*/
  }

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