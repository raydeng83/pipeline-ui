/**
 * Function: 
 *        nodeLogger(level,message)
 * Description:     
 * Returns: 
 * Date: 6th September 2024
 * Author: Deloitte
 */


//DEBUG Logging Function
function debug(message){
    logger.debug(message);
}

//WARN Logging Function
function warn(message){
    logger.warn(message);
}

//ERROR Logging Function
function error(message){
    logger.error(message);
}

// Function to Set Error Message Based on locale
function setErrorMessage(clocale,errLangMsgJSON) {
    
    if (clocale === "es") {
        return errLangMsgJSON["es"];

    } else if (clocale === "en") {
        return errLangMsgJSON["en"];
    }  
}


// export functions
exports.debug = debug;
exports.warn = debug;
exports.error = debug;
exports.setErrorMessage = setErrorMessage;

