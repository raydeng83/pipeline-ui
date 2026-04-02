/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// nodeState.putShared("unexpectederror","some_unexpected_error_has_occured")
// outcome = "true";


var libError = require("KYID.2B1.Library.Loggers");
var errMsg = {};
errMsg["code"] = "ERR-CON-001";
errMsg["message"] = libError.readErrorMessage("ERR-CON-001"); 
nodeState.putShared("unexpectederror",JSON.stringify(errMsg));
logger.debug("read the json error"+JSON.stringify(errMsg))
outcome = "true";
