const endPointName = "helpdeskContact";
 
 
(function(){
  /*
    const validateEndptRequestBody = {
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
    }
    */
   
    if(request.method == "create"){
       
        throw {
            code:"error.code",
            message:"Unspported method.",
            parameters:[]
        }
       
    }else if(request.method == "patch"){
         throw {
            code:"error.code",
            message:"Unspported method.",
            parameters:[]
        }
    }else if(request.method == "read"){
        var params = request && request.params ? request.params : {};
        logger.error("le-test-log, request: " + request);
        var jsonObject = JSON.parse(request);
        logger.error("le-test-log, jsonObject: " + JSON.stringify(jsonObject));
        var helpdeskContactId = jsonObject.additionalParameters.id;
        var helpdeskContactName = jsonObject.additionalParameters.name;

        if (helpdeskContactId != null) {
            return getHelpdeskContact(helpdeskContactId, 'id');
        } else if (helpdeskContactName != null) {
            return getHelpdeskContact(helpdeskContactName, 'name');
        } else {
            return "helpdeskcontact not found";
        }
       
    }else if(request.method == "delete"){
         throw {
            code:"error.code",
            message:"Unspported method.",
            parameters:[]
        }
    }
})();
 
function getHelpdeskContact (value, attribute) {
    try {

        if (attribute == 'id') {
            var response = openidm.query("managed/alpha_kyid_helpdeskcontact/", { "_queryFilter": '/_id/ eq "' + value + '"'}, []);
        } else if (attribute == 'name') {
            var response = openidm.query("managed/alpha_kyid_helpdeskcontact/", { "_queryFilter": '/name/ eq "' + value + '"'}, []);
        }

        logger.error("le-test-log " + response);

        if (response.resultCount > 0) {
            return response
        } else {
            return false
        }
    } catch (error) {
        throw { code: 500, message: error };
    }
}