/**
 * @name KOG API Passthrough Endpoint
 * @description Simple wrapper to call KOG API - pass payload directly, return KOG response
 *
 * Usage:
 * POST /openidm/endpoint/aarontest
 * {
 *   "url": "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/getuserdetails",
 *   "payload": {
 *     "emailaddress": "kogkyid+crtaccnt76@gmail.com"
 *   }
 * }
 */

(function () {
    // Full scope list from KOG API
    var KOG_FULL_SCOPE = "kogkyidapi.createaccount kogkyidapi.doesaccountexistinad kogkyidapi.getuserdetails kogkyidapi.getuserauthorizations kogkyidapi.getuserprerequisites kogkyidapi.assignrolestouser kogkyidapi.removerolesfromuser kogkyidapi.updateprimaryemail kogkyidapi.addremovealternateemail kogkyidapi.addremovemobilephone kogkyidapi.updateuserprofile kogkyidapi.updateuserstatus kogkyidapi.getadditionalflagsinfo kogkyidapi.usertrainingscompletioncheck kogkyidapi.useragreementssignedcheck kogkyidapi.addremoveusercredential kogkyidapi.addremoveuseronboarding kogkyidapi.addremoveuserprereq kogkyidapi.addupdateorguserqas kogkyidapi.getuserclaims kogkyidapi.updatekyiduniqueid";

    if (request.method === 'create') {
        // POST - Call KOG API
        try {
            var inputPayload = request.content;

            // Validate required fields
            if (!inputPayload.url) {
                throw {
                    code: 400,
                    message: "Missing required field: url"
                };
            }

            if (!inputPayload.payload) {
                throw {
                    code: 400,
                    message: "Missing required field: payload"
                };
            }

            // Build request for invokeCertAPI
            var requestBody = {
                url: inputPayload.url,
                scope: KOG_FULL_SCOPE,
                method: "POST",
                payload: inputPayload.payload
            };

            // Call KOG API via invokeCertAPI endpoint
            var kogResponse = openidm.create("endpoint/invokeCertAPI", null, requestBody);

            // Return KOG response directly
            return kogResponse;

        } catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || "Unknown error",
                    code: error.code || 500
                }
            };
        }

    } else {
        throw {
            code: 405,
            message: "Method not allowed: " + request.method + " (Supported: create/POST only)"
        };
    }
}());
