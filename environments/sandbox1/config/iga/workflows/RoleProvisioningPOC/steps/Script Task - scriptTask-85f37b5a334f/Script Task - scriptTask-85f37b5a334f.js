var content = execution.getVariables();
logger.error("Naren Logs Get Variables ::"+ content)
var requestId = content.get('id');
logger.error("Naren Workflow Logs:: requestId: " + requestId);
var context = null;
var lineItemId = false;


try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  var request = requestObj.request;
  logger.error("Naren Logs Getting Form Details"+requestObj)
   // var userEmail= request.custom.mail;
    // var Form_roleId= request.custom.role;
    // var justification =request.custom.justification;
    // var JustificatinJson = JSON.parse(justification);
    // logger.error("Naren Logs JSON.parse :"+ JustificatinJson)

    
}
catch (e) {
  failureReason = 'Validation failed: Error reading request with id ' + requestId;
}
// logger.error("Naren Workflow Logs:: Form Details: User Email is:  " + userEmail);
// logger.error("Naren Workflow Logs:: Form Details: Role ID is:  " + Form_roleId);
// logger.error("Naren Workflow Logs:: Form Details: justification is:  " + justification);
// logger.error("Naren Workflow Logs:: Json Name is: "+ JustificatinJson.name)

// var params = {
//     '_queryFilter' : 'mail eq "' + userEmail + '"'
// };
// var userResponse = openidm.query("managed/alpha_user", params, ["userName", "_id"]);

// var userResponse = openidm.query("managed/alpha_user", { "_queryFilter": 'mail eq "' + userEmail}, ["userName", "_id","mail"]);
// var userResponse = openidm.query("managed/alpha_user", { "_queryFilter": "mail eq" +userEmail}, ["userName", "_id"]);
// var userId= userResponse.result[0]._id
var userId =request.custom.userId;
// logger.error("Workflow userResponse is ::"+ userResponse)
logger.error("Workflow User ID  is :" +userId )

// var roleId = Form_roleId.split("role/")[1];
var roleId =request.custom.roleId;
logger.error("Role ID is :: "+ roleId)

var queryParams = {
  "_action": "update"
}
  var update = {
      "request.custom.userId": userId,
      "request.custom.roleId": roleId
  }
 var update_resposne =  openidm.action('iga/governance/requests/' + requestId, 'POST', update, queryParams);
logger.error("Naren Logs :: Response After After is :: "+ update_resposne)
var requestObj1 = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
logger.error("Naren Logs :: Response After After is :: "+ requestObj1)




// execution.setVariable("userEmail", userEmail);
execution.setVariable("userId", userId);
// execution.setVariable("Form_roleId", Form_roleId);
execution.setVariable("roleId", roleId);
// execution.setVariable("justification", justification);
