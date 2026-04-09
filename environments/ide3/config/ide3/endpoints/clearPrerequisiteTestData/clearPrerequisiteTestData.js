(function () {
    if (request.method === 'create') {
        // POST
        return {};
    } else if (request.method === 'read') {
       var errorResponse = {
            errorMessage: "Required inputs are missing"
        }
        if (request.additionalParameters.userId != null && request.additionalParameters.userId != "" && request.additionalParameters.type != null && request.additionalParameters.type != "" && request.additionalParameters.contextId != null && request.additionalParameters.contextId != "") {
            var UUID = request.additionalParameters.userId;
            var type = request.additionalParameters.type;
            var contextId = request.additionalParameters.contextId;
            // var UUID = "c23f7de1-4825-4da2-a9cd-404d8e10a6ac" ;
            //var contextId = "qwerty12345";
            //var type = "prerequisite type1";
            //var UUID = request.additionalParameters.userId;
            var resultArray = [];
            var requestResponseArray = []; 
            var deletedresult = null;
            var deleteresult = null;
            var successResponse = {
                message: "operation completed successfully"
            }
            var exceptionResponse = {
                message: "operation failed"
            }
            var extendedIdentityResponse = openidm.query("managed/alpha_kyid_extendedIdentity/", { "_queryFilter": '/uuid/ eq "' + UUID + '"'}, []);
            //  var responseTwo = openidm.query("managed/alpha_kyid_request/", { "_queryFilter": '/requester/ eq "' + UUID + '"', "_pageSize": 10, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": 0 }, []);;
            var requestResponse = openidm.query("managed/alpha_kyid_request/", { "_queryFilter": '/requester eq "' + UUID + '" and ' + '/type eq "' + type + '" and ' + '/contextid eq "' + contextId + '"' }, []);
            resultArray = extendedIdentityResponse.result;
            requestResponseArray = requestResponse.result;
            for (var i = 0; i < resultArray.length; i++) {
                var currentObject = resultArray[i];
                var id = currentObject._id;
                var extendedIdentityUrl = "managed/alpha_kyid_extendedIdentity" + "/" + id;
                //logger.error("url" + url);
                try {
                    deletedresult = openidm.delete(extendedIdentityUrl, null);
                }
                catch (error) {
                    logger.error("exception : unable to clear the record" + error);
                    return exceptionResponse;
                }
            }
            for (var k = 0; k < requestResponseArray.length; k++) {
                var presentObject = requestResponseArray[k];
                var uniqueid = presentObject._id;
                var requestUrl = "managed/alpha_kyid_request" + "/" + uniqueid;
                try {
                    deleteresult = openidm.delete(requestUrl, null);
                }
                catch (error) {
                    logger.error("exception : unable to clear the record" + error);
                    return exceptionResponse;
                }
            }
            return successResponse;
        }
        else {
            logger.error("required parameters are not provided");
            return errorResponse;
        }
      
        //return {};
    } else if (request.method === 'update') {
        // PUT
        return {};
    } else if (request.method === 'patch') {
        return {};
    } else if (request.method === 'delete') {
        var errorResponse = {
            errorMessage: "Required inputs are missing"
        }
        if (request.additionalParameters.userId != null && request.additionalParameters.userId != "" && request.additionalParameters.type != null && request.additionalParameters.type != "" && request.additionalParameters.contextId != null && request.additionalParameters.contextId != "") {
            var UUID = request.additionalParameters.userId;
            var type = request.additionalParameters.type;
            var contextId = request.additionalParameters.contextId;
            // var UUID = "c23f7de1-4825-4da2-a9cd-404d8e10a6ac" ;
            //var contextId = "qwerty12345";
            //var type = "prerequisite type1";
            //var UUID = request.additionalParameters.userId;
            var resultArray = [];
            var deletedresult = null;
            var deleteresult = null;
            var successResponse = {
                message: "operation completed successfully"
            }
            var exceptionResponse = {
                message: "operation failed"
            }
            var response = openidm.query("managed/alpha_kyid_extendedIdentity/", { "_queryFilter": '/uuid/ eq "' + UUID + '"', "_pageSize": 10, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": 0 }, []);;
            //  var responseTwo = openidm.query("managed/alpha_kyid_request/", { "_queryFilter": '/requester/ eq "' + UUID + '"', "_pageSize": 10, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": 0 }, []);;
            var responseTwo = openidm.query("managed/alpha_kyid_request/", { "_queryFilter": '/requester eq "' + UUID + '" and ' + '/type eq "' + type + '" and ' + '/contextid eq "' + contextId + '"' }, []);
            resultArray = response.result;
            resultArrayTwo = responseTwo.result;
            for (var i = 0; i < resultArray.length; i++) {
                var currentObject = resultArray[i];
                var id = currentObject._id;
                var url = "managed/alpha_kyid_extendedIdentity" + "/" + id;
                logger.error("url" + url);
                try {
                    deletedresult = openidm.delete(url, null);
                }
                catch (error) {
                    logger.error("exception : unable to clear the record" + error);
                    return exceptionResponse;
                }
            }
            for (var k = 0; k < resultArrayTwo.length; k++) {
                var presentObject = resultArrayTwo[k];
                var uniqueid = presentObject._id;
                var url2 = "managed/alpha_kyid_request" + "/" + uniqueid;
                try {
                    deleteresult = openidm.delete(url2, null);
                }
                catch (error) {
                    logger.error("exception : unable to clear the record" + error);
                    return exceptionResponse;
                }
            }
            return successResponse;
        }
        else {
            logger.error("required parameters are not provided");
            return errorResponse;
        }
    }
    throw { code: 500, message: 'Unknown error' };
}());