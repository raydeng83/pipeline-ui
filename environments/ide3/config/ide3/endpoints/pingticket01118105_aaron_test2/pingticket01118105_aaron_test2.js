  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
      let id = "mo_test2_aaron1"
return openidm.query("managed/motest1/", { "_queryFilter": '/test_field/name eq "' + id + '"'}, ["*"])
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