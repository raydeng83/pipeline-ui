var successMessage = nodeState.get("PingOneProtectEvaluationNode.RISK")
logger.error("successMessage in 2A Ping Protect : "+successMessage);

if (successMessage != null && successMessage) {
   riskLevel = successMessage.result.level 
    logger.error("successMessage in 2A Ping Protect Risk Level: "+riskLevel)
}
action.goTo("true")