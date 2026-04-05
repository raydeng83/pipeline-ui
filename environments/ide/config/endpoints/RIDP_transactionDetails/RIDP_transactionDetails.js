var response = null;
var requestedUserMail = null;
var message = null;
var errors = {};
var requestedUserId = null;
var requesterUserId = null;
var requesterUserMail = null;

(function () {

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
  
    if (request.method === 'create') {  
        const payload = request.content.payload;
        const view = payload && payload.view;
        const queryFilter = payload && payload.queryFilter;
        logger.info("Get RIDP Transaction Details API: Started");

        if (!payload) {
            return {
                data: [],
                errors: {
                    code: "ERR-RIDP-INP-000",
                    message: "Request cannot be empty"
                }
            };
        }

        if (!view) {
            return {
                data: [],
                errors: {
                    code: "ERR-RIDP-INP-001",
                    message: "View field cannot be empty"
                }
            };
        }

        if (view === "IdentityVerificationRequest") {
            if (queryFilter && queryFilter.userAccountId) {
                const userAccountId = queryFilter.userAccountId;
                let requestedUserId;

                // Simple regex to check if it's an email address
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (emailRegex.test(userAccountId)) {
                    // It's an email, get the user ID from email
                    requestedUserId = getUserID(userAccountId);
                } else {
                    // Assume it's already a user ID
                    requestedUserId = userAccountId;
                }

                response = getTransactionDetailsByResquestedUser(requestedUserId);
                return response;
            } else {
                return {
                    data: [],
                    errors: {
                        code: "ERR-RIDP-INP-003",
                        message: "userAccountId is required in queryFilter"
                    }
                };
            }
        } else {
            return {
                data: [],
                errors: {
                    code: "ERR-RIDP-INP-002",
                    message: "Invalid view field value"
                }
            };
        }
    } else if (request.method === 'read') {
        // POST
        return {code: 400, message: 'Method Not Allowed'};
    } else if (request.method === 'update') {
        // PUT
        return {code: 400, message: 'Method Not Allowed'};
    } else if (request.method === 'patch') {
        return {code: 400, message: 'Method Not Allowed'};
    } else if (request.method === 'delete') {
        return {code: 400, message: 'Method Not Allowed'};
    }
    throw { code: 500, message: 'Internal Server Error' };
}());

function getUserID(userMail){
    var userQueryResult = openidm.query("managed/alpha_user",{_queryFilter: 'mail eq "' + userMail + '"'},['*']); 
    return userQueryResult.result[0]._id
}

function getAction(status) {
    if (status === "0") {
        return { es: "Éxito", en: "Success" };
    } else {
        // Treat any non-"1" value as continue
        return { es: "Continuar", en: "Continue" };
    }
}

function formatDate(dateStr) {
    var date = new Date(dateStr);
    var day = ("0" + date.getUTCDate()).slice(-2);
    var month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    var year = date.getUTCFullYear();
    return {
        es: day + "/" + month + "/" + year, // DD/MM/YYYY
        en: month + "/" + day + "/" + year  // MM/DD/YYYY
    };
}

function status(status){
  if(status == "0"){
     return "Completed"
  }else if(status == "1"){
    return "Re-Verify"
  }else{
   return "Pending"
  }
}

function getproofingMethod(method){
   if(method == "1" || method == "4"){
     return "LexisNexis"
   }else if (method == "2"){
     return "CMS Experian"
   }else{
     return ""
   }
}

function lastname(request){
  if(request.userRequest && request.userRequest!=null){
    //let userReq = request.userRequest && request.userRequest!=null;
    let userReq = request.userRequest;
    if (typeof userReq === "string") {
        userReq = JSON.parse(userReq);
    }
    logger.error("request sn **** :: " + JSON.stringify(userReq));
    return userReq.sn;
  }else{
    return ""
  }
}

function dob(request){
  if(request.userRequest){
    let userReq = request.userRequest;
    if (typeof userReq === "string") {
        userReq = JSON.parse(userReq);
    }
    logger.error("request dob **** :: " + JSON.stringify(userReq));
    return userReq.dob;
  }else{
    return ""
  }
}

function getEnrollmentReqID(id){
  var userQueryResult = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites",{_queryFilter: '_id eq "' + id + '"'},['*']);
  if(userQueryResult.resultCount > 0){
    return userQueryResult.result[0].enrollmentRequestId || ""
  }
}

function getTransactionDetailsByResquestedUser(userId) {
    var userQueryResult = openidm.query(
        "managed/alpha_kyid_remote_identity_proofing_request",
        {_queryFilter: 'requestedUserId eq "' + userId + '"'},
        ['*']
    ); 
   // logger.error("userQueryResult is ::: => "+ JSON.stringify(userQueryResult))
    if (userQueryResult.resultCount > 0) {
        var data = userQueryResult.result.map(function(response) {
            return {
                ReferenceID: response.referenceId || "",
                userPrereqID:  (response.userPrerequisite) ? response.userPrerequisite : "",
                EnrollmentReqID: (response.userPrerequisite) ? getEnrollmentReqID(response.userPrerequisite) : "",
                //EnrollmentReqID: "9124dd0e-2147-4631-aef3-6457953dceff",
                ApplicationName: response.businessAppName || "",
                TransactionDate: formatDate(response.createDate) || "",
                TransactionID : response._id || "",
                Action: (response && response.status) ? getAction(response.status) : "",
                Source: (response && response.proofingMethod) ? getproofingMethod(response.proofingMethod) : "",
                Status: status(response.status),
                LastName: lastname(response),   
                dob: dob(response)
            };
        });
     logger.error("data is ::: => "+ JSON.stringify(data))
        return {
            data: data,
            errors: {}
        };
    } else {
        return {
            data: [],
            errors: {
                code: "ERR-RIDP-NOR-000",
                message: "No Records Found for given user ID" 
            }
        };
    }
}
 