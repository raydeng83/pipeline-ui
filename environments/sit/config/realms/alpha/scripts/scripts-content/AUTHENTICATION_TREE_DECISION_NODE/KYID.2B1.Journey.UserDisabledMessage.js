var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
 
errMsg["code"] = "ERR-USR-DSB-001";
errMsg["message"] = "User has been disabled at AD"
 
//var jsonobj = {"pageHeader": "1_User_Account_Disabled"};
nodeState.putShared("accountDisabled",JSON.stringify(errMsg));
logger.debug("errMsg = "+nodeState.get("accountDisabled"));

//nodeState.putShared("accountDisabled", "yes");
//callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
 
//callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg));
 
outcome = "true";