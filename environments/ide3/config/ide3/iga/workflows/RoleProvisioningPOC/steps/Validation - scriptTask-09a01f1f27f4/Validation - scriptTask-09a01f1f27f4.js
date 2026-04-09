logger.error("Running role grant request validation");

var content = execution.getVariables();
logger.error("All Content Varianles are :: "+content )
var requestId = content.get('id');
var roleId = content.get('roleId');
logger.error("roleId is ::"+ roleId)
var userId =content.get('userId');
logger.error("userId is ::"+ userId)
var failureReason = null;
var role = null;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  // roleId = requestObj.role.id;
  logger.error("Naren workflow logs :: roleId is "+ roleId)
}
catch (e) {
  failureReason = "Validation failed: Error reading request with id " + requestId;
}

// Validation 1 - Check role exists
if (!failureReason) {
  try {
    role = openidm.read('managed/alpha_role/' + roleId);
      logger.error("Naren workflow logs :: role is "+ role)
    if (!role) {
      failureReason = "Validation failed: Cannot find role with id " + roleId;
    }
  }
  catch (e) {
    failureReason = "Validation failed: Error reading role with id " + roleId + ". Error message: " + e.message;
  }
}

if (failureReason) {
  logger.info("Validation failed: " + failureReason);
}
execution.setVariable("failureReason", failureReason); 