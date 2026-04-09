/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// nodeState.putShared("teststring","abc");
// logger.error("xiaohan debug test point start");
// logger.error("xiaohan debug test point" + nodeState );
// var keys = nodeState.keys().toString();
// var keyConvert = keys.replace(/^\[|\]$/g, '').split(/\s*,\s*/);

// for (var key in keyConvert) {
    
//     logger.error("xiaohan debug test point" + keyConvert[key] + " " + nodeState.get(keyConvert[key]));
// }

// var auditLib = require("KYID.2B1.Library.UserActivityAuditLogger")
// auditLib.auditLog("PRO001","Primary  Email Updated",nodeState, requestHeaders);
try {
    var Result = openidm.patch("managed/alpha_user/6fcf0c52-acd6-4799-9984-6cf42ab185cd", null, [{"operation":"replace","field":"sn","value":"Testttttttttt"}]);
    outcome = "true";
} catch (error) {
    logger.error("Exception Occured While Patching User"+error)
    outcome = "false";
}




