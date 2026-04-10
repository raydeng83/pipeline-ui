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
  var code = -1;
  try {
    if(!request.content.username || request.content.username === null || request.content.username === '' ||
      !request.content.password || request.content.password === null || request.content.password === '') {
      return { code: code };
    }
    var ret = openidm.action(request.content.resource, 'authenticate', { username: request.content.username, password: request.content.password });
    return {code: 0}
  } catch (e) {
    var exceptionMessage = getException(e);
    logger.error('endpointScriptForAuthentication: exception: {}', exceptionMessage);
    if(exceptionMessage.includes("User must reset password")) {
      code = -2
    }
    else if (exceptionMessage.includes("Invalid credentials")){
      code = -3
    }
    else if(exceptionMessage.includes("Password expired")){
      code = -4
    }
    else if(exceptionMessage.includes("Account disabled")){
      code = -5
      //logger.error("Exception = "+e+" code = "+code)
    }
    logger.error('endpointScriptForAuthentication: exception: ' + e);
    return { code: code };
  }
})();
