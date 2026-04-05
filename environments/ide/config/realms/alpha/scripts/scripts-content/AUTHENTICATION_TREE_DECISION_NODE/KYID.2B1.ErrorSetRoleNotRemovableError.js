// nodeState.putShared("rolenotremovable","rolenotremovable_Error")
// outcome = "true";

var libError = require("KYID.2B1.Library.Loggers");
var errMsg = {};
errMsg["code"] = "ERR-DAS-ROL-001";
errMsg["message"] = libError.readErrorMessage("ERR-DAS-ROL-001"); 
nodeState.putShared("rolenotremovable",JSON.stringify(errMsg));
logger.debug("read the json error"+JSON.stringify(errMsg))
outcome = "true";