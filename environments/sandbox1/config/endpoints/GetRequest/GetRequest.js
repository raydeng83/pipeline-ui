
(function () {
    if (request.method === "read") {
        // Get the current time in milliseconds since the Unix epoch
  // or let params = {};
   
// Corrected openidm.action call
var user_id = "565932f4-85c3-41a7-8720-c4721acfbcf5";
var entitlemet  = "";
var test ;
var array = [];
var response = openidm.read("managed/alpha_user/"+ user_id);
var test = response.result.length;
        return(test)

  

// for(var i = 0; i < response.result.length; i++){
// entitlemet = response.result[i].effectiveAssignments.name;
// array.push(entitlemet )
// }
//  test= array;



// var operand = [];
// operand.push({operator: "EQUALS", operand: { targetName: "role.id", targetValue: "60804339-10e0-4d71-8657-3d578a4daefc" }})
// operand.push({operator: "EQUALS", operand: { targetName: "decision.status", targetValue: "in-progress" }})

// var body = { targetFilter: {operator: "AND", operand: operand}};
// var queryParams = {
//   "_action": "search"
// };
//   // var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
      // https://sso.dev.kyid.ky.gov/iga/governance/user/ef034858-2fa0-4c39-b02b-76a986e061fa/requests?_action=search
//       var jsonResponse = new Object();  // or let params = {};
// params.request = {}; // Initialize params.request
// params.request.custom = {}; // Initialize params.request.custom
// params.request.custom.roleId = "managed/user/ef034858-2fa0-4c39-b02b-76a986e061fa";
// params.request.custom.mail = "DEVTestUser02@mailinator.com";
      
// var jsonResponse = openidm.action('iga/governance/user/ef034858-2fa0-4c39-b02b-76a986e061fa/requests', 'POST', operand, queryParams);
// const inProgressRequests = jsonResponse.result.filter(request => request.decision.status === 'complete');

// Log the result to console

      // /governance/user/{userId}/requests?_action=search

    } else {
        // If the request method is not supported, throw an error
        throw {
            code: 405,
            message: "Method not allowed"
        };
    }
})();



 
