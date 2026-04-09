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
   if(endpointExecution === "true"){
 if (request.method === 'read') {
      try {
      var data = openidm.query("managed/alpha_kyid_myaccount/", {"_queryFilter": "true"}, []);
      var myAccount = []
      var name = "";
      var uri = "";
      var icon = "";
      var content = "";

      var resultLenth = data.result.length;
      for (var i = 0; i < resultLenth; i++){
        myAccount.push({
        name: data.result[i].name,
        uri: data.result[i].uri,
        icon: data.result[i].icon,
        content: data.result[i].localizedContent[0].content
    });
      }
        
      } catch (error) {
         var exceptionMessage = getException(error);
        throw { code: 500, message: 'exceptionMessage' };
        
      }
 

   return {myAccount};
    } 
    throw { code: 500, message: 'Unknown error' };
   }
   else{
    throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }
  
}());

  