var autoTesting = systemEnv.getProperty("esv.automation.testing").toLowerCase();
var nodeLogger = {
      // Logs detailed debug messages for troubleshooting  
      debug: function (message) {
          logger.debug(message);
      },
      // Logs Error that can impact Application functionality
      error: function (message) {
          logger.error(message);
      },
      info: function (message) {
          logger.info(message);
      }
  };

var alwaysSkipRegistration = [
    "abc.bji@mailsac.com",
    "ui.ui@mailsac.com",
    "OXYVSD.RQNBWS@sharklasers.com",
    "NXDKVY.AMIOGV@sharklasers.com",
    "DEV_KYAUG9_I_14@mailinator.com"
];

if(nodeState.get("mail") != null){
    mail = nodeState.get("mail");
}

var skipRegistration = false;
logger.debug(alwaysSkipRegistration.length);
if(autoTesting === "true"){
if (mail) {
    for (var i = 0; i < alwaysSkipRegistration.length; i++) {
        if (alwaysSkipRegistration[i].toLowerCase() === mail.toLowerCase()) {
            skipRegistration = true;
            break;
        }
    }
}
}

if (skipRegistration) {
    action.goTo("registrationNotNeeded");
} else if (
    nodeState.get("needregistration") === "MOBILE" ||
    nodeState.get("needregistration") === "AUTHENTICATOR"
) {
    if(nodeState.get("journeyNameReporting") !== "RiskBased"){
         nodeState.putShared("journeyNameReporting","StepUpApplicationLogin") //MFAReporting
    }
   
     if(nodeState.get("journeyName") === "ApplicationLogin"){
                    nodeState.putShared("journeyName","")
                    }
    action.goTo("registrationNeeded");
} else {
    action.goTo("registrationNotNeeded");
}