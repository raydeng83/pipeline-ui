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
                var userName = "000aec0e-eadf-4079-96bb-3a4efd01428e";
                var alphaUserMOResponse = openidm.query("managed/alpha_user", { "_queryFilter": "true" }, []);
                // var alphaUserMOResponse = openidm.query("managed/alpha_user", {
                //     "_queryFilter": 'userName eq "' + userName + '"'
                // }, []);

                var UserReport = []
                
                var resultLenth = alphaUserMOResponse.result.length;
                for (var i = 0; i < resultLenth; i++) {
                  
                    var proofingMethod = "";
                    var zipCode = "NULL";
                    var zipCodeExtension = "NULL";
                    if (alphaUserMOResponse.result[i].custom_userIdentity != null && alphaUserMOResponse.result[i].custom_userIdentity != undefined) {
                        var userIdentityMoResponse = openidm.read(alphaUserMOResponse.result[i].custom_userIdentity._ref)
                        proofingMethod = userIdentityMoResponse.proofingMethod
                        zipCode = userIdentityMoResponse.zip != null && userIdentityMoResponse.zip != undefined ? userIdentityMoResponse.zip : "NULL"
                        zipCodeExtension = userIdentityMoResponse.zipExtension != null && userIdentityMoResponse.zipExtension != undefined ? userIdentityMoResponse.zipExtension : "NULL"

                    } else {
                        proofingMethod = "NULL";
                    }
                    // Collect all role names for this user businessRoleId
                    const userRoleNames = [];
                    if (alphaUserMOResponse.result[i] && Array.isArray(alphaUserMOResponse.result[i].effectiveRoles)) {
                        alphaUserMOResponse.result[i].effectiveRoles.forEach(role => {
                            if (role._ref) {
                                var rolesMoResponse = openidm.read(role._ref);
                                roleName=rolesMoResponse.name;
                                businessRoleId=rolesMoResponse.businessRoleId;
                                userRoleNames.push({
                                    roleName: roleName, businessRoleId
                               });
                             
                            }
                        });
                    }
                    logger.error("AlphaUserIdentityReportPOC names &&&& " + i +" : " + userRoleNames);

                    UserReport.push({
                        FirstName: alphaUserMOResponse.result[i].givenName != null && alphaUserMOResponse.result[i].givenName != undefined ? alphaUserMOResponse.result[i].givenName : "NULL",
                        MiddleName: alphaUserMOResponse.result[i].custom_middleName != null && alphaUserMOResponse.result[i].custom_middleName != undefined ? alphaUserMOResponse.result[i].custom_middleName : "NULL",
                        LastName: alphaUserMOResponse.result[i].sn != null && alphaUserMOResponse.result[i].sn != undefined ? alphaUserMOResponse.result[i].sn : "NULL",
                        EmailAddress: alphaUserMOResponse.result[i].mail != null && alphaUserMOResponse.result[i].mail != undefined ? alphaUserMOResponse.result[i].mail : "NULL",
                        Logon: alphaUserMOResponse.result[i].frIndexedString2 != null && alphaUserMOResponse.result[i].frIndexedString2 != undefined ? alphaUserMOResponse.result[i].frIndexedString2 : "NULL",
                        UPN: alphaUserMOResponse.result[i].frIndexedString1 != null && alphaUserMOResponse.result[i].frIndexedString1 != undefined ? alphaUserMOResponse.result[i].frIndexedString1 : "NULL",
                        KOGID: alphaUserMOResponse.result[i].userName != null && alphaUserMOResponse.result[i].userName != undefined ? alphaUserMOResponse.result[i].userName : "NULL",
                        KYIDUniqueID: alphaUserMOResponse.result[i]._id != null && alphaUserMOResponse.result[i]._id != undefined ? alphaUserMOResponse.result[i]._id : "NULL",
                        Address1: alphaUserMOResponse.result[i].postalAddress != null && alphaUserMOResponse.result[i].postalAddress != undefined ? alphaUserMOResponse.result[i].postalAddress : "NULL",
                        Address2: alphaUserMOResponse.result[i].custom_postalAddress2 != null && alphaUserMOResponse.result[i].custom_postalAddress2 != undefined ? alphaUserMOResponse.result[i].custom_postalAddress2 : "NULL",
                        County: alphaUserMOResponse.result[i].custom_county != null && alphaUserMOResponse.result[i].custom_county != undefined ? alphaUserMOResponse.result[i].custom_county : "NULL",
                        AccountType: alphaUserMOResponse.result[i].custom_kyidAccountType != null && alphaUserMOResponse.result[i].custom_kyidAccountType != undefined ? alphaUserMOResponse.result[i].custom_kyidAccountType : "NULL",
                        Status: alphaUserMOResponse.result[i].accountStatus != null && alphaUserMOResponse.result[i].accountStatus != undefined ? alphaUserMOResponse.result[i].accountStatus : "NULL",
                        IdentityProofingMethod: proofingMethod,
                        Zipcode: zipCode,
                        ZipcodeExtension: zipCodeExtension,
                        RoleNames: userRoleNames,
                        BusinessRoleId: businessRoleId
              
                    });
                }


            } catch (error) {
                var exceptionMessage = getException(error);
                throw { code: 500, message: exceptionMessage };

            }
            return { UserReport };
        }

        throw { code: 500, message: 'Unknown error' };
    }
    else {
        throw { code: 500, message: "Internal Server Error : Flag Set to False" };
    }
}());

