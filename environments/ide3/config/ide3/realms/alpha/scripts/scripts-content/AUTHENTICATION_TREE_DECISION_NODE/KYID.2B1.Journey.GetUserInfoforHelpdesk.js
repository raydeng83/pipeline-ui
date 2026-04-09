var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "User Details HelpDesk",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetUserInfoforHelpdesk",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUND: "User Found",
    NOT_FOUND: "User Not Found",
    ERROR: "Error",
    PASS: "Pass"
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


try {
    var id = nodeState.get("_id");
    if(nodeState.get("journeyContext") ==="ridp" && existingSession.get("UserId") && existingSession.get("UserId") !== null){
        id = existingSession.get("UserId");
    }
   
    logger.debug("id is in :: "+ id)
    if (id) {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": '_id eq "' + id + '"'
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
            nodeState.putShared("KOGID", user.userName);
            nodeState.putShared("_id", user._id);
            nodeState.putShared("UserId", user._id);
            nodeState.putShared("mail", user.mail);
            nodeState.putShared("orig_givenName", user.givenName);
            nodeState.putShared("orig_logOn", user.frIndexedString1);
            nodeState.putShared("orig_upn", user.frIndexedString2);
            nodeState.putShared("orig_organDonorRegistrationStatus", user.custom_organDonorRegistrationStatus);

            
            if(userIdenitity){
                nodeState.putShared("userIdentity",userIdenitity._id)
            }

            if(userIdenitity.givenName){
                var firstName = userIdenitity.givenName;
                if (firstName) {
                    nodeState.putShared("orig_givenName", firstName);
                }
            }

            if (userIdenitity.middleName) {
                var middleName = userIdenitity.middleName;
                if (middleName) {
                    nodeState.putShared("orig_custom_middleName", middleName);
                }
            }
            if (userIdenitity.sn) {
                var lastName = userIdenitity.sn;
                if (lastName) {
                    nodeState.putShared("orig_sn", lastName);
                }
            }
            nodeState.putShared("userName", user.userName);

            if (userIdenitity.uuid) {
                var uuid = userIdenitity.uuid;
                if (uuid) {
                    nodeState.putShared("uuid", uuid);
                }
            }
            if (userIdenitity.isHomeless) {
                var isHomeless = userIdenitity.isHomeless;
                if (isHomeless) {
                    nodeState.putShared("isHomeless", isHomeless.toString());
                }
                else{
                    nodeState.putShared("isHomeless", "false");
                }
            }


            if (userIdenitity.gender) {
                var gender = userIdenitity.gender;
                if (gender) {
                    nodeState.putShared("orig_custom_gender", gender);
                } 
            }

            if(userIdenitity.verificationStatus){
                 logger.debug("verificationStatus is in :: "+ userIdenitity.verificationStatus)
                 nodeState.putShared("userVerificationStatus",userIdenitity.verificationStatus);
            }else{
                 nodeState.putShared("userVerificationStatus","notVerified");
            }

            if (userIdenitity.dob) {
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
            if (userIdenitity.city) {
                var city = userIdenitity.city;
                if (city) {
                    nodeState.putShared("orig_city", city);
                }
            }
            if (userIdenitity.addressLine2) {
                var address2 = userIdenitity.addressLine2;
                if (address2) {
                    nodeState.putShared("orig_custom_postalAddress2", address2);
                }
            }
            if (userIdenitity.zip) {
                var postalCode = userIdenitity.zip;
                if (postalCode && postalCode!="undefined" ) {
                    nodeState.putShared("orig_postalCode", postalCode);
                }
            }
            if (userIdenitity.stateCode) {
                var state = userIdenitity.stateCode;
                if (state) {
                    nodeState.putShared("orig_stateProvince", state);
                }
            }
            if (userIdenitity.zipExtension) {
                var zipExtension = userIdenitity.zipExtension;
                if (zipExtension) {
                    nodeState.putShared("orig_custom_zipExtension", zipExtension);
                }
            }


            if ( userIdenitity.languagePreference || user.frUnindexedString3) {
                var orig_languagePreference =  userIdenitity.languagePreference || user.frUnindexedString3
                logger.debug("frUnindexedString3:" + user.frUnindexedString3)
                orig_languagePreference
                nodeState.putShared("orig_languagePreference", orig_languagePreference);
                nodeState.putShared("orig_frUnindexedString3", orig_languagePreference);
            }

            if (user.custom_organdonor) {
                nodeState.putShared("orig_custom_organdonor", user.custom_organdonor);
            }

            if (userIdenitity.countryCode) {
                var country = userIdenitity.countryCode;
                logger.debug("country is :: "+ country)
                nodeState.putShared("orig_custom_country", country);
            }

            if (userIdenitity.proofingMethod) {
                var proofingMethod = userIdenitity.proofingMethod;
                nodeState.putShared("orig_proofingMethod", proofingMethod);
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
                var title = userIdenitity.title;
                nodeState.putShared("orig_custom_title", title);
            }

            if(userIdenitity.verificationAttemptHelpdesk){
                 logger.debug("verificationAttemptHelpdesk is in :: "+ userIdenitity.verificationAttemptHelpdesk)
                 nodeState.putShared("verificationAttemptHelpdesk",userIdenitity.verificationAttemptHelpdesk);
            }else{
                 nodeState.putShared("verificationAttemptHelpdesk","0");
            }
            

            if(userIdenitity.verificationAttempt){
                 logger.debug("verificationAttempt is in :: "+ userIdenitity.verificationAttempt)
                 nodeState.putShared("verificationAttempt",userIdenitity.verificationAttempt);
            }else{
                 nodeState.putShared("verificationAttempt","0");
            }

            if(userIdenitity.lastVerificationDate){
                 logger.debug("lastVerificationDate is :: "+ userIdenitity.lastVerificationDate)
                 nodeState.putShared("lastVerificationDate",userIdenitity.lastVerificationDate);
            }

             if(nodeState.get("userInfoJSON")){
                var userInfoJSON = nodeState.get("userInfoJSON")
                if (userInfoJSON.givenName) {
                    userInfoJSON["givenName"]=userInfoJSON.givenName
                    nodeState.putShared("orig_givenName", userInfoJSON.givenName);
                }
                if (userInfoJSON.middleName) {
                    userInfoJSON["middleName"]=userInfoJSON.middleName
                    nodeState.putShared("orig_custom_middleName", userInfoJSON.middleName);
                }
                if (userInfoJSON.sn) {
                    userInfoJSON["sn"]=userInfoJSON.sn
                    nodeState.putShared("orig_sn", userInfoJSON.sn);
                }
                if (userInfoJSON.suffix) {
                    userInfoJSON["suffix"]=userInfoJSON.suffix
                    nodeState.putShared("orig_custom_suffix", userInfoJSON.suffix);
                }
                if (userInfoJSON.gender) {
                    userInfoJSON["gender"]=userInfoJSON.gender
                    nodeState.putShared("orig_custom_gender", userInfoJSON.gender);
                }
                if (userInfoJSON.dob) {
                    userInfoJSON["dob"]=userInfoJSON.dob
                    nodeState.putShared("orig_custom_dateofBirth", userInfoJSON.dob);
                }
                if (userInfoJSON.postalAddress) {
                    userInfoJSON["postalAddress"]=userInfoJSON.postalAddress
                    nodeState.putShared("orig_postalAddress", userInfoJSON.postalAddress);
                }
                if (userInfoJSON.postalAddress2) {
                    userInfoJSON["postalAddress2"]=userInfoJSON.postalAddress2
                    nodeState.putShared("orig_custom_postalAddress2", userInfoJSON.postalAddress2);
                }
                if (userInfoJSON.city) {
                    userInfoJSON["city"]=userInfoJSON.city
                    nodeState.putShared("orig_city", userInfoJSON.city);
                }
                if (userInfoJSON.stateCode) {
                    userInfoJSON["stateProvince"]=userInfoJSON.stateCode
                    nodeState.putShared("orig_stateProvince", userInfoJSON.stateCode);
                }
                if (userInfoJSON.postalCode) {
                    userInfoJSON["postalCode"]=userInfoJSON.postalCode
                    nodeState.putShared("orig_postalCode", userInfoJSON.postalCode);
                }
                if (userInfoJSON.postalExtension) {
                    userInfoJSON["postalExtension"]=userInfoJSON.postalExtension
                    nodeState.putShared("postalExtension", userInfoJSON.postalExtension);
                }
                if (userInfoJSON.county) {
                    userInfoJSON["county"]=userInfoJSON.county
                    nodeState.putShared("orig_custom_county", userInfoJSON.county);
                }
                if (userInfoJSON.country) {
                    userInfoJSON["country"]=userInfoJSON.country
                    nodeState.putShared("orig_custom_country", userInfoJSON.country);
                }

                if(userInfoJSON.orig_telephoneNumber){
                userInfoJSON["telephoneNumber"]=userInfoJSON.orig_telephoneNumber
                nodeState.putShared("orig_telephoneNumber",userInfoJSON.orig_telephoneNumber)
                }
            }

            logger.debug("user found");
            action.goTo(NodeOutcome.FOUND);

        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            action.goTo(NodeOutcome.NOT_FOUND);
        }
    } else {
        action.goTo(NodeOutcome.PASS);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}