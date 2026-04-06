/**
 * PAIC IDM Custom Endpoint: Update all alpha_role objects description and revert the changes to trigger on-update script and assign the tags to role based on the attributes value
 * Supports only Get Request with request parameters pagedResultsCookie and pageSize, due to the service account access token life is not enoguh to do all updates in one request, postman collection runner can be used to do a loop run.
 * 
 * Endpoint Path: /openidm/endpoint/role_update_onetime
 * 
 * 
 * Example cURL Commands:
 * 
 * 1. Standard Mode - Analyze (default):
 * curl -X GET https://your-tenant.forgeblocks.com/openidm/endpoint/role_update_onetime?pagedResultsCookie={{pagedResultsCookie}}&pageSize=100 \
 *   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"action": "analyze", "debug": true}'
 */

var dateTime = new Date().toISOString();

var nodeConfig = {
    begin: "Beginning Node Execution",
    endpointName: "endpoint/role_update_onetime",
    timestamp: dateTime,
    end: "Node Execution Completed"
};



(function() {
    logger.error(nodeConfig.begin + "::" + nodeConfig.endpointName + "::" + nodeConfig.timestamp)

    let params = request.additionalParameters;
    let pageSize = request.additionalParameters.pageSize || 200;

    try {

        if (request.method == "read") {
            /* This is HTTP POST operation. */

            return updateRoleDescription(pageSize, params.pagedResultsCookie);
        } else if (request.method == "update") {
            /* This is HTTP PUT operation. */
            //Throw unsupported operation error.
            throw {
                code: 400,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "patch") {
            /* This is HTTP PATCH operation. */
            //Throw unsupported operation error.
            throw {
                code: 400,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "delete") {
            /* This is HTTP DELETE operation. */
            //Throw unsupported operation error.
            throw {
                code: 400,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "create") {
            /* This is HTTP GET operation. */
            //Throw unsupported operation error.
            throw {
                code: 400,
                message: "Unsupported operation: " + request.method
            };
        }

    } catch (error) {

        if (error) {
            /* generate error response */
            return generateResponse(error.type, input.transactionId, error.message)
        } else {
            return generateResponse(500, input.transactionId, "Internal Server Error")
        }
    }
})()



function updateRoleDescription(pageSize, pagedResultsCookie) {
    try {

        logger.error(nodeConfig.endpointName + "::" + "role description update function start")
        let response = {};
        let roles = [];
        let successCount = 0;
        var failedUpdates = [];
        let queryParams = [];
        if (pagedResultsCookie) {

            queryParams = {
                "_queryFilter": "true",
                "_pageSize": parseInt(pageSize),
                "_pagedResultsCookie": pagedResultsCookie
            };

        } else {

            queryParams = {
                "_queryFilter": "true",
                "_pageSize": parseInt(pageSize)
            };
        }

        response = openidm.query("managed/alpha_role", queryParams, ["_id", "description", "name"]);

        roles = response.result;
        if (response.pagedResultsCookie) {
            pagedResultsCookie = response.pagedResultsCookie
        } else {
            pagedResultsCookie = null
        }


        // roles = openidm.query("managed/alpha_role", {
        //     "_queryFilter": "_id eq \"1b293081-8ea7-40f9-b7f5-bfeaa99025d1\"",
        // }, ["_id","description"]).result;

        // let originalDescription = roles[0].description;
        // let updatedDescription = roles[0].description + " "

        let updatedDescription = "";

        for (let i = 0; i < roles.length; i++) {
            try {
                if (roles[i].description) {

                    updatedDescription = roles[i].description + " ";

                    //update role description with space to trigger on-update script
                    openidm.patch("managed/alpha_role/" + roles[i]._id, null,
                        [{
                            "operation": "replace",
                            "field": "description",
                            "value": updatedDescription
                        }]);

                    //revert changes
                    openidm.patch("managed/alpha_role/" + roles[i]._id, null,
                        [{
                            "operation": "replace",
                            "field": "description",
                            "value": roles[i].description
                        }]);

                } else {

                    updatedDescription = "";

                    openidm.patch("managed/alpha_role/" + roles[i]._id, null,
                        [{
                            "operation": "replace",
                            "field": "description",
                            "value": updatedDescription
                        }]);

                }


                successCount++;

            } catch (error) {

                logger.error(nodeConfig.endpointName + "::Failed to patch role " + roles[i]._id + ": " + error.message);
                failedUpdates.push({
                    _id: roles[i]._id,
                    displayName: roles[i].name,
                    error: error.message
                });
            }


        }

        return {
            rolesCount: roles.length,
            successfulUpdates: successCount,
            failureUpdates: failedUpdates.length,
            failedRecords: failedUpdates,
            pagedResultsCookie: pagedResultsCookie
        };


    } catch (error) {

        return {
            rolesCount: response.length,
            successfulUpdates: successCount,
            failureUpdates: failedUpdates.length,
            failedRecords: failedUpdates
        };
    }

}



/**
 * @name {generateResponse}
 * @description Method generates response.
 * 
 * @param {String} responseCode 
 * @param {JSON} message 
 * @param {JSON} payload 
 * @returns 
 */
function generateResponse(responseCode, transactionId, message, payload) {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "UNERROR",
        message: "An unexpected error occured while processing the request."
    }

    if (payload) {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: message,
            payload: payload
        }
    } else if (message) {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: message
        }
    } else {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: {
                code: "KYID-IRE",
                message: EXCEPTION_UNEXPECTED_ERROR.content
            }
        }
    }

}