(function () {
  var objectType = request.objectType?request.objectType:"EnrollmentContext";
  var objectId = request.objectId?request.objectId:"63c416df-8c52-45c9-bf14-055e9c573b1d";
  if (request.method === "create") {
    // POST
    /*
    {
      "request": {
        "method": "create",
        "payload": {
          "id": "1000",
          "name": "EC Test 1000",
          "description": "EC Test 1000 description"
        }
      }
    }
    */
    try {
      //var result = openidm.create("managed/" + objectType, null, request.payload);
      var result = openidm.create("managed/" + objectType, null, {
        id: "1",
        name: "EC1",
        description: "EC1 description",
      });
    } catch (e) {}
    return result;
  } else if (request.method === "read") {
    // GET
    try {
      var result = openidm.read(
        "managed/" + objectType + "/" + objectId,
        null,
        ["*"]
      );
    } catch (e) {}
    return result;
  } else if (request.method === "query") {
    // GET
    // openidm.query("managed/realm-name_user", { "_queryFilter": "/userName sw \"user.1\""}, ["userName", "_id"]);
    var key = "name";
    var queryVal = "EC"

    try {
      var result = openidm.query(
        "managed/" + objectType,
        { "_queryFilter": "/" + key + " sw \"" + queryVal + "\""},
        ["*"]
      );
    } catch (e) {}
    return result;
  } else if (request.method === "update") {
    // PUT
    try {
      var object_read = openidm.read("managed/" + objectType + "/" + objectId);
      object_read["description"] = "The entry has been updated";
      var result = openidm.update(
        "managed/" + objectType + "/" + objectId,
        null,
        object_read
      );
    } catch (e) {}
    return result;
  } else if (request.method === "patch") {
    try {
      var result = openidm.patch(
        "managed/" + objectType + "/" + objectId,
        null,
        [{ operation: "replace", field: "/id", value: "2" }]
      );
    } catch (e) {}
    return result;
  } else if (request.method === "delete") {
    try {
      var result = openidm.delete(
        "managed/" + objectType + "/" + objectId,
        null
      );
    } catch (e) {}
    return result;
  }
  throw { code: 500, message: "Unknown error" };
})();