var errorMessage = "invalid_otp";
logger.debug("invalid_otp");
nodeState.putShared("validationErrorCode",errorMessage);
action.goTo("true");