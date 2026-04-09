  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // var body ={common:{}}

var body = JSON.stringify({
  "common": {
    "userId": "0f9b0f07-cb44-4e24-b2d0-4c7df7d10f1a",
    "entitlementId": "system_kydevdevkygov_Group_ebf95870-70ca-452d-a40c-fd6712d5df35"
  }
});
      
       // var body = {common.userId:"0f9b0f07-cb44-4e24-b2d0-4c7df7d10f1a",common.entitlementId:"system_kydevdevkygov_Group_ebf95870-70ca-452d-a40c-fd6712d5df35"} 
 // var Response = openidm.action("iga/governance/policy/"+policyId+"/scan?simulate=false&waitForCompletion=true", "POST", body,{simulate:false,waitForCompletion:true});
    var Response = openidm.action("iga/governance/requests/entitlementGrant", "POST", body,{});
      return {Response};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());