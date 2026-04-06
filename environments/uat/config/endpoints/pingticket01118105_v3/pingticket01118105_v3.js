  (function () {

     logger.error("Starting pingticket_v2");
    if (request.method === 'create') {
       logger.error("Inside Create of pingticket_v2");
      return {};
    } else if (request.method === 'read') {
      // GET
   //   let id = "7f7de1fc-5b00-4f1f-957a-868a3f5365f7"
      logger.error("Inside read of pingticket_v2");
         //let id = "28935f53-96fe-46a9-9e5d-1e2d7c7739c6"
      let id = "d6996ebf-baa3-45f7-ac19-6330c1ef75d4"
return openidm.query("managed/alpha_kyid_access/", { "_queryFilter": '/user/_refResourceId eq "' + id + '"'
}, ["*"])
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