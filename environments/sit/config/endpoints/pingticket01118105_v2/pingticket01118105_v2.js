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
      //let id = "999bee8b-3a30-43fb-a074-b20784feb6e"
      let id="ef88bb41-71b7-4605-a06d-51cd95245a97"
//return openidm.query("managed/alpha_Dummy_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
//+ ' AND (recordState eq "ACTIVE" OR recordState eq "0")' + ' AND (_sortKeys eq "preRequisiteTypeId")' }, ["*"])

//return openidm.query("managed/alpha_Dummy_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
 //}, ["*"])

//return openidm.query("managed/alpha_Dummy_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
 //}, ["*"])

      return openidm.query("managed/alpha_Dummy_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + id + '"'
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