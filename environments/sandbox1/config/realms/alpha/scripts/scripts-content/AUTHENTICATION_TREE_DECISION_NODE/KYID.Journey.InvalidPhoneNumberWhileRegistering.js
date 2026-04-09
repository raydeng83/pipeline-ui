// nodeState.putShared("errorMessage","ERROR: Invalid OTP. Please re-enter");
// outcome = "true"


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
    var errorInvalidPhoneNumber = "";

    if (clocale === "es") {
        errorInvalidPhoneNumber = systemEnv.getProperty("esv.error.invalidphonenumber.es");
    } else {
        errorInvalidPhoneNumber = systemEnv.getProperty("esv.error.invalidphonenumber.en");
    }
    
    nodeState.putShared("errorInvalidPhoneNumber", errorInvalidPhoneNumber);
    logger.error("Set error message: " + errorInvalidPhoneNumber);
}

// Main execution
try {
    setErrorMessage();
    outcome = "true"; 
} catch (error) {
    logger.error("Error in setting error message: " + error.message);
    }
