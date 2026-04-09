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

function createPeriodicCheckScript(currentTime, redirectTime, redirectUrl, intervalMs) {
    return String(`
        (function() {
            var redirectTimestamp = ${redirectTime};
            var redirectUrl = "${redirectUrl}";
            var interval = ${intervalMs};

            function checkTime() {
                var currentTimestamp = Date.now();

                if (currentTimestamp >= redirectTimestamp) {
                    clearInterval(intervalId); // Stop the interval when redirecting
                    window.location.replace(redirectUrl);
                }
            }

            // Run the check periodically based on the interval
            var intervalId = setInterval(checkTime, interval);
        })();
    `);
}

try {
    var authnSessionCurrentTime = Date.now(); // Current time in milliseconds
    var authnSessionRedirectTime = nodeState.get("authnSessionRedirectTime"); // Redirect time from node state
    var authnSessionRedirectUrl = nodeState.get("authnSessionRedirectUrl"); // Redirect URL from node state
    var authnSessionCheckInterval = nodeState.get("authnSessionCheckInterval"); // Interval in milliseconds, default to 1000ms

    if (!authnSessionCurrentTime || !authnSessionRedirectTime || !authnSessionRedirectUrl) {
        throw "authnSessionCurrentTime, authnSessionRedirectTime, or authnSessionRedirectUrl are not defined!";
    }

    if (callbacks.isEmpty()) {
        // Inject the periodic check script with the interval
        callbacksBuilder.scriptTextOutputCallback(
            createPeriodicCheckScript(authnSessionCurrentTime, authnSessionRedirectTime, authnSessionRedirectUrl, authnSessionCheckInterval)
        );
    } else {
        // If callbacks are already populated, move to the next step
        action.goTo("true");
    }
} catch (e) {
    nodeState.putShared("errorMessage", e.toString());
    action.goTo("true");
}
