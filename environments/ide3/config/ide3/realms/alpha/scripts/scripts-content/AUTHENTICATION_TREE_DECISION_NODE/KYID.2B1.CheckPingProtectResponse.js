/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("Entering CheckPingProtectResponse Script");

var evaluationResponse = nodeState.get("PingOneProtectEvaluationNode.RISK");
logger.debug("evaluationResponse : "+evaluationResponse);
logger.debug("country : "+evaluationResponse.details.country);
outcome = "true";
