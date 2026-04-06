var resendSMS = "sms_resent";
logger.error("sms_resent");
nodeState.putShared("resendSMS",resendSMS);
nodeState.putShared("MFAMethod","sms");
nodeState.putShared("resendVoice", null);
action.goTo("true");