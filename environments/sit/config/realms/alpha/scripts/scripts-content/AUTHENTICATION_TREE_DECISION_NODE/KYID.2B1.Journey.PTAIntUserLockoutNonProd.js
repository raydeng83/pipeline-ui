var errorMessage ="ERR-INT-LCK-001-NONPROD-As per the Commonwealth policy, you need to reset your password using the following link. Please click here.";
nodeState.putShared("InternalUserLckOutNonProd","true")
nodeState.putShared("failedOrInactive", errorMessage);
logger.debug("inside KYID.2B1.Journey.PTAIntUserLockout");
outcome = "true";
