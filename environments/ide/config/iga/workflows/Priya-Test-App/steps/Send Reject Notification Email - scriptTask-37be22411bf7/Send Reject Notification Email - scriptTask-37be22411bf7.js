logger.error("kyid-workflow send request rejection email");

var content = execution.getVariables();
var requestId = content.get('id');

// Read event user information from request object
try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;
  var body = {
    subject: "Request Rejected" ,
    to: requesterEmail,
    // body: "Request with ID " + requestId + " has been rejected.",
    templateName: "kyidRequestRejected",
    object: {}
  };
  // if (userObj && userObj.manager && userObj.manager.mail) {
  //   body.cc = userObj.manager.mail
  // };
  logger.error("email body: " + JSON.stringify(body))
  let sendEmailResult = openidm.action("external/email", "sendTemplate", body);
  logger.error("send reject email result: " + sendEmailResult)
}
catch (e) {
  logger.info("Unable to send rejection notification email");
}