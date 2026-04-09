/**
 * Function:
 *        nodeLogger(level,message)
 * Description:
 * Returns:
 * Date: 6th September 2024
 * Author: Deloitte
 */

/**
* var ops = require("KYID.Library.CRUDFunctions"); //Importing the library
* 
* Create:
* var createdUser = ops.crudOps("create","managed/alpha_user",newUser, null, null, null);
*
* Query
* var queryUser = ops.crudOps("query", "managed/Alpha_Kyid_PrerequisiteType", null, "_id eq '"+id+ "'",  ["_id", "name", "isSave"], null, null);
*
* Read
* var readUser = ops.crudOps("read","managed/alpha_user", null, null, null, userName);
*
* Update
* var updatedUser = crudOps.crudOps("update","managed/alpha_user",updatedUserData, null, null, userName);
* 
* Patch
* var patchedUser = crudOps.crudOps("patch","managed/alpha_user", null, null, null, userName, pathOps);
*
* Delete
* var deledUser = crudOps.crudOps("delete","managed/alpha_user", null, null, null, userName, null);
*/ 



// //DEBUG Logging Function
// function debug(message){
//     logger.debug(message);
// }

// //WARN Logging Function
// function warn(message){
//     logger.warn(message);
// }

// //ERROR Logging Function
// function error(message){
//     logger.error(message);
// }

function crudOps(
  operation,
  resourcePath,
  data,
  _queryFilter,
  fields,
  resourceId,
  patchOperation
) {
  try {
    var result;
    switch (operation) {
      case "create":
        result = openidm.create(resourcePath, null, data);
        logger.info("Successfully create resource: " + JSON.stringify(result));
        break;

      case "query":
        var query = { _queryFilter: _queryFilter };
        if (fields && Array.isArray(fields)) {
          query["_fields"] = fields.join(",");
        }
        logger.error("QUERY: " + JSON.stringify(query));
        result = openidm.query(resourcePath, query);
        logger.info("Successfully queried resource: " + JSON.stringify(result));
        result = result || [];
        break;

      case "read":
        result = openidm.read(resourcePath + "/" + resourceId);
        if (!result) {
          logger.error("Resource not found: " + resourceId);
        }
        logger.info("Successfully read resource: " + JSON.stringify(result));
        break;

      case "update":
        var existing = openidm.read(resourcePath + "/" + resourceId);
        if (!existing) {
          throw new Error("Not found for Update: " + resourceId);
        }
        for (var key in data) {
          existing[key] = data[key];
        }
        result = openidm.update(
          resourcePath + "/" + resourceId,
          null,
          existing
        );
        logger.info("Successfully updated resource: " + JSON.stringify(result));
        break;

      case "patch":
        if (!patchOperation || !Array.isArray(patchOperation)) {
          logger.error("Invalid patch operation provided");
        }
        result = openidm.patch(
          resourcePath + "/" + resourceId,
          null,
          patchOperation
        );
        logger.info("Successfully patched resource: " + JSON.stringify(result));
        break;

      case "delete":
        var resourceUrl = resourcePath + "/" + resourceId
        result = openidm.delete(resourceUrl, null);
        logger.info("Successfully create resource: " + JSON.stringify(result));
        result = { success: true, message: "Deleted Successfully" };
        break;

      default:
        throw new Error("Invalid action" + operation);
    }
    return result;
  } catch (error) {
    var errorResponse = {
      code: "ERR00XXXX",
      reason: "Operation Failed",
      errorMessage:
        operation.toUpperCase() + " operation failed for " + resourcePath,
      details: error.toString(),
    };
    logger.error("errorResponse" + JSON.stringify(errorResponse));
    return errorResponse;
  }
}

exports.crudOps = crudOps;
