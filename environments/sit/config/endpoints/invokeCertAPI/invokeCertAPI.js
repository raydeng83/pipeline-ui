(function () {
    if (request.method === 'create') {
      var value = request.content

      var params = {
            "url": identityServer.getProperty("esv.certjourney.api"),
            "method": 'POST',
            "headers": {
                "Content-Type": "application/json"
            }
        }

        var joruneyResponse1 = openidm.action("external/rest","call", params);
             
        joruneyResponse1.callbacks[0].input[0].value = JSON.stringify(value)
        joruneyResponse1 = JSON.stringify(joruneyResponse1)


        var params2 = {
            "url": identityServer.getProperty("esv.certjourney.api"),
            "method": 'POST',
            "headers": {
                "Content-Type": "application/json",
            },
            "body": joruneyResponse1
        }

        var joruneyResponse2 = openidm.action("external/rest", "call", params2);
        if (joruneyResponse2 && joruneyResponse2 && joruneyResponse2.callbacks[0].output[0].value) {
            return JSON.parse(joruneyResponse2.callbacks[0].output[0].value)
        }
        else {
            return joruneyResponse2
        }

    } else if (request.method === 'read') {
      // GET
        return {};

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