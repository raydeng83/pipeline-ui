var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Display Instruction",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.DisplayMessageToUserToSendFRCodeorPush",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false",
    ANOTHER_METHOD: "anotherMethod",
};

/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed error messages for troubleshooting  
    error: function (message) {
        logger.error(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
  };



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


function processCallbacks() {
    logger.error("Started new processCallbacks1 ********************")
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
        if (callbacks.isEmpty()) {
            if (nodeState.get("errorMessage") != null){
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(2,error)
            }

            var displayMessage1 = "1. On your mobile device, download the ForgeRock Authenticator app from the App Store (iPhone and iPad) or Google Play (Android devices)." 
            var displayMessage2 = "2. Start the ForgeRock Authenticator app on the device to register, and then click the plus icon." 
            var displayMessage3 = "3. Point the camera at the QR code and the ForgeRock Authenticator app will acquire the QR code."

            if (clocale === "es") {
                if (nodeState.get("errorMessage") != null){
                    var error = nodeState.get("errorMessage");
                    callbacksBuilder.textOutputCallback(2,error)
                }
                var displayMessage1 = "1. En su dispositivo móvil, descargue la aplicación ForgeRock Authenticator desde la App Store (iPhone y iPad) o Google Play (dispositivos Android)."
                var displayMessage2 = "2. Inicie la aplicación ForgeRock Authenticator en el dispositivo que desea registrar y luego haga clic en el ícono de más." 
                var displayMessage3 = "3. Apunte la cámara al código QR y la aplicación ForgeRock Authenticator adquirirá el código QR."
            }
            callbacksBuilder.textOutputCallback(0, "<div class='page-element'></div>");
            callbacksBuilder.textOutputCallback(0, displayMessage1);
            callbacksBuilder.textOutputCallback(0, displayMessage2);
            callbacksBuilder.textOutputCallback(0, displayMessage3);
            callbacksBuilder.textOutputCallback(0, "<div class='page-element'></div>");
            
            var confirmationMessage = clocale === "es" ? "Continuar" : "Continue";
            var anotherMethodMessage = clocale === "es" ? "Volver a la lista de autenticadores" : "Return to authenticator list"
            callbacksBuilder.confirmationCallback(0, [confirmationMessage, anotherMethodMessage], 0);
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

            if (selectedOutcome === 0) {
                logger.error("Started new processCallbacks 2********************")
                nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + "Selected outcome is TRUE");
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.SUCCESS);
            }else if(selectedOutcome === 1){
                
                nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + "Inside the another factor condition");
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.ANOTHER_METHOD)
            } else {
                
                nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + "Unexpected user choice or no choice made.");
                action.goTo(NodeOutcome.FAILED);
            }
        }
    } catch (error) {
         nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + "Error processing callbacks: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }
}
// Main execution
try {
    
    processCallbacks();
} catch (error) {
    nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + "Error in main execution: " + error.message);
}

