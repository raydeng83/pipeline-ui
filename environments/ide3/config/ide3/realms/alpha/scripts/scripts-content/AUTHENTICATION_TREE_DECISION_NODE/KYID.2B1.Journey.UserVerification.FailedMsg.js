/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//callbacksBuilder.textOutputCallback(0,"user has been verified")

var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

errMsg["code"] = "INF-USR-VER-002";
errMsg["message"] = "User has not been verified"

var jsonobj = {"pageHeader": "1_User_Verification_Failure"};
callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));

callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg));

outcome = "true";
