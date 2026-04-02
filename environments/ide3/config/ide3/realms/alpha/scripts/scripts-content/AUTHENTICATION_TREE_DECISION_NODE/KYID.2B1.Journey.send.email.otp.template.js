/**
 * @file This script sends a HOTP to a user via the Platform Email Service
 * NOTE - In Production your own SMTP Server needs to be used. To do this check out:
 * https://backstage.forgerock.com/docs/idcloud/latest/tenants/email-provider.html#external_smtp_email_server
 * @version 0.2.0
 * @keywords email mail hotp sharedState transientState
 */

/**
 * Environment specific config 
 * Ensure the esv-tenant-fqdn is set as per the steps in this repo:
 * https://stash.forgerock.org/projects/CS/repos/common_get_access_token_for_idm/browse/src/am
 */

/**
 * Full Configuration 
 */

var config = {
  tenantFqdn: "esv.kyid.tenant.fqdn",
  ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
  templateID: "kyidEmailOtp",
  nodeName: "kyid.send.email.otp.template"
};

/**
* Node outcomes
*/

var NodeOutcome = {
  PASS: "sent",
  FAIL: "noMail",
  ERROR: "error"
};

/**
* Log an HTTP response
* 
* @param {Response} HTTP response object
*/

function logResponse(response) {
  // logger.error(config.nodeName + ": Scripted Node HTTP Response: " + response.status+ ", Body: " + response.getEntity().getString());
}

function fetchUserData(userId) {
    try {
        logger.debug( "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        logger.debug( "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}


function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}



/**
* Send email via the IDM Email Service
* 
* @param {string} username - username of the user retrieved from sharedState
* @param {string} accessToken - Access Token retrieved from transientState
* @param {string} fqdn - Tenant fully qualified domain name retreived from an ESV
* @param {string} hotp - HOTP retrieved from transientState
* @param {string} mail - mail attribute retrieved from the idRepository. Note if this is a registration journey acquire mail from sharedState
* @param {string} givenName - givenName attribute retrieved from the idRepository. Note if this is a registration journey acquire givenName from sharedState
*/

function sendMail(username, accessToken, fqdn, hotp, mail, givenName,sn) {

     // var idmEndpoint = "https://sso.ide.kyid.ky.gov/openidm/external/email?_action=sendTemplate";
    var idmEndpoint = systemEnv.getProperty(config.tenantFqdn) +"/openidm/external/email?_action=sendTemplate";
    

  var response;

  logger.debug(config.nodeName + ": Sending templated email via the IDM email service for user: " + username + " with mail address: " + mail + " and HOTP: " + hotp + " and template: " + config.templateID + "GivenName" + givenName);


logger.debug("Access Token .........." + accessToken);
logger.debug("Given Name is ----" + givenName);
logger.debug("OTP is --" + hotp);


try{
    var lang = getLocale();
  var options = {                            
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       "accept-language": lang
    },
    token: accessToken,                       
    body: {
      "templateName": config.templateID,
      "to": mail,
      "object": {
          "givenName": givenName,
          "sn": sn,
          "otp": hotp
      }
    }
  }
  
  var requestURL = idmEndpoint;
  var response = httpClient.send(requestURL, options).get(); 
  logger.debug("*******Send Mail Response Status" + response.status) ;           
  
}

  catch (e) {
      logger.error(config.nodeName + ": Unable to call IDM Email endpoint using template: " + config.templateID + " Exception is: " + e);
      return NodeOutcome.ERROR;
  }
  logResponse(response);

  if (response.status === 200) {
      logger.debug(config.nodeName + ": Email sent for user: " + username + " with email: " + mail);
      return NodeOutcome.PASS;
  }
  else if (response.status === 401) {
      logger.debug(config.nodeName + ": Access token is invalid: " + response.status+ " for user: " + username);
      return NodeOutcome.ERROR;
  }
  else if (response.status === 404) {
      logger.debug(config.nodeName + " IDM Email endpoint not found. HTTP Result: " + response.status+ " for idmEndpoint: " + idmEndpoint);
      return NodeOutcome.ERROR;
  }
  //Catch all error 
  logger.debug(config.nodeName + ": HTTP 5xx or Unknown error occurred. HTTP Result: " + response.status);
  return NodeOutcome.ERROR;
}

/**
* Node entry point
*/
// Main Execution

logger.debug(config.nodeName + ": node executing");

var username;
var accessToken;
var idmEndpoint;
var hotp;
var mail;

var userId = nodeState.get("_id");
var userProfile = fetchUserData(userId);

var givenName = userProfile.givenName;
var sn =userProfile.sn;
var mail = userProfile.mail;


if (!(username = nodeState.get("_id"))) {
  logger.debug(config.nodeName + ": Unable to retrieve username from sharedState");
  outcome = NodeOutcome.ERROR;
}

// else if (!(accessToken = JSON.stringify(nodeState.get(config.ACCESS_TOKEN_STATE_FIELD)))) {
else if (!(accessToken = nodeState.get(config.ACCESS_TOKEN_STATE_FIELD))){
  logger.debug(config.nodeName + ": Unable to retrieve Access Token from transientState");
  outcome = NodeOutcome.ERROR;
}

else if (!(fqdn = config.tenantFqdn)) {
  logger.debug(config.nodeName + ": Unable to retrieve tenant from ESV called: " + config.tenantFqdn);
  outcome = NodeOutcome.ERROR;
}

else if (!(hotp = nodeState.get("oneTimePassword"))) {
  logger.debug(config.nodeName + ": Unable to retrieve HOTP from transientState");
  outcome = NodeOutcome.ERROR;
}



else if (!(mail)){
    logger.debug(config.nodeName + ": Unable to retrieve mail attribute from the idRepository");
  outcome = NodeOutcome.FAIL;
}

else if (!(givenName)){
  logger.debug(config.nodeName + ": Unable to retrieve givenName attribute from the idRepository");
outcome = NodeOutcome.FAIL;
}

else if (!(sn)){
  logger.debug(config.nodeName + ": Unable to retrieve sn attribute from the idRepository");
outcome = NodeOutcome.FAIL;
}


//Execute function to send mail via IDM EMail Service
else {
  outcome = sendMail(username, accessToken, fqdn, hotp, mail, givenName,sn);
}