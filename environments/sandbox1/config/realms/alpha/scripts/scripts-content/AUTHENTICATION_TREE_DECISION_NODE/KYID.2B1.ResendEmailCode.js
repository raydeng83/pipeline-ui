function setErrorMessage() {
    var resendcodeMessage = "code_resent";
    //resendcodeMessage = systemEnv.getProperty("esv.resendcode.en");
    nodeState.putShared("resendcodeMessage", resendcodeMessage);
    logger.error("Set error message: " + resendcodeMessage);
}

// Main execution
try {
    setErrorMessage();
    outcome = "true"; 
} catch (error) {
    logger.error("Error in setting error message: " + error.message);
    }