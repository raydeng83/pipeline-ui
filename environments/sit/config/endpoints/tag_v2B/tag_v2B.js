/**
 * PAIC IDM Custom Endpoint: used to managed object alpha_kyid_tag
 * For now supports only POST Request to create tag object
 * 
 * Endpoint Path: /openidm/endpoint/tag_v2B
 * 
 * 
 * Example cURL Commands:
 * 
 * 1. Standard Mode - Analyze (default):
 * curl -X POST https://your-tenant.forgeblocks.com/openidm/endpoint/tag_v2B \
 *   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *          "action": "create",
 *          "payload": {
 *              "name": "test_tag",
 *              "description": "this is a test tag  to create",
 *              "localizedContent": [
 *                  {
 *                      "displayDescription": {
 *                          "en": "test tag description en",
 *                          "es": "test tag2 description es"
 *                      },
 *                      "displayTitle": {
 *                          "en": "test tag title en",
 *                          "es": "test tag title es"
 *                      }
 *                  }
 *              ]
 *          }
 *      }'
 */

var dateTime = new Date().toISOString();

var nodeConfig = {
    begin: "Beginning Node Execution",
    endpointName: "endpoint/tag_v2B",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };


(function(){

    const validateEndptRequestBody = {
        "payload": context,
        "action": 0
    }
  
    try {
        let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
        logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
        if(res.status === 200){
          logger.error("Continue executing endpoint...")
        } else {
          return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }
  
    logger.error(nodeConfig.begin + "::"+nodeConfig.endpointName+"::"+nodeConfig.timestamp)
    const requestAction = request.content.action
    const payLoad = request.content.payload
    
    try{

        if(request.method == "create"){       /* This is HTTP POST operation. */ 
            if(requestAction =="create"){
                return createTag(payLoad);
            } else if (requestAction == "update"){
                //not developed yet for tag update operation
            } else {
                throw { code : 400, message : "Unsupported requestAction."};
            }
            
        }else if(request.method == "update"){ /* This is HTTP PUT operation. */
            //Throw unsupported operation error.
            throw { code : 400, message : "Unsupported operation: " + request.method };
        }else if(request.method == "patch"){  /* This is HTTP PATCH operation. */
            //Throw unsupported operation error.
            throw { code : 400, message : "Unsupported operation: " + request.method };
        }else if(request.method == "delete"){ /* This is HTTP DELETE operation. */
            //Throw unsupported operation error.
            throw { code : 400, message : "Unsupported operation: " + request.method };
        }else if(request.method == "read"){   /* This is HTTP GET operation. */
            //Throw unsupported operation error.
            throw { code : 400, message : "Unsupported operation: " + request.method };
        }

    }catch(error){

        if (error) {
            /* generate error response */
            return generateResponse(error.type, input.transactionId, error.message)
        } else {
            return generateResponse(500, input.transactionId, "Internal Server Error")
        }
    }
})()



function createTag(payLoad){
    try {
        logger.error(nodeConfig.endpointName+"::"+"createTag Function start")

        let tagCreateResponse = "";
        let tag = payLoad;

        logger.error(+nodeConfig.endpointName+"::"+"tag:: ", tag);

        if(tag.name && tag.localizedContent && tag.localizedContent[0].displayTitle && tag.localizedContent[0].displayDescription 
            &&  Object.keys(tag.localizedContent[0].displayTitle).length > 0 &&  Object.keys(tag.localizedContent[0].displayDescription).length > 0) {

            tagCreateResponse = openidm.create("managed/alpha_kyid_tag", null, tag);
        } else{

            throw { code : 400, message : "Missing required attributes to create tags"};
        }
        
        logger.error(nodeConfig.endpointName+"::"+"response:: ", tagCreateResponse);

        return {
            "result": tagCreateResponse
        };

    } catch(error) {
        
        return error;
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