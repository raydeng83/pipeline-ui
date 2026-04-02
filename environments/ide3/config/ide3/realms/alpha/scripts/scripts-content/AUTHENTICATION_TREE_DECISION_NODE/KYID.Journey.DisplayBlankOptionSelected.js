
function getLocale() {
     var clocale = requestParameters.get("clocale");
    if (clocale === null || clocale === "" || clocale === undefined) {
        clocale = "en";
    } else {
        clocale = clocale.get(0);
    }
    nodeState.putShared("clocale", clocale);
    logger.error("*****************clocale***************** " + clocale + " ::::::::::::::" + clocale);
    if (clocale === null || clocale === "" || clocale === undefined) {
        // If 'clocale' is null or empty, redirect to false
        logger.error("Determined action based on English clocale."); 
    } else if (clocale.indexOf("es") !== -1) {      
        logger.error("Determined action based on Spanish clocale.");
    } else if (clocale.indexOf("en") !== -1) {       
        logger.error("Determined action based on English clocale.");       
    } else {
        
        logger.error("clocale not recognized, defaulting to false.");
    }
    return clocale;
}

// Function to set error message based on locale
function setErrorMessage() {
    var clocale = getLocale();
    var blankmsg = "";

    if (clocale === "es") {
        blankmsg = systemEnv.getProperty("esv.blankoption.error.message.es");
    } else {
        blankmsg = systemEnv.getProperty("esv.blankoption.error.message.en");
    }
    
    nodeState.putShared("blankmsg", blankmsg);
    logger.error("Set error message: " + blankmsg);
}

// Main execution
try {
    setErrorMessage();
    outcome = "true"; 
} catch (error) {
    logger.error("Error in setting error message: " + error.message);
    }
