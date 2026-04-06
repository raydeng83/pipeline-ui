var errorInvalidEmailFormat = "invalid_emailFormat";
logger.error("invalid_emailFormat");
nodeState.putShared("errorInvalidEmailFormat",errorInvalidEmailFormat);
action.goTo("true");