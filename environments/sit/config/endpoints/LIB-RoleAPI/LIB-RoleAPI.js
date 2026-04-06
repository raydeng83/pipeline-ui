
//https://<PingHostURL>/openidm/endpoint/[FunctionName]API
//https://<PingHostURL>/openidm/endpoint/LIB-ExternalAPI

/**
 * @name [@endpointname]
 * @description [@description]
 * 
 * @param {request} request - This is the request object contains the following
 * resourceName - The name of the resource, without the endpoint/ prefix.
 * newResourceId - The identifier of the new object, available as the results of a create request.
 * revision - The revision of the object.
 * parameters - Any additional parameters provided in the request. The sample code returns request parameters from an HTTP GET with ?param=x, as "parameters":{"param":"x"}.
 * content - Content based on the latest revision of the object, using getObject.
 * context - The context of the request, including headers and security. For more information, refer to Request context chain.
 * Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. For more information refer to Page Query Results.
 * Query parameters - The queryId and queryFilter parameters are specific to query methods. For more information refer to Construct Queries.
 *
 * @date  [@date]
 * @author {<authorname>@deloitte.com}
 */
/**
 * action - create:{
 *      payload:{
 *          requestedUserAccountId:"1",
 *          enrollmentContextId:""
 *      },
 *      action:0
 * }
 */



const currentTimeinEpoch = Date.now();

var _ = require('lib/lodash');
var isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag");

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


// (function(){
    
//     const requestAction = request.content.action
//     const payLoad = request.content.payload
//     try{

//         if(request.method == "create"){       /* This is HTTP POST operation. */        // {requestedUserAccountId="", action="0-Search | X - customAction (e.g 9-getActiveEnrollments) "}
//             if(requestAction =="<actionname>"){
//                 return actionFunctionName(payLoad)
//             }else{
//                 return createFunctionName(payLoad)
//             }
//         }else if(request.method == "update"){ /* This is HTTP PUT operation. */
//             //Throw unsupported operation error.
//         }else if(request.method == "patch"){  /* This is HTTP PATCH operation. */
//             return updateFunctionName({})
//         }else if(request.method == "delete"){ /* This is HTTP DELETE operation. */
//             //Throw unsupported operation error.
//         }else if(request.method == "read"){   /* This is HTTP GET operation. */
//             return getFunctionName({})
//         }

//     }catch(error){
//         /* Returns error response. */
//         return {
//             "code": "", 
//             "message": "",
//             "params" : [""]
//         }
//     }
// })()

// /**
//  * @name <createFunctionName>
//  * @description <function description>
//  * 
//  * @param {JSON} paramJSON 
//  * @returns {JSON} Response JSON.
//  */
// function createFunctionName(paramJSON){
//     return {

//     }
// }

// /**
//  * @name <updateFunctionName>
//  * @description <function description>
//  * 
//  * @param {JSON} paramJSON 
//  * @returns {JSON} Response JSON.
//  */
// function updateFunctionName(paramJSON){
//     return {

//     }
// }

// /**
//  * @name <getFunctionName>
//  * @description <function description>
//  * 
//  * @param {JSON} paramJSON 
//  * @returns {JSON} Response JSON.
//  */
// function getFunctionName(paramJSON){
//     return {

//     }
// }

// /**
//  * @name <actionFunctionName>
//  * @description <function description>
//  * 
//  * @param {JSON} paramJSON 
//  * @returns {JSON} Response JSON.
//  */
// function actionFunctionName(paramJSON){
//     return {

//     }
// }






(function () {
    if (request.method === 'create') {
      // POST
      let response = {}
      var payload = request.content.payload;
      var userId = payload.userId;
      var roleId = payload.roleId;
      var appId = payload.appId;
      var action = request.content.action
      if(action !== null && action && action === "4"){
        response = getRoleDetails(action,roleId,userId,appId);
      }
      return response ;
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
    throw { code: 500, message: 'Unknown error' };
  }());

function getRoleDetails(action,roleId,userId,appId) {
  try {
    let roleMembers = [];
    let policyResponse = null;
    if (action ==="4" ){
      if(roleId !== null){
           const response = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id/ eq "' + roleId + '"'+' AND recordState eq "'+"ACTIVE"+'"'}, ["members/_id","*"]);
            logger.error("Get Role Details -- endpoint/LIB-RoleAPI "+response)
              if(response && response.resultCount > 0){

                return response
            }
            else{
              logger.error("Get Role Details -- endpoint/LIB-RoleAPI Record not found with Role ID ")
                return { code: 404, message: 'Record not with the Role ID ' };
            }

      
    }
      else{
        logger.error("Get Role Details -- endpoint/LIB-RoleAPI Record not found with ROle ID ")
         return { code: 404, message: 'Role ID is null' };
      }
        


}
       
  } catch (error) {
    logger.error("Get Role Details -- endpoint/LIB-RoleAPI Error Occurred  "+ error)
      return { code: 400, message: error.message + error };
    
  }
}




