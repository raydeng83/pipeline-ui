var _ = require('lib/lodash');
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");

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

   /*const validateEndptRequestBody = {
        "payload": context,
        "action": 0
    }
  
    try {
        let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
        logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
        if(res.status === 200){
          logger.error("Continue executing endpoint...")
        } else {
          return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }*/
  
   if(endpointExecution === "true"){
 if (request.method === 'read') {
      try {
      //var data = openidm.query("managed/alpha_kyid_systemmessages/", {"_queryFilter": "true"}, []);
      var data = openidm.query("managed/alpha_kyid_errormessages/", { "_queryFilter" : '/type eq "SystemMessage"'}, []);
      var SystemMessages = []
      var messageID = "";
      var messagetype = "";
        var message_title = "";
      var resultLenth = data.result.length;
      for (var i = 0; i < resultLenth; i++){
        SystemMessages.push({
        messageID: data.result[i].messageId,
        messagetype: data.result[i].messageType,
        message_Id: data.result[i]._id,
        message_content: data.result[i].messageContent,
        message_startTime: data.result[i].startTime,
        message_endTime: data.result[i].endTime
    });
      }
        
      } catch (error) {
         var exceptionMessage = getException(error);
        throw { code: 500, message: 'exceptionMessage' };
        
      }
 

   return {SystemMessages};
    } 
    throw { code: 500, message: 'Unknown error' };
   }
   else{
    throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }
  
}());