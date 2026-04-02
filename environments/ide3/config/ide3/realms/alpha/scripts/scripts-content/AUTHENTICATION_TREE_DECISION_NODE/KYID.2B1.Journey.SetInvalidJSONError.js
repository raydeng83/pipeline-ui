// nodeState.putShared("invalidJSONError","Invalid_JSON")
// outcome = "true";

libError = require("KYID.2B1.Library.Loggers");

errMsg["code"] = "ERR-DAS-INP-000";
errMsg["message"] = libError.readErrorMessage("ERR-DAS-INP-000"); 
nodeState.putShared("invalidJSONError",JSON.stringify(errMsg));
logger.debug("read the json error"+JSON.stringify(errMsg))
outcome = "true";