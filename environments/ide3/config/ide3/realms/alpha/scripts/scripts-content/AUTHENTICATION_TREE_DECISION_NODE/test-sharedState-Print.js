/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

logger.error("xiaohan debug test point start");
logger.error("xiaohan debug test point" + nodeState );
var keys = nodeState.keys().toString();
var keyConvert = keys.replace(/^\[|\]$/g, '').split(/\s*,\s*/);

for (var key in keyConvert) {
    
    logger.error("xiaohan debug test point" + keyConvert[key] + " " + nodeState.get(keyConvert[key]));
}

outcome = "true";

