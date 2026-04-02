(function () {
    var VERSION = "v1.0.0";

    // Query using relationship traversal preRequisiteTypeId/recordState combined with preReqTypeId filter
    function queryRelationship(preReqTypeId) {
        try {
            var result = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + preReqTypeId + '"'
                    + ' AND (preRequisiteTypeId/recordState eq "ACTIVE" OR preRequisiteTypeId/recordState eq "0")',
                "_pageSize": 10
            }, ["*"]);
            logger.error("RELATIONSHIP - Query results: " + result.resultCount);
            return result;
        }
        catch (error) {
            logger.error("RELATIONSHIP Exception: " + error.message);
            return { error: error.message, resultCount: 0, result: [] };
        }
    }

    // Test cases - use preReqTypeId from the environment
    var TEST_ACCOUNTS = [
        { name: "Type 3927", preReqTypeId: "3927a504-2bbf-4b11-b5eb-317bcc34475b" },
        { name: "Type a2eb", preReqTypeId: "a2eb9bc0-5ddd-4ea0-a5f1-ece88781fc5b" },
        { name: "Type 713c", preReqTypeId: "713c0d20-d97e-4f3a-b2f3-22b53b61d15e" }
    ];

    function runTests() {
        var results = [];
        for (var i = 0; i < TEST_ACCOUNTS.length; i++) {
            var tc = TEST_ACCOUNTS[i];
            var relationshipResult = queryRelationship(tc.preReqTypeId);
            results.push({
                name: tc.name,
                preReqTypeId: tc.preReqTypeId,
                resultCount: relationshipResult.resultCount,
                error: relationshipResult.error || null
            });
        }
        return results;
    }

    if (request.method === 'read') {
        var params = request.additionalParameters || {};

        if (params.runTests === "true") {
            return { version: VERSION, testResults: runTests() };
        }

        var preReqTypeId = params.preReqTypeId;
        var relationshipResult = queryRelationship(preReqTypeId);

        return {
            version: VERSION,
            preReqTypeId: preReqTypeId,
            resultCount: relationshipResult.resultCount,
            error: relationshipResult.error || null
        };
    }
}());
