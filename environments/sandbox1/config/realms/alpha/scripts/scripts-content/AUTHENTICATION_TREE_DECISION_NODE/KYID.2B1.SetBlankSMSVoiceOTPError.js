var errorMessage_BlankOTP = "blank_otp";
logger.error("blank_otp");
nodeState.putShared("errorMessage_BlankOTP",errorMessage_BlankOTP);
action.goTo("true");