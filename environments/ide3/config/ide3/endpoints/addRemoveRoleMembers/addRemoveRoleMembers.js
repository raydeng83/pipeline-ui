(function () {
  
    var action = request.content.action;
    var requestId = request.content.requestId;
    var requestResponse = null;
    var failureReason = null;
    
    try {

   var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    requestResponse = requestObj.request
    var payload = {
      "roleId": requestResponse.common.roleId,
      "startDate": requestResponse.common.startDate,
      "endDate": requestResponse.common.endDate,
      "auditContext": {},
      "grantType": "request",
      "requestId": requestObj.id,
    };
    var queryParams = {
      "_action": action
    }

    var result = openidm.action('iga/governance/user/' + requestResponse.common.userId + '/roles' , 'POST', payload,queryParams);
  }
  catch (e) {
    var err = e.javaException; 
        err = JSON.parse(err.detail);
        var message = err && err.body ? err.body.response : e.message;
        failureReason = "Provisioning failed: Error provisioning role to user " + requestResponse.common.userId + " for role " + requestResponse.common.roleId + ". Error message: " + message;
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

  var queryParams1 = { '_action': 'update'};
  var UpdateStatus = openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams1);
  logger.info("Request " + requestId + " completed.");


if(failureReason){
  return {failureReason};
}
else{
  return {code: 1};
  
}

  }());



