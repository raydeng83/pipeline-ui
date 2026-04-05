  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
   //   let id = "7f7de1fc-5b00-4f1f-957a-868a3f5365f7"
         let id = "a6a8ce7a-1102-4b65-99f3-d9544671a0ce"
return openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
+ ' AND (recordState eq "ACTIVE" OR recordState eq "0")' }, ["*"])
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