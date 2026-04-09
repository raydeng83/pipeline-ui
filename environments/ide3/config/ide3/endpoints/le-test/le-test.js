  (function() {
      if (request.method === 'create') {
          // POST
          return test()
      } else if (request.method === 'read') {
          // GET
          return {};
      } else if (request.method === 'update') {
          // PUT
          return {};
      } else if (request.method === 'patch') {
          return {};
      } else if (request.method === 'delete') {
          return invokeKOGAPIRoleRemoval()
      }
      throw {
          code: 500,
          message: 'Unknown error'
      };
  }());

  function test() {
//       var removeRoleOperation = [
//       {
//           "operation": "remove",
//           "field": "/roles",
//           "value": {
//             "_ref": "managed/alpha_role/06d16d89-4b3e-4054-9d5e-b035b78c1f49",
//             "_refResourceCollection": "managed/alpha_role",
//             "_refResourceId": "06d16d89-4b3e-4054-9d5e-b035b78c1f49",
//             "_refProperties": {
//                 "_id": "3e6b0822-f9b7-408b-ad9a-881214d783ef-1596186",
//                 "_rev": "3e6b0822-f9b7-408b-ad9a-881214d783ef-1596187"
//             }
//           }
//       }
//         ,
//       {
//           "operation": "remove",
//           "field": "/roles",
//           "value": {
//             "_ref": "managed/alpha_role/06d16d89-4b3e-4054-9d5e-b035b78c1f4a",
//             "_refResourceCollection": "managed/alpha_role",
//             "_refResourceId": "06d16d89-4b3e-4054-9d5e-b035b78c1f4a",
//             "_refProperties": {
//                 "_id": "3e6b0822-f9b7-408b-ad9a-881214d783ef-1596186",
//                 "_rev": "3e6b0822-f9b7-408b-ad9a-881214d783ef-1596187"
//             }
//           }
//       }
//     ]
// logger.error("le-test removeRoleOperation:" + JSON.stringify(removeRoleOperation))
//     var removeResponse = openidm.patch("managed/alpha_user/a1b4a741-492c-4808-9e96-6cbeebf883a7", null, removeRoleOperation, null, ["*", "roles/*"])
//     logger.error("le-test removeResponse:" + removeResponse)

//     return removeResponse

    // var response = openidm.query("managed/alpha_role/d18e690c-8d79-4ccd-bf2c-5286301b983d/members",
    //     { "_queryFilter": '_refResourceId eq "e4662d79-f615-49f6-aff3-00ab9ef052b7"' }, ["*"]);

    // return {"exists":response.result.length >0 }

    var response = openidm.query("managed/alpha_user/e4662d79-f615-49f6-aff3-00ab9ef052b7/roles",
        { "_queryFilter": '_refResourceId eq "d18e690c-8d79-4ccd-bf2c-5286301b983d"' }, ["*"]);
    return response
  }