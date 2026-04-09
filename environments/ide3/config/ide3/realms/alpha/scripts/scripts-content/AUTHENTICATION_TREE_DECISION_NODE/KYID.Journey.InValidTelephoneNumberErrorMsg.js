

// Function to set error message based on locale
function setErrorMessage() {
    var invalidphoneNoMsg = "";
    if(nodeState.get("invalidphoneNoMsg") && nodeState.get("invalidphoneNoMsg")!=null){
        invalidphoneNoMsg = nodeState.get("invalidphoneNoMsg");
    }
    nodeState.putShared("errorInvalidPhoneNumber", invalidphoneNoMsg);
}

// Main execution
try {
    setErrorMessage();
    outcome = "True"; 
} catch (error) {
    logger.error("Error in setting error message: " + error.message);
}
