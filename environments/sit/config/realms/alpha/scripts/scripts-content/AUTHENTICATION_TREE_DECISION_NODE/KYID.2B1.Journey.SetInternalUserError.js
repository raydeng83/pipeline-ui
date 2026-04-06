/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// nodeState.putShared("internaluser","internaluser_Error")
// outcome = "true";

var libError = require("KYID.2B1.Library.Loggers");
var errMsg = {};
errMsg["code"] = "ERR-DAS-ROL-001";
errMsg["message"] = libError.readErrorMessage("ERR-DAS-ROL-001"); 
nodeState.putShared("internaluser",JSON.stringify(errMsg));
logger.error("read the json error"+JSON.stringify(errMsg))
outcome = "true";