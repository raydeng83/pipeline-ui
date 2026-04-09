/*
DISCLAIMER: 
This code is provided to you expressly as an example ("Sample Code"). It is the responsibility of the individual recipient user, in their sole discretion, 
to diligence such Sample Code for accuracy, completeness, security, and final determination for appropriateness of use.
ANY SAMPLE CODE IS PROVIDED ON AN "AS IS" IS BASIS, WITHOUT WARRANTY OF ANY KIND. PING IDENTITY AND ITS LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, 
IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.
PING IDENTITY SHALL NOT HAVE ANY LIABILITY ARISING OUT OF OR RELATING TO ANY USE, IMPLEMENTATION, INTEGRATION, OR CONFIGURATION OF ANY SAMPLE CODE IN ANY PRODUCTION 
ENVIRONMENT OR FOR ANY COMMERCIAL DEPLOYMENT(S). 
THE USE OF THIS SAMPLE CODE IS SUBJECT TO PING IDENTITY TERMS AND CONDITIONS LISTED HERE => https://www.pingidentity.com/en/legal/product-terms.html
 */

var loggerName = "rs-logger: ";

try {
  // Get the current time in milliseconds
  var authnSessionCurrentTime = Date.now();

  // Retrieve the max session time in miliseconds
  var authnSessionMaxTime = 5000; //Number(systemEnv.getProperty('esv.authn.session.maxtime') || 1800000;

  // Calculate the redirect time (current time + max time)
  var authnSessionRedirectTime = authnSessionCurrentTime + authnSessionMaxTime;

  // Retrieve the authnSessionRedirectTime check interval in miliseconds
  var authnSessionCheckInterval = 1000; //Number(systemEnv.getProperty('esv.authn.session.check.interval') || 1000;
    
  // Get the redirect URL
  var authnSessionRedirectUrl = String('https://www.pingidentity.com/').trim(); //String(systemEnv.getProperty('esv.authn.session.timeout.url)).trim()
    
  // Store the calculated values in nodeState for later use
  nodeState.putShared("authnSessionRedirectTime", authnSessionRedirectTime);
  nodeState.putShared("authnSessionRedirectUrl", authnSessionRedirectUrl);
  nodeState.putShared("authnSessionCheckInterval", authnSessionCheckInterval);

  // Log debug information
  logger.error(loggerName + "authnSessionCurrentTime: " + authnSessionCurrentTime);
  logger.error(loggerName + "authnSessionMaxTime: " + authnSessionMaxTime);
  logger.error(loggerName + "authnSessionRedirectTime: " + authnSessionRedirectTime);
  logger.error(loggerName + "authnSessionRedirectUrl: " + authnSessionRedirectUrl);
  logger.error(loggerName + "authnSessionCheckInterval: " + authnSessionCheckInterval);

  outcome = "success";
    
} catch (e) {
  // Handle errors
  nodeState.putShared("errorMessage", e.toString());
  logger.error(loggerName + "Error calculating redirect time: " + e);
  outcome = "error";
}
