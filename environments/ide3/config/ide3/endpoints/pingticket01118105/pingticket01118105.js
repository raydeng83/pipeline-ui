  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
      let id = "56e9bc10-5306-4475-b44a-dacf25719487"
return openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
+ ' AND (recordState eq "ACTIVE" OR recordState eq "0") '}, ["*"])
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