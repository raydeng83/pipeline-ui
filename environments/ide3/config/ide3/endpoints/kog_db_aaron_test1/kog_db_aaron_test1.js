/**
 * @name kog_db_aaron_test1
 * @description KOG Database Replacement Endpoint - Unified endpoint for user data retrieval
 * @author Deloitte
 * @date 2025-11-12
 * @version 1.0.0
 */

var UUID = java.util.UUID;

(function () {
    // Generate transaction ID
    const transactionId = UUID.randomUUID().toString();

    // Response codes
    const RESPONSE_CODE_SUCCESS = "0";
    const RESPONSE_CODE_ERROR = "2";

    // Request method
    const REQUEST_POST = "create";

    // Action codes
    const ACTION_SEARCH = 4;

    // View names
    const VIEW_FULL_DATA = "FullData";
    const VIEW_PROFILE_ONLY = "ProfileOnly";
    const VIEW_AUTHORIZATION_ONLY = "AuthorizationOnly";

    // Endpoint configuration
    const ENDPOINT_NAME = "endpoint/kog_db_aaron_test1";

    // Message templates
    const SUCCESS_MESSAGE = {
        code: "KYID-SUS",
        content: "Success"
    };

    try {
        // Only handle POST requests
        if (request.method === REQUEST_POST) {

            // Get request content
            const action = request.content.action;
            const payload = request.content.payload;

            // Validate request
            validateRequest(action, payload);

            // Handle action
            switch (action) {
                case ACTION_SEARCH:
                    return handleSearchAction(payload, transactionId);

                default:
                    throw createException(
                        RESPONSE_CODE_ERROR,
                        "KYID-USO",
                        "Unsupported action: " + action
                    );
            }

        } else {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-USO",
                "Method not allowed. Use POST."
            );
        }

    } catch (error) {
        logger.error(ENDPOINT_NAME + ": " + error.message);
        return createErrorResponse(error, transactionId);
    }

    /**
     * Validate request structure and required parameters
     */
    function validateRequest(action, payload) {
        if (!action) {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-IRE",
                "Missing required parameter: action"
            );
        }

        if (!payload) {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-IRE",
                "Missing required parameter: payload"
            );
        }

        if (!payload.view) {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-IRE",
                "Missing required parameter: payload.view"
            );
        }

        if (!payload.filters) {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-IRE",
                "Missing required parameter: payload.filters"
            );
        }

        if (!payload.filters.applicationName) {
            throw createException(
                RESPONSE_CODE_ERROR,
                "KYID-IRE",
                "Missing required parameter: payload.filters.applicationName"
            );
        }
    }

    /**
     * Handle search action - route to appropriate view handler
     */
    function handleSearchAction(payload, transactionId) {
        const view = payload.view;

        // Route to view handler
        switch (view) {
            case VIEW_FULL_DATA:
                return getFullDataView(payload, transactionId);

            case VIEW_PROFILE_ONLY:
                return getProfileOnlyView(payload, transactionId);

            case VIEW_AUTHORIZATION_ONLY:
                return getAuthorizationOnlyView(payload, transactionId);

            default:
                throw createException(
                    RESPONSE_CODE_ERROR,
                    "KYID-IRE",
                    "Invalid view: " + view + ". Supported views: FullData, ProfileOnly, AuthorizationOnly"
                );
        }
    }

    /**
     * Get full data view (profile + authorization)
     * Uses alpha_kyid_access as join table between users, apps, and roles
     */
    function getFullDataView(payload, transactionId) {
        const filters = payload.filters;

        const applicationName = filters.applicationName;
        const roleName = filters.roleName || null;
        const logon = filters.logon || null;
        const kogId = filters.kogId || null;

        try {
            // Step 1: Find the business application
            const app = findBusinessApplication(applicationName);
            if (!app) {
                return createSuccessResponse([], 0, transactionId);
            }

            const appId = app._id;

            // Step 2: Build access query filter (query alpha_kyid_access, not alpha_user!)
            var accessFilters = [];
            accessFilters.push('appIdentifier eq "' + appId + '"');
            accessFilters.push('recordState eq "0"'); // Active records only

            if (kogId) {
                accessFilters.push('userIdentifier eq "' + kogId + '"');
            }

            if (roleName) {
                // Find role by name using universal function
                var role = findRoleByName(roleName);
                if (role) {
                    accessFilters.push('roleIdentifier eq "' + role._id + '"');
                } else {
                    return createSuccessResponse([], 0, transactionId);
                }
            }

            const accessQueryFilter = accessFilters.join(" and ");

            // Step 3: Query alpha_kyid_access with relationships
            const accessQuery = {
                "_queryFilter": accessQueryFilter
            };
            const returnProperties = ["*", "user/*", "role/*", "app/*", "user/custom_userIdentity/*"];

            const accessRecords = openidm.query("managed/alpha_kyid_access", accessQuery, returnProperties);

            // Step 4: Filter by logon if specified (since we can't filter by logon in access table)
            var filteredRecords = accessRecords.result;
            if (logon) {
                filteredRecords = accessRecords.result.filter(function(record) {
                    return record.user && record.user.frIndexedString1 === logon;
                });
            }

            // Step 5: Transform to KOG format
            const results = transformAccessToKOGFormat(filteredRecords, applicationName);

            return createSuccessResponse(results, results.length, transactionId);

        } catch (error) {
            logger.error(ENDPOINT_NAME + ": FullData - " + error.message);
            throw error;
        }
    }

    /**
     * Get profile only view (no roles/authorization)
     * Uses alpha_kyid_access as join table
     */
    function getProfileOnlyView(payload, transactionId) {
        const filters = payload.filters;

        const applicationName = filters.applicationName;
        const roleName = filters.roleName || null;
        const kogId = filters.kogId || null;

        try {
            // Find application
            const app = findBusinessApplication(applicationName);
            if (!app) {
                return createSuccessResponse([], 0, transactionId);
            }

            const appId = app._id;

            // Build access query filter
            var accessFilters = [];
            accessFilters.push('appIdentifier eq "' + appId + '"');
            accessFilters.push('recordState eq "0"');

            if (kogId) {
                accessFilters.push('userIdentifier eq "' + kogId + '"');
            }

            if (roleName) {
                var role = findRoleByName(roleName);
                if (role) {
                    accessFilters.push('roleIdentifier eq "' + role._id + '"');
                } else {
                    return createSuccessResponse([], 0, transactionId);
                }
            }

            const accessQueryFilter = accessFilters.join(" and ");

            // Query alpha_kyid_access
            const accessQuery = {
                "_queryFilter": accessQueryFilter
            };
            const returnProperties = ["*", "user/*", "user/custom_userIdentity/*"];

            const accessRecords = openidm.query("managed/alpha_kyid_access", accessQuery, returnProperties);

            // Transform to KOG format (profile only)
            const results = transformAccessToProfileFormat(accessRecords.result);

            return createSuccessResponse(results, results.length, transactionId);

        } catch (error) {
            logger.error(ENDPOINT_NAME + ": ProfileOnly - " + error.message);
            throw error;
        }
    }

    /**
     * Get authorization only view (roles only, no full profile)
     * Uses alpha_kyid_access as join table
     */
    function getAuthorizationOnlyView(payload, transactionId) {
        const filters = payload.filters;

        const applicationName = filters.applicationName;
        const roleName = filters.roleName || null;
        const logon = filters.logon || null;

        try {
            // Find application
            const app = findBusinessApplication(applicationName);
            if (!app) {
                return createSuccessResponse([], 0, transactionId);
            }

            const appId = app._id;

            // Build access query filter
            var accessFilters = [];
            accessFilters.push('appIdentifier eq "' + appId + '"');
            accessFilters.push('recordState eq "0"');

            if (roleName) {
                var role = findRoleByName(roleName);
                if (role) {
                    accessFilters.push('roleIdentifier eq "' + role._id + '"');
                } else {
                    return createSuccessResponse([], 0, transactionId);
                }
            }

            const accessQueryFilter = accessFilters.join(" and ");

            // Query alpha_kyid_access
            const accessQuery = {
                "_queryFilter": accessQueryFilter
            };
            const returnProperties = ["*", "user/*", "role/*"];

            const accessRecords = openidm.query("managed/alpha_kyid_access", accessQuery, returnProperties);

            // Filter by logon if specified
            var filteredRecords = accessRecords.result;
            if (logon) {
                filteredRecords = accessRecords.result.filter(function(record) {
                    return record.user && record.user.frIndexedString1 === logon;
                });
            }

            // Transform to KOG format (authorization only)
            const results = transformAccessToAuthzFormat(filteredRecords, applicationName);

            return createSuccessResponse(results, results.length, transactionId);

        } catch (error) {
            logger.error(ENDPOINT_NAME + ": AuthorizationOnly - " + error.message);
            throw error;
        }
    }

    /**
     * Universal function to search managed object by name attribute
     * Based on access_v2B.searchObjectByIdAttributeValue pattern
     *
     * @param {String} resource - Managed object path (e.g., "managed/alpha_role")
     * @param {String} name - Name value to search for
     * @returns {Object|null} - First matching object or null if not found
     * @throws {Error} - If multiple objects found with same name
     */
    function findObjectByName(resource, name) {
        const filter = {
            "_queryFilter": 'name eq "' + name + '"'
        };

        const response = openidm.query(resource, filter, ["*"]);

        if (response && response.resultCount > 0) {
            if (response.result.length === 1) {
                return response.result[0];
            } else {
                // Multiple records found - this shouldn't happen if name is unique
                throw createException(
                    RESPONSE_CODE_ERROR,
                    "KYID-IRE",
                    "Multiple " + resource + " found with name: " + name + " (found " + response.result.length + " records)"
                );
            }
        } else {
            // Not found
            logger.warn(ENDPOINT_NAME + ": " + resource + " not found with name: " + name);
            return null;
        }
    }

    /**
     * Find business application by name (uses universal function)
     */
    function findBusinessApplication(applicationName) {
        return findObjectByName("managed/alpha_kyid_businessapplication", applicationName);
    }

    /**
     * Find role by name (uses universal function)
     */
    function findRoleByName(roleName) {
        return findObjectByName("managed/alpha_role", roleName);
    }

    /**
     * Transform access records to KOG format (FullData)
     * Takes alpha_kyid_access records with user/role/app relationships
     */
    function transformAccessToKOGFormat(accessRecords, applicationName) {
        const results = [];

        accessRecords.forEach(function(access) {
            const user = access.user || {};
            const role = access.role || {};
            const identity = user.custom_userIdentity || {};

            results.push({
                "UniqueID": user._id || "",
                "UserName": user.userName || "",
                "Logon": user.frIndexedString1 || "",
                "FirstName": user.givenName || "",
                "LastName": user.sn || "",
                "MiddleName": user.custom_middleName || "",
                "EmailAddress": user.mail || "",
                "AccountTypeName": user.custom_kyidAccountType || "",
                "LastModifiedDate": user.custom_updateDate || "",
                "Address1": identity.addressLine1 || "",
                "Address2": identity.addressLine2 || "",
                "City": identity.city || "",
                "State": identity.stateCode || "",
                "Zip": identity.zip || "",
                "AppName": applicationName,
                "Rolename": role.name || "",
                "RoleDisplayName": role.displayName || role.name || ""
            });
        });

        return results;
    }

    /**
     * Transform access records to Profile format (ProfileOnly)
     * Returns profile data without role information
     */
    function transformAccessToProfileFormat(accessRecords) {
        const results = [];
        const uniqueUsers = {};

        // Deduplicate users (same user may have multiple roles/access records)
        accessRecords.forEach(function(access) {
            const user = access.user || {};
            if (user._id && !uniqueUsers[user._id]) {
                const identity = user.custom_userIdentity || {};

                uniqueUsers[user._id] = {
                    "UniqueID": user._id || "",
                    "UserName": user.userName || "",
                    "Logon": user.frIndexedString1 || "",
                    "FirstName": user.givenName || "",
                    "LastName": user.sn || "",
                    "MiddleName": user.custom_middleName || "",
                    "EmailAddress": user.mail || "",
                    "AccountTypeName": user.custom_kyidAccountType || "",
                    "LastModifiedDate": user.custom_updateDate || "",
                    "Address1": identity.addressLine1 || "",
                    "Address2": identity.addressLine2 || "",
                    "City": identity.city || "",
                    "State": identity.stateCode || "",
                    "Zip": identity.zip || ""
                };
            }
        });

        // Convert to array
        for (var userId in uniqueUsers) {
            results.push(uniqueUsers[userId]);
        }

        return results;
    }

    /**
     * Transform access records to Authorization format (AuthorizationOnly)
     * Returns authorization data without full profile
     */
    function transformAccessToAuthzFormat(accessRecords, applicationName) {
        const results = [];

        accessRecords.forEach(function(access) {
            const user = access.user || {};
            const role = access.role || {};

            results.push({
                "UniqueID": user._id || "",
                "UserName": user.userName || "",
                "Logon": user.frIndexedString1 || "",
                "AppName": applicationName,
                "Rolename": role.name || "",
                "RoleDisplayName": role.displayName || role.name || ""
            });
        });

        return results;
    }

    /**
     * Create success response
     */
    function createSuccessResponse(data, count, transactionId) {
        return {
            code: RESPONSE_CODE_SUCCESS,
            level: "SUCCESS",
            message: SUCCESS_MESSAGE,
            timestamp: new Date().toISOString(),
            transactionId: transactionId,
            payload: {
                data: data,
                resultCount: count
            }
        };
    }

    /**
     * Create error response
     */
    function createErrorResponse(error, transactionId) {
        return {
            code: error.code || RESPONSE_CODE_ERROR,
            level: "ERROR",
            message: {
                code: error.errorCode || "KYID-UNR",
                content: error.message || "An unexpected error occurred"
            },
            timestamp: new Date().toISOString(),
            transactionId: transactionId,
            payload: null
        };
    }

    /**
     * Create exception object
     */
    function createException(code, errorCode, message) {
        return {
            code: code,
            errorCode: errorCode,
            message: message
        };
    }

}());
