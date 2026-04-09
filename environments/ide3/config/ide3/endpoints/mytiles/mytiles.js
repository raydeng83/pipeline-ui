(function() {
  
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
        // POST
        const payload = request.content.payload
        const action = request.content.action
        const view = payload.view;

        if (action === 4) {
            if (view && view != null) {
                if (view == "Tiles") {
                    try {
                        logger.error("mytiles 1");
                        var input = {
                            //"transactionId":request.content.transactionId,
                            "transactionId": "1",
                            "endPoint": "mytiles",
                            "object": "managed/myaccount/",
                            "payload": payload
                        }
                        logger.error("mytiles 2");
                        return getTiles(input);
                    } catch (error) {
                        throw error
                    }
                } else if (view == "ShowDelegable") {
                    var input = {
                        "transactionId": request.content.transactionId,
                        "userAccountId": payload.userAccountId
                    }
                    return checkShowDelegable(input);
                }
            }
        }
    } else if (request.method === 'read') {
        // GET
        return {};
    } else if (request.method === 'update') {
        // PUT
        return {};
    } else if (request.method === 'patch') {
        return {};
    } else if (request.method === 'delete') {
        return {};
    }
    throw {
        code: 500,
        message: 'Unknown error'
    }
}());

function getTiles(input) {
    try {
        logger.error("mytiles 3");
        if (input.payload) {
            var queryFilter = input.payload.queryFilter;
            var sortKeys = "order";

            // Build query parameters
            var queryParams = {
                "_queryFilter": queryFilter
            };
            
            // If sorting is requested, add it to the query
            if (sortKeys) {
                queryParams["_sortKeys"] = sortKeys;
            }
          
            let tileResponse = openidm.query("managed/alpha_kyid_myaccount", queryParams);
            if (tileResponse) {
                let returnPayload = {
                    "transactionId": input.transactionId,
                    "message": {
                        "code": "0",
                        "content": "Success"
                    },
                    "payload": {
                        "data": tileResponse.result
                    }
                }
                return returnPayload;
            } else {
                return null
            }
        }
    } catch (error) {
        throw error
    }
}

function checkShowDelegable(input) {
    var showDelegable = false;
    let query = ` userIdentifier eq '${input.userAccountId}' AND recordState eq '0' `
   logger.error("checkShowDelegable query is --> "+query)
      var userAccessList = openidm.query("managed/alpha_kyid_access", {
        "_queryFilter": query
    }, ["*","role/*"])

    userAccessList.result.forEach(access=>{
      if(access.role){
      var isDelegated = !!access.originalDelegatorIdentifier
      var roleIsDelegable = access.role.isDelegable
      var roleIsForwardDelegable = access.role.isForwardDelegable
      var accessIsForwardDelegable = access.isForwardDelegable

      logger.error("mytiles Role Name - "+access.role.name)
      logger.error("mytiles isDelegated="+isDelegated+" roleIsDelegable="+roleIsDelegable+" roleIsForwardDelegable="+roleIsForwardDelegable+" accessIsForwardDelegable="+accessIsForwardDelegable)

      if (!isDelegated && roleIsDelegable) {
        // Original owner with delegable role → can delegate
        showDelegable = true
        return
      }
      if (isDelegated && roleIsDelegable && roleIsForwardDelegable && accessIsForwardDelegable) {
        // Delegated role with forward delegation permission → can forward delegate
        showDelegable = true
        return
      }

      }

    })

    let returnPayload = {
        "transactionId": input.transactionId,
        "message": {
            "code": "0",
            "content": "Success"
        },
        "payload": {
            "data": {
                "showDelegable": showDelegable
            }
        }
    }
    return returnPayload;
}



// function getTiles(input) {
//     try {
//         logger.error("mytiles 3");
//         if (input.payload) {
//             var queryFilter = input.payload.queryFilter;
//             var sortKeys = "order";

//             // Build query parameters
//             var queryParams = {
//                 "_queryFilter": queryFilter
//             };
            
//             // If sorting is requested, add it to the query
//             if (sortKeys) {
//                 queryParams["_sortKeys"] = sortKeys;
//             }
          
//             let tileResponse = openidm.query("managed/alpha_kyid_myaccount", queryParams);
//             if (tileResponse) {
//                 let returnPayload = {
//                     "transactionId": input.transactionId,
//                     "message": {
//                         "code": "0",
//                         "content": "Success"
//                     },
//                     "payload": {
//                         "data": tileResponse.result
//                     }
//                 }
//                 return returnPayload;
//             } else {
//                 logger.error("mytiles - tileResponse is null - transactionID" + input.transactionId);
//                 return {
//                     "responseCode": 2,
//                     "transactionId": input.transactionId,
//                     "message": {
//                         "code": "2",
//                         "content": "Unable to retrieve tiles. Please try again later. REF-001"
//                     }
//                 }
//             }
//         } else {
//             logger.error("mytiles - payload is missing - transactionID" + input.transactionId);
//             return {
//                 "responseCode": 2,
//                 "transactionId": input.transactionId,
//                 "message": {
//                     "code": "2",
//                     "content": "Invalid request payload. REF-002"
//                 }
//             }
//         }
//     } catch (error) {
//         logger.error("mytiles - Exception in getTiles: " + JSON.stringify(error) + " - transactionID" + input.transactionId);
//         return {
//             "responseCode": 2,
//             "transactionId": input.transactionId,
//             "message": {
//                 "code": "2",
//                 "content": "An unexpected error occurred. Please try again later. REF-003"
//             }
//         }
//     }
// }

// function checkShowDelegable(input) {
//     try{
//         var showDelegable = false;
//         let query = ` userIdentifier eq '${input.userAccountId}' AND recordState eq '0' `
//         // var userAccessList = openidm.query("managed/alpha_kyid_access", {
//         //     "_queryFilter": '/user/_refResourceId eq "' + input.userAccountId + '"'
//         // }, ["*", "role/*"]).result
//         logger.error("query is --> "+query)
//         var userAccessList = openidm.query("managed/alpha_kyid_access", {
//             "_queryFilter": query
//         }, ["*","role/*"])
//         // logger.error("userAccessList is -->  "+ userAccessList)
    
//         userAccessList.result.forEach(access=>{
//         if(access.role){
//             logger.error("mytiles Role Name - "+access.role.name)
//             logger.error("mytiles Role isDelegable - "+access.role.isDelegable)
//             if(access.role.isDelegable){
//                 showDelegable = true
//                 return
//             } 
//         }
//         })

//         let returnPayload = {
//             "responseCode": 0,
//             "transactionId": input.transactionId,
//             "message": {
//                 "code": "0",
//                 "content": "Success"
//             },
//             "payload": {
//                 "data": {
//                     "showDelegable": showDelegable
//                 }
//             }
//         }
//         return returnPayload;
//     } catch(error){
//         logger.error("mytiles - Exception in checkShowDelegable: " + JSON.stringify(error) + " - transactionID" + input.transactionId);
//         return {
//             "responseCode": 2,
//             "transactionId": input.transactionId,
//             "message": {
//                 "code": "2",
//                 "content": "An unexpected error occurred when checking delegable status. Please try again later. REF-004"
//             }
//         }
//     }
// }