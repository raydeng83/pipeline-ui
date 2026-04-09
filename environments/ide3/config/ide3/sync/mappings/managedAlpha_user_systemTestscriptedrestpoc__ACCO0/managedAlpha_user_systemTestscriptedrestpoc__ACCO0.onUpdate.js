(function () {

    logger.error("onUpdate script:: started for user: " + source.mail);

    try {

        var userId = source._id;
        var filter = {
                "_queryFilter": 'userIdentifier eq "' + userId + '"'
            };


        var fields = ["appIdentifier", "roleIdentifier"];
        var userAccessResults = openidm.query("managed/alpha_kyid_access", filter, fields);
        var accessMap = {};
        var accessCount = 0;
        
        var id = source._id;
        var kogId = source.userName;
        var queryRequestBody = {
            id: id,
            kogId: kogId
        };

        logger.error("onUpdate script:: Query Request Body" +  queryRequestBody);

        var response = openidm.create("endpoint/mapping_Data_Generate", null, queryRequestBody);
        if (response) {
             //target.description = response;
            target.description = JSON.stringify(response);
            logger.error("onUpdate script:: userecord:: " + target.description);
        } else {
            target.description = "{}";
            logger.error("onUpdate script:: No valid access entries found, setting empty object");
        }
        /* use csutom endpoint to get required data 
        if (userAccessResults && userAccessResults.result && userAccessResults.result.length > 0) {
            logger.error("onUpdate script:: Access count" +  userAccessResults.result.length);

            // Process each access object
            for (var i = 0; i < userAccessResults.result.length; i++) {
                var userAccess = userAccessResults.result[i];
                logger.error("onUpdate script:: Processing access object: " + userAccess._id);

                var roleIdentifier = userAccess.roleIdentifier;
                var appIdentifier = userAccess.appIdentifier;

                if (!roleIdentifier || !appIdentifier) {
                    logger.error("onUpdate script:: Access object " + access._id + " missing roleIdentifier or appIdentifier");
                    continue;
                }

                var roleName = null;
                var appName = null;

                // Fetch role name
                try {
                    var role = openidm.read('managed/alpha_role/' + roleIdentifier);
                    if (role && role.name) {
                        roleName = role.name;
                        logger.error("onUpdate script:: Fetched role name: " + roleName);
                    } else {
                        logger.error("onUpdate script:: Role " + roleIdentifier + " has no name");
                    }
                } catch (roleError) {
                    logger.error("onUpdate script:: Failed to fetch role " + roleIdentifier + ": " + roleError.message);
                }

                // Fetch app name
                try {
                    var app = openidm.read('managed/alpha_kyid_businessapplication/' + appIdentifier);
                    if (app && app.name) {
                        appName = app.name;
                        logger.error("onUpdate script:: Fetched app name: " + appName);
                    } else {
                        logger.error("onUpdate script:: App " + appIdentifier + " has no name");
                    }
                } catch (appError) {
                    logger.error("onUpdate script:: Failed to fetch app " + appIdentifier + ": " + appError.message);
                }

                // Add to access map if both names are available
                if (appName && roleName) {
                    accessMap[appName] = roleName;
                    accessCount++;
                    logger.error("onUpdate script:: Added to access map: " + appName + " -> " + roleName);
                } else {
                    logger.error("onUpdate script:: Skipping access entry due to missing app or role name");
                }
            }

            // Convert access map to JSON string and set on target object
            if (accessCount > 0) {
                target.description = JSON.stringify(accessMap);
                logger.error("onUpdate script:: Set access attribute with " + accessCount + " entries: " + target.description);
            } else {
                target.description = "{}";
                logger.error("onUpdate script:: No valid access entries found, setting empty object");
            }

        } else {
            logger.error("onUpdate script:: No access objects found for user " + source._id);
            target.description = "{}";
        }

        */
        // Check if user has a userIdentity reference
        if (source.custom_userIdentity && source.custom_userIdentity._ref) {
            var userIdentityRef = source.custom_userIdentity._ref;
            logger.error("onUpdate script:: Fetching user_identity from: " + userIdentityRef);

            // Fetch the user_identity object
            var userIdentity = openidm.read(userIdentityRef);

            if (userIdentity) {
                logger.error("onUpdate script:: Successfully fetched user_identity: " + userIdentity._id);

                // Override givenName and sn with data from user_identity
                if (userIdentity.givenName) {
                    target.givenName = userIdentity.givenName;
                    logger.error("onUpdate script:: Set givenName from user_identity: " + userIdentity.givenName);
                } else {
                    logger.error("onUpdate script:: user_identity.givenName is null or missing");
                }

                if (userIdentity.sn) {
                    target.sn = userIdentity.sn;
                    logger.error("onUpdate script:: Set sn from user_identity: " + userIdentity.sn);
                } else {
                    logger.error("onUpdate script:: user_identity.sn is null or missing");
                }

                // if (userIdentity.dob) {
                //     target.dob = userIdentity.dob;
                //     logger.error("onUpdate script:: Set dob from user_identity: " + userIdentity.dob);
                // } else {
                //     logger.warn("user_identity.sn is null or missing");
                // }

            } else {
                logger.error("onUpdate script:: Could not fetch user_identity object from ref: " + userIdentityRef);
            }
        } else {
            logger.error("onUpdate script:: No custom_userIdentity reference found, using default givenName and sn from alpha_user");
        }

        // Log the target object being created
        logger.error("onUpdate script:: Final target object - givenName: " + target.givenName + ", sn: " + target.sn);
        return target;

    } catch (e) {
        logger.error("onUpdate script:: Error in onUpdate script: " + e.message);
        logger.error("onUpdate script:: Stack trace: " + e);

        return target;
    }
})();


