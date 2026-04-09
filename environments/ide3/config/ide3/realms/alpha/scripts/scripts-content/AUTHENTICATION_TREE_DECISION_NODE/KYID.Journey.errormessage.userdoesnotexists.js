// Function to log errors
function logError(message) {
    logger.error(message);
}

function getLocale() {
   var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   nodeState.putShared("clocale", clocale);
   return clocale;
}

// Function to handle callbacks and set the action
function processCallbacks() {
    try {

        var errorMessage = "";
        var redirectMessage = "";
        var clocale = nodeState.get("clocale");

            // Determine error and redirection messages based on locale
            if (clocale === "es") {
                errorMessage = systemEnv.getProperty("esv.error.usernotfound.helpdesk.es");
                redirectMessage = systemEnv.getProperty("esv.redirect.message.unauthorized.helpdesk.user.es");
            } else {
                errorMessage = systemEnv.getProperty("esv.error.usernotfound.helpdesk.en");
                redirectMessage = systemEnv.getProperty("esv.redirect.message.unauthorized.helpdesk.user.en");
            }
        if (callbacks.isEmpty()) {
            // Build confirmation callback
            nodeState.putShared("errorMessage", errorMessage);

           var error = nodeState.get("errorMessage");
           // callbacksBuilder.textOutputCallback(2,error)
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            callbacksBuilder.confirmationCallback(0,[redirectMessage],0);
            logError("Confirmation callback has been set up.");
        } else {
            // Retrieve the user's choice
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0)
            logError("User selected outcome: " + selectedOutcome);

            if (selectedOutcome === 0) {
                logError("User selected to Click here to redirect to Helpdesk KOG App.");
                action.goTo("Click here to redirect to Helpdesk KOG App")
            } else {
                logError("Unexpected user choice or no choice made.");
                //action = fr.Action.goTo("false").build();
            }
        }
    } catch (error) {
        logError("Error processing callbacks: " + error.message);
        //action = fr.Action.goTo("false").build();
    }
}

// Main execution
try {
    getLocale();
    processCallbacks();
} catch (error) {
    logError("Error in main execution: " + error.message);
   // action = fr.Action.goTo("false").build();
}

// Return the action
//action;



///