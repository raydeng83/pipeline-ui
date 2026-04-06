/**
* Name: KYID.2B1.Library.IDMobjCRUDops
* Description: This library script is used to perform CRUD (Create, Read, Query, Patch, Update and Delete) operations on IDM objects.
* Function: crudOps(<Parameters>)
*           Parameters: 
*                   operation    <String>        => Specifies which CRUD operation needs to be performed on IDM object from following - create, read, query, update, patch, delete 
*                   resourceName <String>        => Specifies the IDM resource object on which the query should be performed
*                   content      <JSON Object>   => Specifies the content of the object to be created or patched
*                   params       <JSON Object>   => Specifies the parameters that are passed to the _queryFilter 
*                   fields       <list>          => Specifies list of the fields that should be returned in the query result. The list of fields can include wild cards, such as *.
*                   resourceID   <String>        => Specifies the identifier of the object to be patched or updated or deleted.
* Import Library:  
*                Example: 
*                        var ops = require("KYID.2B1.Library.IDMobjCRUDops");
* Invoke Library Function:
*                         Examples: 
*                                 1) Create:
*                                           var createdUser = ops.crudOps("create","alpha_user", newUserJSONContent, null, null, null);
*
*                                 2) Query:
*                                           var queryUser = ops.crudOps("query", "alpha_user", null, "_id eq '"+id+ "'", ["firstname","lastname"], null);
*
*                                 3) Read:
*                                           var readUser = ops.crudOps("read","alpha_user", null, null, null, id);
*
*                                 4) Update:
*                                           var updatedUser = crudOps.crudOps("update", "alpha_user", updatedUserJSONContent, null, null, id);
* 
*                                 5) Patch:
*                                           var patchedUser = crudOps.crudOps("patch", "alpha_user", patchJSONContent, null, null, id);
*
*                                 6) Delete:
*                                           var deledUser = crudOps.crudOps("delete","alpha_user", null, null, null, id);
* Author: Deloitte
*/


//Global Variables
var result = null;
var resourceNamePrefix = "managed/";

function crudOps(operation,resourceName,content,params,fields,resourceID){
  
    try{  
        switch (operation.toLowerCase()) {
          case "create":
            result = openidm.create(resourceNamePrefix + resourceName, null, content);
            logger.error("Successfully created resource: " + JSON.stringify(result));
            break;
    
          case "query":
            var parsedParams = JSON.parse(JSON.stringify(params)); 
            paramsPrefix =  parsedParams["key"] + " " + parsedParams["ops"];
            paramsSuffix =  ' "' +parsedParams["value"]+'"';
            params =  paramsPrefix + paramsSuffix;
            logger.error("params: "+params);    
            var query = { _queryFilter: params};
            if (fields && Array.isArray(fields)) {
              query["_fields"] = fields.join(",");
            }
            logger.error("QUERY: " + JSON.stringify(query));
            result = openidm.query(resourceNamePrefix + resourceName, query);
            logger.error("Successfully queried resource: " + JSON.stringify(result));
            result = result || [];
            break;
    
          case "read":
            result = openidm.read(resourceNamePrefix + resourceName + "/" + resourceID);
            if (!result) {
              logger.error("Resource not found: " + resourceID);
            }
            logger.error("Successfully read resource: " + JSON.stringify(result));
            break;
    
          case "update":
            var existing = openidm.read(resourceNamePrefix + resourceName + "/" + resourceID);
            if (!existing) {
              throw new Error("Not found for Update: " + resourceID);
            }
            for (var key in data) {
              existing[key] = data[key];
            }
            result = openidm.update(
              resourceNamePrefix + resourceName + "/" + resourceID,
              null,
              existing
            );
            logger.error("Successfully updated resource: " + JSON.stringify(result));
            break;
    
          case "patch":
            if (!content || !Array.isArray(content)) {
              logger.error("Invalid patch operation provided");
            }
            result = openidm.patch(
              resourceNamePrefix + resourceName + "/" + resourceID,
              null,
              content
            );
            logger.info("Successfully patched resource: " + JSON.stringify(result));
            break;
    
          case "delete":
            var resourceUrl = resourceNamePrefix + resourceName + "/" + resourceID
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
          operation.toUpperCase() + " operation failed for " + resourceName,
          details: error.toString(),
    };
    logger.error("errorResponse" + JSON.stringify(errorResponse));
    return errorResponse;
  }
}

exports.crudOps = crudOps;
