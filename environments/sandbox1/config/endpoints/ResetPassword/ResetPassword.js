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

function generatePassword(length) {
    if (length < 8) {
        throw new Error('Password length must be at least 8 characters');
    }
 
    // Character sets
    var numbers = '0123456789';
    var lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    var upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var specialChars = '@';
 
    // Ensure at least one character from each set
    var allChars = numbers + lowerCase + upperCase + specialChars;
    var password = '';
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
 
    // Fill the rest of the password length with random characters
    for (var i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
 
    // Shuffle the password to ensure randomness
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    return password;
}

function delay(ms){
          logger.error("Inside Delay Function")
         var StartTime = Date.now();
         var timeDiff =  Date.now() - StartTime
         while ( Date.now() - StartTime < ms ){
          
         }
       }

(function () {
   try {
    var delayValue = identityServer.getProperty("esv.reset.password.delay")
    var randomKnownPass=generatePassword(8);
  var code = -1;
  if(request.content.TempPassword){
    randomKnownPass = request.content.TempPassword
     if(!request.content.resource|| request.content.resource === null || request.content.resource === '' ||
      !request.content.password || request.content.password === null || request.content.password === '') {
      return { code: code };
    }
    logger.error('PasswordResetIFPart');
    
    var ret2 = openidm.update(request.content.resource, null, {"__PASSWORD__": request.content.password, "__CURRENT_PASSWORD__": randomKnownPass});
    
  }
     else {
    logger.error('PasswordResetElsePart');
    if(!request.content.resource|| request.content.resource === null || request.content.resource === '' ||
      !request.content.password || request.content.password === null || request.content.password === '') {
      return { code: code };
    }
        //var ret1 = openidm.patch(request.content.resource, null, [{"operation":"replace", "field":"/__PASSWORD__", "value": request.content.password}]);
        var ret1 = openidm.update(request.content.resource, null, {"__PASSWORD__": request.content.password});
        logger.error('PasswordResetResponse:'+ret1);

    //      delay(delayValue); 
    // logger.error("Update user password in AD 1")
    // logger.error("Update user password: " + request.content.password)
    //     var ret2 = openidm.update(request.content.resource, null, {"__PASSWORD__": request.content.password, "__CURRENT_PASSWORD__": randomKnownPass});
    // logger.error("Updated user password in AD 2")     
     }
   
     return {code: 0}
  } catch (e) {
    var exceptionMessage = getException(e);
    logger.error('endpointScriptForResetPassword Error Messgae: {}', exceptionMessage);
    if(exceptionMessage.includes("New password does not comply with password policy")) {
      code = -2
    }
    if(exceptionMessage.includes("The value provided for the new password does not meet the length, complexity, or history requirements of the domain")) {
      code = -2
    }
    if(exceptionMessage.includes("Operation not supported")) {
      code = -2
    }
      logger.error('endpointScriptForResetPassword Exception: ' + e);
      logger.error('endpointScriptForResetPassword Exception With Stack: ' + e.stack);
    return { code: code };
  }
})();