
var errorMessage = "ERR-EXT-LCK-001 The email or password you entered is invalid. Please re-enter the email and password and try again.";
nodeState.putShared("failedOrInactive", errorMessage);
logger.debug("inside KYID.2B1.Journey.PTAExttUserLockout");
outcome = "true";
