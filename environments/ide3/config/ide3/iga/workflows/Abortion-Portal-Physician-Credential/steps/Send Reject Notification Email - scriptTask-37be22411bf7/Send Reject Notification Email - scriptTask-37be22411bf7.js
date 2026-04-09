logger.info("kyid-workflow send request rejection email");

var content = execution.getVariables();
var requestId = content.get('id');

// Read event user information from request object
try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;
  var  requestBody = {}
  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName
  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn
  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName 
  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   
  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail
  const now = new Date();
  const timestamp = epochToCustomDate(now)
  requestBody.timeStamp = timestamp.replace(" UTC", "");
  var body = {
    subject: "Request Rejected" ,
    to: requesterEmail,
    // body: "Request with ID " + requestId + " has been rejected.",
    templateName: "kyidRequestRejected",
    object: requestBody
  };
  openidm.action("external/email", "sendTemplate", body);
}
catch (e) {
  logger.info("Unable to send rejection notification email");
}
function epochToCustomDate(epoch) {
    let date = new Date(epoch);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}