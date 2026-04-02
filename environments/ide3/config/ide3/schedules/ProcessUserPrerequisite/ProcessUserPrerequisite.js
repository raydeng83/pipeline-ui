(function () {
    // Call the custom endpoint to initiate a process
    var result = openidm.create('endpoint/UserPrerequisiteAPI', null, {
        "payload": {},
        "action": 4
    });

    // Optionally, handle the result returned by the custom endpoint
    if (result && result!=null) {
        logger.error("Custom endpoint called successfully. Response is - "+ JSON.stringify(result));
    } else {
        logger.error("Error calling custom endpoint: " + JSON.stringify(result));
    }
})();