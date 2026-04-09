var _ = require('lib/lodash');
function getException(e) {
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message;
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message;
  } else if (_.has(e, 'message')) {
    return e.message;
  } else {
    return e;
  }
}

(function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
     
        var body = {
  "common": {
    "userId": "565932f4-85c3-41a7-8720-c4721acfbcf5",
    "entitlementId": "system_kyexternalgov_Group_1fc3917e-73fa-4770-bfc6-6035c6238dc3"
  }
};
      
      // var body = {"common": {"userId": "0f9b0f07-cb44-4e24-b2d0-4c7df7d10f1a", "entitlementId": "system_kydevdevkygov_Group_ebf95870-70ca-452d-a40c-fd6712d5df35"}};
      var Response = openidm.action("iga/governance/requests/entitlementGrant", "POST", body);
        return {Response};
     //  catch (error) {
     //       var exceptionMessage = getException(error);
     //   return {error};
       
     // }
      
     
      // GET
     
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

function getEntitlementId (entitlementName) {
try {
var Response = openidm.query("managed/alpha_assignment",  { "_queryFilter" : '/name/ eq "'+entitlementName+'"'}, [""]);
logger.error("Entitlement Request Response Is ::" + Response)
// var entitlementId = Response.result[0]._id
return (Response)
    } catch (error) {
        logger.error("Error Occured ::" + error)
       return (-1)
    }
}