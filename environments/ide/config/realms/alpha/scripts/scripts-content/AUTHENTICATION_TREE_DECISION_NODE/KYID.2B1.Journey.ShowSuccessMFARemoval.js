/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//callbacksBuilder.textOutputCallback(0,"Success: MFA Removal")

var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

errMsg["code"] = "INF-MFA-REM-001";
errMsg["message"] = libError.readErrorMessage("INF-MFA-REM-001");

var jsonobj = {"pageHeader": "1_MFA_Removal_Success"};
callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg));



outcome = "true";
