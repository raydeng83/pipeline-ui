/**
 * Name: KYID.2B1.Library.PrerequisiteUtils
 * Description: This library script is used to perform patch operation on alpha_kyid_request object in IDM.
 * Function: patchRequest(<Parameters>)
 *           Parameters:
 *                   id         <String>        => Specifies the contextID
 *                   userID     <String>        => Specifies the IDM userID of the user
 *                   type       <JSON Object>   => Specifies the name of prerequisite type
 *                   dataObj    <JSON Object>   => Specifies the parameters that are passed to the _queryFilter
 *                  
 * Import Library:
 *                Example:
 *                        var prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
 * Invoke Library Function:
 *                Example:
 *                        prerequisiterecord.patchRequest(contextID,uuid,type,dataObj);  
 * Author: Deloitte
 **/

function patchRequest(id, userID, type, dataObj) {
    logger.error("Inside patchRequest");

    var recordRequest = null;
    var recordRequestJSONObj = {};
    var contentArray = [];
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");

    try {
        // Query the managed object using the provided parameters
        recordRequest = openidm.query(
            "managed/alpha_kyid_request",
            {
                _queryFilter:
                    'contextid eq "' +
                    id +
                    '"' +
                    'and type eq "' +
                    type +
                    '"' +
                    'and requester eq "' +
                    userID +
                    '"',
            },
            ["contextid", "type", "requester", "status"]
        );
        
        logger.error(
            "Successfully queried record in alpha_kyid_request managed object :: " +
            JSON.stringify(recordRequest)
        );

        if (recordRequest.result.length > 0) {
            recordRequestJSONObj = recordRequest.result[0];

            // Add the dataObj to the content array
            var keys = Object.keys(dataObj);
            for (var i = 0; i < keys.length; i++) {
                var field = keys[i];
                var value = dataObj[field];
                contentArray.push({
                    operation: "replace",
                    field: field,
                    value: value,
                });
            }
    
            // Perform the patch operation
            ops.crudOps(
                "patch",
                "alpha_kyid_request",
                contentArray,
                null,
                null,
                recordRequestJSONObj["_id"]
            );
            logger.error("Successfully Patched.");
            
        } else {
            logger.error("No records found for the given query.");
        }
        
    } catch (error) {
        logger.error(
            nodeConfig.timestamp +
            "::" +
            nodeConfig.node +
            "::" +
            nodeConfig.nodeName +
            "::" +
            nodeConfig.script +
            "::" +
            nodeConfig.scriptName +
            "::" +
            error
        );
    }
}

exports.patchRequest = patchRequest;
