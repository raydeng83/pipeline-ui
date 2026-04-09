/*
Script nodes are used to invoke APIs or execute business logic.
You can invoke governance APIs or IDM APIs.
See https://backstage.forgerock.com/docs/idcloud/latest/identity-governance/administration/workflow-configure.html for more details.

Script nodes should return a single value and should have the
logic enclosed in a try-catch block.

Example:
try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  applicationId = requestObj.application.id;
}
catch (e) {
  failureReason = 'Validation failed: Error reading request with id ' + requestId;
}
*/

try {
var params = {
    "url": "https://mocki.io/v1/09f0c1de-1c88-45b6-81ab-b20e4dc315e6",
    "method": "GET"
};

// // Adding the headers
// params.headers = {
//     "Authorization": "Bearer <token>",
//     "Content-Type": "application/json",
//     "Accept-API-Version": "resource=1.0"
// };

  var response = openidm.action("external/rest", "call", params);
    logger.error("Naren workflow logs:- Response is"+ response)

}
catch (e) {
  logger.error("Nren workflow LogsExection Occureed "+ e)
}

