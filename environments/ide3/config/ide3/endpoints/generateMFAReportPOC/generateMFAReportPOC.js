var _ = require('lib/lodash');
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");

function getException(e) {
    if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
        return e.javaException.cause.localizedMessage || e.javaException.cause.message;
    } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
        return e.messageDetail.message;
    } else if (_.has(e, 'message')) {
        return e.message;
    } else {
        return e;
    }
}


(function () {
    if (endpointExecution === "true") {
        if (request.method === 'read') {
            try {
                var userName = "ce1d638f-0584-4277-b367-c02202a1ae58";
                var alphaUserMOResponse = openidm.query("managed/alpha_user", {
                    "_queryFilter": "true"
                }, []);
                // var alphaUserMOResponse = openidm.query("managed/alpha_user", {
                //     "_queryFilter": 'userName eq "' + userName + '"'
                // }, []);


                var UserReport = []
                var resultLenth = alphaUserMOResponse.result.length;
                for (var i = 0; i < resultLenth; i++) {
                    var username = alphaUserMOResponse.result[i].userName
                    logger.error("generateMFAReportPOC username " + i + " : " + username);
                    var mfaMOResponse = openidm.query("managed/alpha_kyid_mfa_methods", {
                        "_queryFilter": 'KOGId eq "' + username + '"'
                    }, []);


                    logger.error("generateMFAReportPOC mfaMOResponse " + i + " : " + JSON.stringify(mfaMOResponse));
                    if (mfaMOResponse.result.length > 0) {
                        var results = mfaMOResponse.result;
                        logger.error("generateMFAReportPOC results " + i + " : " + JSON.stringify(results));

                        for (let i = 0; i < results.length; i++) {
                            var item = results[i];
                            logger.error("generateMFAReportPOC item " + i + " : " + JSON.stringify(item));

                            UserReport.push({
                                KOGId: item.KOGId,
                                MFAMethod: item.MFAMethod,
                                MFAValue: item.MFAValue,
                                MFAStatus: item.MFAStatus,
                                isRecoveryOnly: item.isRecoveryOnly

                            });

                        }

                    }
                }

            } catch (error) {
                var exceptionMessage = getException(error);
                throw {
                    code: 500,
                    message: exceptionMessage
                };

            }
            return {
                UserReport
            };
        }

        throw {
            code: 500,
            message: 'Unknown error'
        };
    } else {
        throw {
            code: 500,
            message: "Internal Server Error : Flag Set to False"
        };
    }
}());