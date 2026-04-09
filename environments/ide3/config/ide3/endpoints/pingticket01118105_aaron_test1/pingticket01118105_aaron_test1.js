  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
      let id = "1e5158af-0e2b-4359-b62d-8e2166fa5f74"
return openidm.query("managed/motest1/", { "_queryFilter": '/motest2Id/_refResourceId eq "' + id + '"'}, ["*"])
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