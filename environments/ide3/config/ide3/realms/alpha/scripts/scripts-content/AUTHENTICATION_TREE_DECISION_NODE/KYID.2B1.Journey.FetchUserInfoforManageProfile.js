var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "GetUserID",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetUserInfoforManageProfile",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUND: "User Found",
    NOT_FOUND: "User Not Found",
    ERROR: "Error"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};

// Main execution
try {
    //var KOGID = nodeState.get("KOGID");
    logger.debug("_id :: => "+ nodeState.get("_id"))
    
    var KOGID = null
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!==null){
        KOGID = nodeState.get("KOGID");
    }else{
        var _id = nodeState.get("_id")
        var userQueryById = openidm.query("managed/alpha_user", {
            "_queryFilter": '_id eq "' + _id + '"'
        }, []);

        if(userQueryById.resultCount>0){
            KOGID = userQueryById.result[0].userName;
            nodeState.putShared("KOGID", KOGID)
        }
    }
    logger.debug("KOGID :: => "+ KOGID)
    if (KOGID) {
        //var user = queryUserByKOGID(KOGID);
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, []);

        var user = userQueryResult.result[0]

        if(user){
            var userIdenitityQueryResult = openidm.query("managed/alpha_kyid_user_identity", {
                "_queryFilter": 'account/_refResourceId eq "' + user._id + '"'
            }, []);
            var userIdenitity = userIdenitityQueryResult.result[0]
        }

        logger.debug("reading user attributes from FetchUserInfoforManageProfile" + user)
        logger.debug("reading user idenitity attributes " + userIdenitity)
        if (user) {
            nodeState.putShared("_id", user._id);
            nodeState.putShared("UserId", user._id);
            nodeState.putShared("mail", user.mail);
            nodeState.putShared("EmailAddress", user.mail);
            nodeState.putShared("userName", user.userName);
            //nodeState.putShared("orig_givenName", user.givenName);
            if(userIdenitity._id){
                nodeState.putShared("userIdentity", userIdenitity._id);
            }

            if(userIdenitity.givenName){
                var firstName =  userIdenitity.givenName;
                if (firstName) {
                    nodeState.putShared("orig_givenName", firstName);
                    //nodeState.putShared("orig_user_givenName", firstName);
                }
            }

            // Added the HomeLess Attribute
           
            if(userIdenitity.isHomeless){
                var isHomeless =  userIdenitity.isHomeless;
                if (isHomeless) {
                    nodeState.putShared("isHomeless", isHomeless.toString());
                }
            }
            else{
                nodeState.putShared("isHomeless", "false");
            }
            if (userIdenitity.middleName) {
                var middleName =  userIdenitity.middleName;
                if (middleName) {
                    nodeState.putShared("orig_custom_middleName", middleName);
                }
            }

            if (userIdenitity.sn ) {
                var lastName = userIdenitity.sn;
                if (lastName) {
                    nodeState.putShared("orig_sn", lastName);
                    //nodeState.putShared("orig_user_sn", lastName);
                }
            }

            if (userIdenitity.gender ) {
               var gender = userIdenitity.gender;
                if (gender) {
                    nodeState.putShared("orig_custom_gender", gender);
                } 
            }

            
            if (userIdenitity.dob ) {
                var dob = userIdenitity.dob;
                if (dob) {
                    nodeState.putShared("orig_custom_dateofBirth", dob);
                }   
            }


            if (userIdenitity.addressLine1) {
                var address = userIdenitity.addressLine1;
                if (address) {
                    nodeState.putShared("orig_postalAddress", address);
                }
            }

            if (userIdenitity.addressLine2) {
                var address2 = userIdenitity.addressLine2;
                if (address2) {
                    nodeState.putShared("orig_custom_postalAddress2", address2);
                }
            }

            if (userIdenitity.city) {
                var city = userIdenitity.city;
                if (city) {
                    nodeState.putShared("orig_city", city);
                }
            }
            if (userIdenitity.zip) {
                var postalCode = userIdenitity.zip;
                if (postalCode && postalCode !="undefined") {
                    nodeState.putShared("orig_postalCode", postalCode);
                }else{
                    nodeState.putShared("orig_postalCode", null);
                }
            }

            if (userIdenitity.stateCode) {
                var state = userIdenitity.stateCode;
                if (state) {
                    nodeState.putShared("orig_stateProvince", state);
                }
            }

            // if ( user.custom_zipExtension) {
            //     var zipExtension = user.custom_zipExtension
            //     if (zipExtension) {
            //         nodeState.putShared("orig_custom_zipExtension", zipExtension);
            //     }
            // }

            if ( userIdenitity.zipExtension) {
                var zipExtension = userIdenitity.zipExtension
                if (zipExtension) {
                    nodeState.putShared("orig_custom_zipExtension", zipExtension);
                }
            }

            if(user.frUnindexedString3){
                var languagePreference = userIdenitity.languagePreference  || user.frUnindexedString3;
                logger.debug("languagePreference is :: "+ languagePreference)
                if (languagePreference) {
                    nodeState.putShared("orig_languagePreference", languagePreference);
                    nodeState.putShared("orig_frUnindexedString3", languagePreference);     
                }
            }

            // if (userIdenitity.organDonorRegistrationStatus) {
            //     nodeState.putShared("orig_custom_organdonor", "true");
            // }
            if (user.custom_organdonor ) {
                nodeState.putShared("orig_custom_organdonor", user.custom_organdonor);
            }
            else{
                nodeState.putShared("orig_custom_organdonor",false);
            }

            if (userIdenitity.countryCode) {
                var country = userIdenitity.countryCode;
                if (country) {
                    nodeState.putShared("orig_country", country);
                    nodeState.putShared("orig_custom_country", country);
                }
            }

            if (userIdenitity.countyCode) {
                var county = userIdenitity.countyCode;
                if (county) {
                    nodeState.putShared("orig_custom_county", county);
                }
            }

            if (user.telephoneNumber) {
                nodeState.putShared("orig_telephoneNumber", user.telephoneNumber);
            }

            if (userIdenitity.suffix) {
                var suffix = userIdenitity.suffix;
                if (suffix) {
                    nodeState.putShared("orig_custom_suffix", suffix);
                }
            }

            if (userIdenitity.title) {
                nodeState.putShared("orig_custom_title",userIdenitity.title);
            }

            if(userIdenitity.uuid){
                logger.debug("uuid is in :: "+ userIdenitity.uuid)
                 nodeState.putShared("uuid",userIdenitity.uuid);
            }

            if(userIdenitity.languagePreference){
                logger.debug("languagePreference is in :: "+ userIdenitity.languagePreference)
                 nodeState.putShared("languagePreference",userIdenitity.languagePreference);
            }

            if(userIdenitity.verificationStatus){
                 logger.debug("verificationStatus is in :: "+ userIdenitity.verificationStatus)
                 nodeState.putShared("userVerificationStatus",userIdenitity.verificationStatus);
            }else{
                 nodeState.putShared("userVerificationStatus","notVerified");
            }

            if(userIdenitity && userIdenitity.riskIndicatorDetails){
                nodeState.putShared("exisitingRiskIndicatorDetails", JSON.stringify(userIdenitity.riskIndicatorDetails))
            }

            if(userIdenitity && userIdenitity.highRiskOverrideDate){
                nodeState.putShared("exisitingHighRiskOverrideDate", userIdenitity.highRiskOverrideDate)
            }
            
            if(userIdenitity && userIdenitity.riskIndicator){
                nodeState.putShared("exisitingRiskIndicator",userIdenitity.riskIndicator)
            }

            if(userIdenitity.assuranceLevel){
                 logger.debug("assuranceLevel is in :: "+ userIdenitity.assuranceLevel)
                 nodeState.putShared("assuranceLevel",userIdenitity.assuranceLevel);
            }else{
                 nodeState.putShared("assuranceLevel","0");
            }

            if(userIdenitity.verificationAttempt){
                 logger.debug("verificationAttempt is in :: "+ userIdenitity.verificationAttempt)
                 nodeState.putShared("verificationAttempt",userIdenitity.verificationAttempt);
            }else{
                 nodeState.putShared("verificationAttempt","0");
            }

            if(userIdenitity.verificationAttemptHelpdesk){
                 logger.debug("verificationAttemptHelpdesk is in :: "+ userIdenitity.verificationAttemptHelpdesk)
                 nodeState.putShared("verificationAttemptHelpdesk",userIdenitity.verificationAttemptHelpdesk);
            }else{
                 nodeState.putShared("verificationAttemptHelpdesk","0");
            }

            if(userIdenitity.lastVerificationDate){
                 logger.debug("lastVerificationDate is :: "+ userIdenitity.lastVerificationDate)
                 nodeState.putShared("lastVerificationDate",userIdenitity.lastVerificationDate);
            }

            // if (user.custom_title) {
            //     nodeState.putShared("orig_custom_title", user.custom_title);
            // }

            // if(user.preferences.language || user.preferences.language !== "undefined" || user.preferences.language !== null){
            //    nodeState.putShared("orig_languagePreference",user.preferences.language); 
            // }
            // if(user.preferences.language !== undefined && user.preferences.language !== null){
            //     logger.debug("user.preferences.language is "+ user.preferences.language)
            //    nodeState.putShared("orig_languagePreference",user.preferences.language); 
            // }

            // if (user.frUnindexedString3) {
            //     logger.debug("frUnindexedString3:" + user.frUnindexedString3)
            //     nodeState.putShared("orig_frUnindexedString3", user.frUnindexedString3);
            // }

            //  if(user.preferences.organdonor !== "undefined" || user.preferences.organdonor !== null){
            //    nodeState.putShared("orig_organPreference",user.preferences.organdonor)
            // }

            //nodeState.putShared("orig_county",user.custom_county);



            nodeState.putShared("orig_logOn", user.frIndexedString1);
            nodeState.putShared("orig_upn", user.frIndexedString2);
            //nodeState.putShared("orig_languagePreference",user.custom_languagePreference);
            //nodeState.putShared("orig_organDonorRegistrationStatus", userIdenitity.organDonorRegistrationStatu);

            //These details will be required for organization details 
            if (user.frIndexedString2) {
                var Logon = user.frIndexedString2
                var domain = Logon.split("@");
                var domainValue = domain[1].split(".");
                var prefix = domainValue[0]
                nodeState.putShared("domain", domain[1]);
            }
            nodeState.putShared("audit_LOGON", user.frIndexedString2);
            nodeState.putShared("audit_ID", user._id);

            if (user.custom_jobClassification) {
                nodeState.putShared("orig_custom_jobClassification", user.custom_jobClassification);
            }
            if (user.custom_approvalUnit5Code) {
                nodeState.putShared("orig_custom_approvalUnit5Code", user.custom_approvalUnit5Code);
            }
            if (user.custom_approvalUnit4Code) {
                nodeState.putShared("orig_custom_approvalUnit4Code", user.custom_approvalUnit4Code);
            }
            if (user.custom_approvalUnit3Code) {
                nodeState.putShared("orig_custom_approvalUnit3Code", user.custom_approvalUnit3Code);
            }
            if (user.custom_approvalUnit2Code) {
                nodeState.putShared("orig_custom_approvalUnit2Code", user.custom_approvalUnit2Code);
            }
            if (user.custom_approvalUnit1Code) {
                nodeState.putShared("orig_custom_approvalUnit1Code", user.custom_approvalUnit1Code);
            }

            if (userIdenitity.lastVerificationDate) {
                nodeState.putShared("orig_lastVerificationDate", userIdenitity.lastVerificationDate);
            }

            if (userIdenitity.proofingMethod) {
                var proofingMethod = userIdenitity.proofingMethod;
                nodeState.putShared("orig_proofingMethod", proofingMethod);
            }
            // if (userIdenitity.proofingMethod == "1") {
            //     nodeState.putShared("orig_verificationStatus", userIdenitity.lastVerificationDate);
            // }

           if(typeof existingSession != 'undefined'){
                var rawSessionRef = existingSession.get("sessionRefId");
                var sessionObj = JSON.parse(rawSessionRef);
            
                // Now you can access the internal key
                if (sessionObj && sessionObj.sessionRefId) {
                    nodeState.putShared("sessionRefId", sessionObj.sessionRefId);
                    logger.debug("Successfully extracted sessionRefId: " + sessionObj.sessionRefId);
                }
            }

            logger.debug("user found");
            action.goTo(NodeOutcome.FOUND);

        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            action.goTo(NodeOutcome.NOT_FOUND);
        }
    } else {
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}









// var dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Node Execution Begin",
//     node: "Node",
//     nodeName: "GetUserID",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.GetUserInfoforManageProfile",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// // Node outcomes
// var NodeOutcome = {
//     FOUND: "User Found",
//     NOT_FOUND: "User Not Found",
//     ERROR: "Error"
// };

// /**
//  * Logging function
//  * @type {Function}
//  */
// var nodeLogger = {
//     // Logs detailed debug messages for troubleshooting  
//     debug: function(message) {
//         logger.debug(message);
//     },
//     // Logs Error that can impact Application functionality
//     error: function(message) {
//         logger.error(message);
//     }
// };

// // Main execution
// try {
//     var KOGID = nodeState.get("KOGID");
//     if (KOGID) {
//         //var user = queryUserByKOGID(KOGID);
//         var userQueryResult = openidm.query("managed/alpha_user", {
//             "_queryFilter": 'userName eq "' + KOGID + '"'
//         }, []);

//         var user = userQueryResult.result[0]

//         if(user){
//             var userIdenitityQueryResult = openidm.query("managed/alpha_kyid_user_identity", {
//                 "_queryFilter": 'account/_refResourceId eq "' + user._id + '"'
//             }, []);
//             var userIdenitity = userIdenitityQueryResult.result[0]
//         }

//         logger.debug("reading user attributes from FetchUserInfoforManageProfile" + user)
//         logger.debug("reading user idenitity attributes " + userIdenitity)
//         if (user) {
//             nodeState.putShared("_id", user._id);
//             nodeState.putShared("UserId", user._id);
//             nodeState.putShared("mail", user.mail);
//             nodeState.putShared("orig_givenName", user.givenName);

//             if(user.givenName){
//                 var firstName =  user.givenName;
//                 if (firstName) {
//                     nodeState.putShared("orig_givenName", firstName);
//                 }
//             }

//             nodeState.putShared("orig_logOn", user.frIndexedString1);
//             nodeState.putShared("orig_upn", user.frIndexedString2);
//             //nodeState.putShared("orig_languagePreference",user.custom_languagePreference);
//             nodeState.putShared("orig_organDonorRegistrationStatus", user.custom_organDonorRegistrationStatus);


//             if (user.custom_middleName) {
//                 var middleName =  user.custom_middleName;
//                 if (middleName) {
//                     nodeState.putShared("orig_custom_middleName", middleName);
//                 }
//             }

//             if (user.sn ) {
//                 var lastName = user.sn;
//                 if (lastName) {
//                     nodeState.putShared("orig_sn", lastName);
//                 }
//             }
            
//             nodeState.putShared("userName", user.userName);

//             if (user.custom_gender ) {
//                var gender = user.custom_gender;
//                 if (gender) {
//                     nodeState.putShared("orig_custom_gender", gender);
//                 } 
//             }

//             if (user.custom_dateofBirth ) {
//                 var dob = user.custom_dateofBirth;
//                 if (dob) {
//                     nodeState.putShared("orig_custom_dateofBirth", dob);
//                 }   
//             }

//             if (user.postalAddress || userIdenitity.addressLine1) {
//                 var address = userIdenitity.addressLine1 || user.postalAddress;
//                 if (address) {
//                     nodeState.putShared("orig_postalAddress", address);
//                 }
//             }
//             if (user.city || userIdenitity.city) {
//                 var city = userIdenitity.city || user.city;
//                 if (city) {
//                     nodeState.putShared("orig_city", city);
//                 }
//             }
//             if (user.custom_postalAddress2 || userIdenitity.addressLine2) {
//                 var address2 = userIdenitity.addressLine2 || user.custom_postalAddress2;
//                 if (address2) {
//                     nodeState.putShared("orig_custom_postalAddress2", address2);
//                 }
//             }
//             if (user.postalCode || userIdenitity.zip) {
//                 var postalCode = userIdenitity.zip || user.postalCode;
//                 if (postalCode) {
//                     nodeState.putShared("orig_postalCode", postalCode);
//                 }
//             }
//             if (user.stateProvince || userIdenitity.stateCode) {
//                 var state = userIdenitity.stateCode || user.stateProvince;
//                 if (state) {
//                     nodeState.putShared("orig_stateProvince", state);
//                 }
//             }
//             if (user.custom_zipExtension || userIdenitity.zipExtension) {
//                 var zipExtension = userIdenitity.zipExtension || user.custom_zipExtension;
//                 if (zipExtension) {
//                     nodeState.putShared("orig_custom_zipExtension", zipExtension);
//                 }
//             }
//             // if(user.preferences.language || user.preferences.language !== "undefined" || user.preferences.language !== null){
//             //    nodeState.putShared("orig_languagePreference",user.preferences.language); 
//             // }
//             // if(user.preferences.language !== undefined && user.preferences.language !== null){
//             //     logger.debug("user.preferences.language is "+ user.preferences.language)
//             //    nodeState.putShared("orig_languagePreference",user.preferences.language); 
//             // }

//             if (user.frUnindexedString3) {
//                 logger.debug("frUnindexedString3:" + user.frUnindexedString3)
//                 nodeState.putShared("orig_frUnindexedString3", user.frUnindexedString3);
//             }


//             //  if(user.preferences.organdonor !== "undefined" || user.preferences.organdonor !== null){
//             //    nodeState.putShared("orig_organPreference",user.preferences.organdonor)
//             // }

//             if (user.custom_organdonor) {
//                 nodeState.putShared("orig_custom_organdonor", user.custom_organdonor);
//             }

//             if (user.country || userIdenitity.countryCode) {
//                 var country = userIdenitity.countryCode || user.country;
//                  logger.debug("country is :: "+ country)
//                 if (country) {
//                     nodeState.putShared("orig_country", country);
//                 }
//             }

//             if (user.custom_county || userIdenitity.countyCode) {
//                 var county = userIdenitity.countyCode || user.custom_county;
               
//                 if (county) {
//                     nodeState.putShared("orig_custom_county", county);
//                 }
//             }
//             //nodeState.putShared("orig_county",user.custom_county);
//             if (user.telephoneNumber) {
//                 nodeState.putShared("orig_telephoneNumber", user.telephoneNumber);
//             }
//             if (user.custom_suffix || userIdenitity.suffix) {
//                 var suffix = userIdenitity.suffix || user.custom_suffix;
//                 if (suffix) {
//                     nodeState.putShared("orig_custom_suffix", suffix);
//                 }
//             }
//             if (user.custom_title) {
//                 nodeState.putShared("orig_custom_title", user.custom_title);
//             }

//             //These details will be required for organization details 
//             if (user.frIndexedString2) {
//                 var Logon = user.frIndexedString2
//                 var domain = Logon.split("@");
//                 var domainValue = domain[1].split(".");
//                 var prefix = domainValue[0]
//                 nodeState.putShared("domain", domain[1]);
//             }

//             if (user.custom_jobClassification) {
//                 nodeState.putShared("orig_custom_jobClassification", user.custom_jobClassification);
//             }
//             if (user.custom_approvalUnit5Code) {
//                 nodeState.putShared("orig_custom_approvalUnit5Code", user.custom_approvalUnit5Code);
//             }
//             if (user.custom_approvalUnit4Code) {
//                 nodeState.putShared("orig_custom_approvalUnit4Code", user.custom_approvalUnit4Code);
//             }
//             if (user.custom_approvalUnit3Code) {
//                 nodeState.putShared("orig_custom_approvalUnit3Code", user.custom_approvalUnit3Code);
//             }
//             if (user.custom_approvalUnit2Code) {
//                 nodeState.putShared("orig_custom_approvalUnit2Code", user.custom_approvalUnit2Code);
//             }
//             if (user.custom_approvalUnit1Code) {
//                 nodeState.putShared("orig_custom_approvalUnit1Code", user.custom_approvalUnit1Code);
//             }

//             if (userIdenitity.lastVerificationDate) {
//                 nodeState.putShared("orig_lastVerificationDate", userIdenitity.lastVerificationDate);
//             }

//             if (userIdenitity.proofingMethod) {
//                 nodeState.putShared("orig_proofingMethod", userIdenitity.proofingMethod);
//             }
//             // if (userIdenitity.proofingMethod == "1") {
//             //     nodeState.putShared("orig_verificationStatus", userIdenitity.lastVerificationDate);
//             // }


//             logger.debug("user found");
//             action.goTo(NodeOutcome.FOUND);

//         } else {
//             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
//             action.goTo(NodeOutcome.NOT_FOUND);
//         }
//     } else {
//         action.goTo(NodeOutcome.ERROR);
//     }
// } catch (error) {
//     nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
//     action.goTo(NodeOutcome.ERROR);
// }