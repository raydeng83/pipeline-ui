/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


var logPrefix = "debug-state-dump-script:: ";

logger.error(logPrefix + "requestCookies::" + requestCookies);
logger.error(logPrefix + "requestHeaders::" + requestHeaders);
logger.error(logPrefix + "requestParameters::" + requestParameters);
logger.error(logPrefix + "resumedFromSuspend::" + resumedFromSuspend);

outcome = "true";
