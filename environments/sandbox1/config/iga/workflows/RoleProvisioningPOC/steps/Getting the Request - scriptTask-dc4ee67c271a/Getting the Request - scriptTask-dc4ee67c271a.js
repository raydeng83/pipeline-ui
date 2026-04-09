var content = execution.getVariables();
logger.error("Naren Logs Get Variables ::"+ content)
var requestId = content.get('id');
logger.error("Naren Workflow Logs:: requestId: " + requestId);
var context = null;
var lineItemId = false;
try {

  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
   


    
 
    
    logger.error("Naren Workflow Logs:: requestObj: " + requestObj);
  
  if (requestObj.request.common.context) {
    context = requestObj.request.common.context.type;
    var userID= requestObj.request.common.userId;
    var RoleID= requestObj.request.common.roleId;
   lineItemId = requestObj.request.common.context.lineItemId;
    if (context == 'admin') {
      skipApproval = true;
    }
  }
}
catch (e) {
  logger.error("Request Context Check failed "+e.message);
}

    
var common = {'userId': '421e79eb-8052-4691-a38b-748160b25b62', 'roleId': 'b07be8ce-2015-4cb9-b370-5bcfbb64a6bf'};
var queryParams = { '_action': 'update'};
var response = openidm.action('iga/governance/requests/' + requestId, 'POST', common, queryParams);
logger.error("Naren workflow logs: Common POST "+response)

// https://sso.dev.kyid.ky.gov/iga/governance/requestFormAssignments
//https://sso.dev.kyid.ky.gov/iga/governance/requestForms/81b9de2b-f742-4a0c-a681-7cf0bca44f9a

 
 logger.error("Naren Workflow Logs:: Context: " + context);
logger.error("Naren Workflow Logs:: userID: " + userID);
logger.error("Naren Workflow Logs:: RoleID: " + RoleID);
execution.setVariable("context", context);

execution.setVariable("lineItemId", lineItemId);
