logger.info("Auto-Provisioning");

var content = execution.getVariables();
var requestId = content.get('id');
var failureReason = null;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  logger.info("requestObj: " + requestObj);
}
catch (e) {
  failureReason = "Provisioning failed: Error reading request with id " + requestId;
}

if(!failureReason) {
  try {
    var request = requestObj.request;
    var payload = {
      "roleId": request.custom.roleId,
      "startDate": request.custom.startDate,
      "endDate": request.custom.endDate,
      "auditContext": {},
      "grantType": "request"
    };
    var queryParams = {
      "_action": "add"
    }

    var result = openidm.action('iga/governance/user/' + request.custom.userId + '/roles' , 'POST', payload,queryParams);
  }
  catch (e) {
    failureReason = "Provisioning failed: Error provisioning role to user " + request.custom.userId + " for role " + request.custom.roleId + ". Error message: " + e.message;
  }
  
  var decision = {'status': 'complete', 'decision': 'approved'};
  if (failureReason) {
    decision.outcome = 'not provisioned';
    decision.comment = failureReason;
    decision.failure = true;
  }
  else {
    decision.outcome = 'provisioned';
  }

  var queryParams = { '_action': 'update'};
  openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
  logger.info("Request " + requestId + " completed.");
}