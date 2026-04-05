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
var adapterLoggerPrefix = "KYID_IDP_ADAPTER_LOG";

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
  	
    logger.error(adapterLoggerPrefix+"::"+"ENTERING PRESingleSignOn");
  	
  	var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var issuer = null;
    var reqID = null;
    var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
    var authnReqJSONCookie = {};
  
    if (authnRequest) {
        logger.error(adapterLoggerPrefix+"::"+"AUTHN REQUEST PRESENT IN PRESingleSignOn");
        reqID = authnRequest.getID();
        logger.error(adapterLoggerPrefix+"::"+"REQID PRESENT IN PRESingleSignOn");
        issuer = authnRequest.getIssuer().getValue().toString();
        logger.error(adapterLoggerPrefix+"::"+"ISSUER PRESENT IN PRESingleSignOn");
        
        if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        	displayUrl = issuer;
            logger.error(adapterLoggerPrefix+"::"+"displayUrl URL PRESENT IN PRESingleSignOn"+"::"+displayUrl);
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        
        } else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
            //wsfed application coming from on-prem app
            var authnRequestExtensionList=authnRequest.getExtensions().getAny();
            logger.error(adapterLoggerPrefix+"::"+"WS-FED AUTHNREQUEST-EXTLIST IN PRESingleSignOn"+"::"+authnRequestExtensionList);
            var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
            displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
            logger.error(adapterLoggerPrefix+"::"+"displayUrl URL PRESENT IN PRESingleSignOn"+"::"+displayUrl);
            if(authnRequestExtensionList.size()>1) {
                var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
                wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
            } else {
                wtrealmUrl=displayUrl;
            }
            logger.error(adapterLoggerPrefix+"::"+"wtrealmUrl URL PRESENT IN PRESingleSignOn"+"::"+wtrealmUrl);
            isWsfedApp=true;
        
        } else if(issuer.localeCompare("kyidsp") == 0 ) {
            displayUrl=systemEnv.getProperty("esv.default.app.url");
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
            response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    	} 
        //Set authentication request context information in a cookie
        authnReqJSONCookie["reqID"]=reqID;
        authnReqJSONCookie["issuer"]=authnRequest.getIssuer().getValue();
        authnReqJSONCookie["displayUrl"]=decodeURIComponent(displayUrl);
        authnReqJSONCookie["wtrealmUrl"]=decodeURIComponent(wtrealmUrl);
        authnReqJSONCookie["isWsfedApp"]=isWsfedApp;
        response.addHeader("Set-Cookie", "authnReqJSONCookie=" + JSON.stringify(authnReqJSONCookie) + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
      
        var lang = readLangFromSessionCookie(request);
        response.addHeader("Set-Cookie", "locale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
        response.addHeader("Set-Cookie", "clocale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
        logger.error(adapterLoggerPrefix+"::"+"Language value in a locale cookie IN PRESingleSignOn"+"::"+lang);
    }

    logger.error(adapterLoggerPrefix+"::"+"EXITING PRESingleSignOn");
    
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
     logger.error(adapterLoggerPrefix+"::"+"ENTERING PREAuthentication FUNCTION"+"::"+reqId);
  
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    //var authnRequestExtensions=authnRequest.getExtensions().toXMLString();
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var issuer = "";
    var finalUrl = null;
    if (authnRequest) {
        logger.error(adapterLoggerPrefix+"::"+"AUTHN REQUEST PRESENT IN PREAuthentication");
        var getIssuerTime = new Date().toISOString();
        var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
        response.addHeader("Set-Cookie", "getIssuerTime=" + getIssuerTime + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
        issuer = authnRequest.getIssuer().getValue().toString();
        logger.error(adapterLoggerPrefix+"::"+"ISSUER PRESENT IN PREAuthentication"+"::"+issuer);
    }
    if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0 && !session) {
        finalUrl = systemEnv.getProperty("esv.logout.app.url")+"loggedout/";
        logger.error(adapterLoggerPrefix+"::"+"finalUrl PRESENT IN PREAuthentication"+"::"+finalUrl);
        response.sendRedirect(finalUrl);
        return true;
    } else if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        displayUrl = issuer;
        logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
    }
    else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
		
        //wsfed application coming from on-prem app
        var authnRequestExtensionList=authnRequest.getExtensions().getAny();
        //logger.error("SAML PreAuthentication AUTHNREQUEST-EXTLIST: "+authnRequestExtensionList);
        var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
        displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
        logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        //logger.error("Set displayUrl in a ReturnURL cookie: " + displayUrl);
        
        if(authnRequestExtensionList.size()>1) {
            var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
            wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
        } else {
            wtrealmUrl=displayUrl;
        }
        logger.error(adapterLoggerPrefix+"::"+"wtrealmUrl PRESENT IN PREAuthentication"+"::"+wtrealmUrl);
        response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(wtrealmUrl) + "; Path=/; HttpOnly");
        isWsfedApp=true;
    } else if(issuer.localeCompare("kyidsp") == 0 ) {
      	displayUrl=systemEnv.getProperty("esv.default.app.url");
        logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
      	response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
      	response.addHeader("Set-Cookie", "rp-realm=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    } else if(relayState !== null && relayState.startsWith("https")) {
        //SAML Application with a full proper relayState URL
        displayUrl = relayState;
        logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    } else if(issuer.startsWith("https")) {
        //SAML Application with a relayState URI only 
        displayUrl = authnRequest.getIssuer().getValue() + relayState;
        logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PREAuthentication"+"::"+displayUrl);
        response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
    }

    var scheme = request.getScheme();
    var host = request.getServerName();
    var port = request.getServerPort();
    var login = "kyid_loginMain";  //kyid_loginMainRouterJourney
    var reqID = authnRequest.getID();
  	var lang = readLangFromSessionCookie(request);
    var tenantCookieDomain=systemEnv.getProperty("esv.kyid.cookie.domain");
    response.addHeader("Set-Cookie", "locale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
    response.addHeader("Set-Cookie", "clocale=" + lang + "; Path=/; HttpOnly; sameSite=Lax; domain="+tenantCookieDomain);
    logger.error(adapterLoggerPrefix+"::"+"Language value in a locale cookie IN PREAuthentication"+"::"+lang);
  
  	logger.error(adapterLoggerPrefix+"::"+"EXITING PREAuthentication");	
  
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
    logger.error(adapterLoggerPrefix+"::"+"ENTERING PRESEND RESPONSE FUNCTION"+"::"+reqId);
    /* This method assumes that the authentication is only SP Initiated and not IDP initiated*/
    var issuer = null;
    var reqID = null;
    var displayUrl = null;
    var wtrealmUrl = null;
    var isWsfedApp = false;
    var authnReqFound = true;
    var login = "kyid_loginMain";  //kyid_loginMainRouterJourney
    var scheme = request.getScheme();
    var host = request.getServerName();
    var port = request.getServerPort();
  
    if (authnRequest) {
        logger.error(adapterLoggerPrefix+"::"+"AUTHN REQUEST PRESENT IN PRESEND RESPONSE");
        issuer = authnRequest.getIssuer().getValue().toString();
        logger.error(adapterLoggerPrefix+"::"+"ISSUER IN PRESEND RESPONSE FUNCTION"+"::"+issuer);
    
    } else {
        logger.error(adapterLoggerPrefix+"::"+"NO AUTHN REQUEST IN PRESEND RESPONSE");
        authnReqFound = false;
    }
   //Remove it after testing in IDE, before promoting to higher env.
   /* if(session){
    	authnReqFound = false;
    }*/
      //Remove it End
    if(authnReqFound) {
    	if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
        	displayUrl = issuer;
            logger.error(adapterLoggerPrefix+"::"+"displayUrl IN PRESEND RESPONSE FUNCTION"+"::"+displayUrl);
        } 
        else if (issuer.localeCompare("kyidsp") == 0 && authnRequest.getExtensions()) {
            //wsfed application coming from on-prem app
            var authnRequestExtensionList=authnRequest.getExtensions().getAny();
            var rawDisplayUrl=authnRequestExtensionList.get(0).split("saml2:AttributeValue")[1];
            displayUrl=rawDisplayUrl.substring(1,rawDisplayUrl.length()-2);
            logger.error(adapterLoggerPrefix+"::"+"displayUrl IN PRESEND RESPONSE FUNCTION"+"::"+displayUrl);
             if(authnRequestExtensionList.size()>1) {
                var rawWtRealmUrl=authnRequestExtensionList.get(1).split("saml2:AttributeValue")[1];
                wtrealmUrl=rawWtRealmUrl.substring(1,rawWtRealmUrl.length()-2);
            } else {
                wtrealmUrl=displayUrl;
            }
            logger.error(adapterLoggerPrefix+"::"+"wtrealmUrl IN PRESEND RESPONSE FUNCTION"+"::"+wtrealmUrl);
            isWsfedApp=true;
        } else if(relayState!=null && relayState.startsWith("https")) {
            //SAML Application with a full proper relayState URL
            displayUrl = relayState;
            logger.error(adapterLoggerPrefix+"::"+"displayUrl IN PRESEND RESPONSE FUNCTION"+"::"+displayUrl);
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        } else if(issuer.startsWith("https")) {
            //SAML Application with a relayState URI only 
            displayUrl = authnRequest.getIssuer().getValue() + relayState;
            logger.error(adapterLoggerPrefix+"::"+"displayUrl IN PRESEND RESPONSE FUNCTION"+"::"+displayUrl);
            response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
        }
        reqID = authnRequest.getID();
        issuer = authnRequest.getIssuer().getValue();
    
    } else {
    	//Read Authentication Request from Session Cookie
          if(request.getHeader("Cookie") && request.getHeader("Cookie")!=null){
            var rawCookie = request.getHeader("Cookie");
            logger.error(adapterLoggerPrefix+"::"+"All the sessionCookies PRESENT IN PRESEND RESPONSE"+"::"+rawCookie);

            var rawCookieParams = rawCookie.split(";");
			logger.error(adapterLoggerPrefix+"::"+"length of rawCookieParams"+"::"+rawCookieParams.length)
            logger.error(adapterLoggerPrefix+"::"+"value of rawCookieParams[0]"+"::"+rawCookieParams[0])
            // Loop through the cookies
            for (var i = 0; i < rawCookieParams.length; i++) {
                var cookieName = rawCookieParams[i].split("=");
                var cookieValue = rawCookieParams[i].substring(rawCookieParams[i].indexOf("=")+1);
                var cookie = String(cookieName[0]).replace(/\s+/g, ' ').trim();
                logger.error(adapterLoggerPrefix+"::"+"sessionCookie PRESENT IN PRESEND RESPONSE"+"::"+typeof cookieValue+"::"+cookieValue);
                //logger.error(adapterLoggerPrefix+"::"+" Cookie Value "+cookieValue.toString());
                //var cookieValueM=cookieValue.toString();
                //logger.error(adapterLoggerPrefix+"::"+"Cookie Value"+cookieValue.toString().split(":")[1]);

                if(cookie.localeCompare("authnReqJSONCookie") == 0){
                    var sessionCookieVal = cookieValue.toString();
                    sessionCookieVal = sessionCookieVal.replace("\{","").replace("}","")
                    logger.error(adapterLoggerPrefix+"::"+"sessionCookieVal"+"::"+sessionCookieVal)
                    sessionCookieVal = sessionCookieVal.split(",");
                    logger.error(adapterLoggerPrefix+"::"+"length of sessionCookieVal"+"::"+sessionCookieVal.length)
                    
                     for(var j=0;j<sessionCookieVal.length;j++){
                       	logger.error(adapterLoggerPrefix+"::"+"sessionCookieVal"+[j]+"::"+sessionCookieVal[j])
                        var res =  sessionCookieVal[j];
                        logger.error(adapterLoggerPrefix+"::"+"res"+"::"+res)
                        var resValue = res.substring(res.indexOf(":")+1);
                        logger.error(adapterLoggerPrefix+"::"+"resValue"+"::"+resValue)
                        res =  sessionCookieVal[j].split(":");
                        var resName = res[0];
                        
                    	logger.error(adapterLoggerPrefix+"::"+"resName"+"::"+resName)
                         
                        if(resName.localeCompare("reqID")==0){
                        	reqID = resValue;
                            logger.error(adapterLoggerPrefix+"::"+"reqID PRESENT IN PRESEND RESPONSE"+"::"+reqID)
                        }
                        if(resName.localeCompare("issuer")==0){
                        	issuer = resValue;
                            logger.error(adapterLoggerPrefix+"::"+"issuer PRESENT IN PRESEND RESPONSE"+"::"+issuer)
                        }
                        if(resName.localeCompare("displayUrl")==0){
                        	displayUrl = resValue;
                            logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PRESEND RESPONSE"+"::"+displayUrl)
                        }
                        if(resName.localeCompare("wtrealmUrl")==0){
                        	wtrealmUrl = resValue;
                            logger.error(adapterLoggerPrefix+"::"+"wtrealmUrl PRESENT IN PRESEND RESPONSE"+"::"+wtrealmUrl)
                        }
                        if(resName.localeCompare("isWsfedApp")==0){
                        	isWsfedApp = resValue.toLowerCase().localeCompare("true")==0?true:false;
                            logger.error(adapterLoggerPrefix+"::"+"isWsfedApp PRESENT IN PRESEND RESPONSE"+"::"+typeof isWsfedApp + " | "+isWsfedApp )
                        } 
                    }
                     break; 
                  
                    //var cookieJSON = JSON.parse(cookieValue.replace(/\\/g, '"'));
                    /*var cookieJSON = JSON.parse(cookieValue);
                    reqID = cookieJSON.reqID;
                    logger.error(adapterLoggerPrefix+"::"+"reqID PRESENT IN PRESEND RESPONSE"+"::"+cookieJSON.reqID);
                    issuer = cookieJSON.issuer;
                    logger.error(adapterLoggerPrefix+"::"+"issuer PRESENT IN PRESEND RESPONSE"+"::"+cookieJSON.issuer);
                    displayUrl = cookieJSON.displayUrl;
                    logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PRESEND RESPONSE"+"::"+cookieJSON.displayUrl);
                    wtrealmUrl = cookieJSON.wtrealmUrl;
                    logger.error(adapterLoggerPrefix+"::"+"wtrealmUrl PRESENT IN PRESEND RESPONSE"+"::"+cookieJSON.wtrealmUrl);
                    isWsfedApp = cookieJSON.isWsfedApp;
                    logger.error(adapterLoggerPrefix+"::"+"isWsfedApp PRESENT IN PRESEND RESPONSE"+"::"+cookieJSON.isWsfedApp);
                    */
                  }
              }
         }  
      
         logger.error(adapterLoggerPrefix+"::"+"displayUrl in cookie IN PRESEND RESPONSE"+"::"+typeof displayUrl + " | "+displayUrl);
         if(displayUrl===null || displayUrl===undefined){
             logger.error(adapterLoggerPrefix+"::"+"displayUrl NOT PRESENT IN PRESEND RESPONSE");
			 if(relayState!=null && relayState.startsWith("https")) {
              //SAML Application with a full proper relayState URL
              	displayUrl = relayState;
                response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
              } else if(issuer.startsWith("https")) {
                  //SAML Application with a relayState URI only 
                displayUrl = issuer + relayState;
                response.addHeader("Set-Cookie", "ReturnURL=" + decodeURIComponent(displayUrl) + "; Path=/; HttpOnly");
             }   
             logger.error(adapterLoggerPrefix+"::"+"displayUrl PRESENT IN PRESEND RESPONSE"+"::"+displayUrl);
         }
    }
    
    // In the goto URL hostedEntityID must be lowercase, even if you declard it as Upper case
    var goto = scheme + "://" + host + ":" + port + "/am/saml2/continue/metaAlias" + realm + "/kyidp?" + "secondVisitUrl=/am/SSOPOST/metaAlias/alpha/kyidp?ReqID=" + reqID;
    logger.error(adapterLoggerPrefix+"::"+"gotoUrl PRESENT IN PRESEND RESPONSE"+"::"+goto);

    var finalUrl = "";
    
    if (isWsfedApp && displayUrl && wtrealmUrl) {
        logger.error(adapterLoggerPrefix+"::"+"isWsfedApp in cookie IN PRESEND RESPONSE"+"::"+isWsfedApp);
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
      response.addHeader("Set-Cookie", "rp-realm=" + "; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly")
    } 
   
    logger.error(adapterLoggerPrefix+"::"+"finalUrl PRESENT IN PRESEND RESPONSE"+"::"+finalUrl); 

    try {
        if (issuer.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
            return false;
        }
        else if (session.getProperty("visitedUrl").localeCompare("FALSE") == 0) {
            var lang = readLangFromSessionCookie(request);
            logger.error(adapterLoggerPrefix+"::"+"Language value in a locale cookie IN PRESEND RESPONSE"+"::"+lang);
            response.sendRedirect(finalUrl+"&clocale="+lang+"&locale="+lang);
            return true;
        }
        else if (session && session.getProperty("needKogSuccess") && session.getProperty("needKogSuccess").startsWith(systemEnv.getProperty("esv.kyid.kog.redirect.url"))) {
            finalUrl = session.getProperty("needKogSuccess");
            logger.error(adapterLoggerPrefix+"::"+"finalUrl for needKOGVisit PRESENT IN PRESEND RESPONSE"+"::"+finalUrl); 
            session.setProperty("needKogSuccess", "FALSE");
            response.sendRedirect(finalUrl);
            return true;
        } 
        else if (session && session.getProperty("authTimeoutRedirect") && session.getProperty("authTimeoutRedirect").startsWith("true")) {
            var defaultUrl=systemEnv.getProperty("esv.default.app.url");
            logger.error(adapterLoggerPrefix+"::"+"defaultUrl PRESENT IN PRESEND RESPONSE"+"::"+defaultUrl); 
            session.setProperty("authTimeoutRedirect", "false");
            response.sendRedirect(defaultUrl);
            return true;
        }
    } catch (e) {
        logger.error("An unexpected error occurred while processing claims in PRESEND RESPONSE: "+e);
        return false;
    }
  
    session.setProperty("visitedUrl", "FALSE");
    
    logger.error(adapterLoggerPrefix+"::"+"EXITING PRESEND RESPONSE");
  
    return false;

}


function readLangFromSessionCookie(request){
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
   //logger.error("**********Language locale value in session cookie is - ************"+lang);
   return lang;
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