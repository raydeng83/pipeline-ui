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
      return getPolicyManagedObject();
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


function getPolicyManagedObject() {
  var policyRecords = null;
    try { 
        policyRecords = openidm.read("schema/managed/Alpha_Kyid_Policy");
        logger.error("Successfully retrieved policy schema custom object attributes");
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve policy schema custom object attributes, Exception: {}', exceptionMessage);
    }
    
    return policyRecords;
}

