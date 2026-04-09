// WebAuthn Device Management Endpoint
var VERSION = "v2.0.0";
var BASE_URL = "https://openam-commkentsb3-use1-sandbox.id.forgerock.io/am/json/realms/root/realms/alpha";

// Action definitions
var ACTION_LIST_DEVICES = 1;
var ACTION_UPDATE_DEVICE = 2;
var ACTION_DELETE_DEVICE = 3;

// Main endpoint logic
(function () {
    if (request.method === 'create') {
        var accessToken = getAccessToken();
        var payload = request.content || {};
        var action = payload.action;
        var userId = payload.userId;
        var deviceId = payload.deviceId;
        var deviceName = payload.deviceName;

        if (!accessToken) {
            return {
                success: false,
                message: "No access token found",
                timestamp: new Date().toISOString()
            };
        }

        var result = null;

        // Action 1: List all WebAuthn devices for a user
        if (action === ACTION_LIST_DEVICES) {
            if (!userId) {
                return {
                    success: false,
                    message: "userId is required for action 1 (list devices)",
                    timestamp: new Date().toISOString()
                };
            }

            var listUrl = BASE_URL + "/users/" + userId + "/devices/2fa/webauthn?_queryId=*";
            result = httpGet(listUrl, {
                "Authorization": "Bearer " + accessToken,
                "accept": "application/json, text/plain, */*",
                "accept-api-version": "protocol=2.1,resource=1.0"
            });

            return {
                success: true,
                action: ACTION_LIST_DEVICES,
                actionName: "List Devices",
                userId: userId,
                result: result,
                timestamp: new Date().toISOString()
            };
        }

        // Action 2: Update device name
        else if (action === ACTION_UPDATE_DEVICE) {
            if (!userId || !deviceId || !deviceName) {
                return {
                    success: false,
                    message: "userId, deviceId, and deviceName are required for action 2 (update device)",
                    timestamp: new Date().toISOString()
                };
            }

            var updateUrl = BASE_URL + "/users/" + userId + "/devices/2fa/webauthn/" + deviceId;
            result = httpPut(
                updateUrl,
                { "deviceName": deviceName },
                {
                    "Authorization": "Bearer " + accessToken,
                    "accept": "application/json, text/plain, */*",
                    "accept-api-version": "protocol=2.1,resource=1.0",
                    "Content-Type": "application/json"
                }
            );

            return {
                success: true,
                action: ACTION_UPDATE_DEVICE,
                actionName: "Update Device Name",
                userId: userId,
                deviceId: deviceId,
                newDeviceName: deviceName,
                result: result,
                timestamp: new Date().toISOString()
            };
        }

        // Action 3: Delete device
        else if (action === ACTION_DELETE_DEVICE) {
            if (!userId || !deviceId) {
                return {
                    success: false,
                    message: "userId and deviceId are required for action 3 (delete device)",
                    timestamp: new Date().toISOString()
                };
            }

            var deleteUrl = BASE_URL + "/users/" + userId + "/devices/2fa/webauthn/" + deviceId;
            result = httpDelete(deleteUrl, {
                "Authorization": "Bearer " + accessToken,
                "accept": "application/json, text/plain, */*",
                "accept-api-version": "protocol=2.1,resource=1.0"
            });

            return {
                success: true,
                action: ACTION_DELETE_DEVICE,
                actionName: "Delete Device",
                userId: userId,
                deviceId: deviceId,
                result: result,
                timestamp: new Date().toISOString()
            };
        }

        // Invalid action
        else {
            return {
                success: false,
                message: "Invalid action. Supported actions: 1 (list), 2 (update), 3 (delete)",
                providedAction: action,
                timestamp: new Date().toISOString()
            };
        }
    } else {
        throw {
            code: 405,
            message: "Method not allowed: " + request.method + " (Only POST/create is supported)"
        };
    }
}());

/**
 * Extract bearer token from request headers
 * @returns {string|null} The access token without "Bearer " prefix, or null if not found
 */
function getAccessToken() {
    try {
        var headers = context.parent.parent.parent.headers;
        var authHeader = headers.Authorization || headers.authorization;

        // Authorization comes as array - get first element
        if (authHeader && Array.isArray(authHeader) && authHeader.length > 0) {
            authHeader = authHeader[0];
        }

        // Extract token from "Bearer TOKEN" format
        if (authHeader && typeof authHeader === 'string' && authHeader.indexOf('Bearer ') === 0) {
            return authHeader.substring(7); // Remove 'Bearer ' prefix
        }
    } catch (e) {
        // Silently handle errors
    }
    return null;
}

/**
 * Make HTTP GET request to external API
 * @param {string} url - The URL to call
 * @param {object} headers - Optional headers
 * @returns {object} API response
 */
function httpGet(url, headers) {
    try {
        var params = {
            "url": url,
            "method": "GET",
            "headers": headers || {
                "Content-Type": "application/json"
            }
        };
        return openidm.action("external/rest", "call", params);
    } catch (e) {
        return { error: "HTTP GET failed: " + e.message };
    }
}

/**
 * Make HTTP POST request to external API
 * @param {string} url - The URL to call
 * @param {object} body - Request body
 * @param {object} headers - Optional headers
 * @returns {object} API response
 */
function httpPost(url, body, headers) {
    try {
        var params = {
            "url": url,
            "method": "POST",
            "headers": headers || {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(body)
        };
        return openidm.action("external/rest", "call", params);
    } catch (e) {
        return { error: "HTTP POST failed: " + e.message };
    }
}

/**
 * Make HTTP PUT request to external API
 * @param {string} url - The URL to call
 * @param {object} body - Request body
 * @param {object} headers - Optional headers
 * @returns {object} API response
 */
function httpPut(url, body, headers) {
    try {
        var params = {
            "url": url,
            "method": "PUT",
            "headers": headers || {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(body)
        };
        return openidm.action("external/rest", "call", params);
    } catch (e) {
        return { error: "HTTP PUT failed: " + e.message };
    }
}

/**
 * Make HTTP DELETE request to external API
 * @param {string} url - The URL to call
 * @param {object} headers - Optional headers
 * @returns {object} API response
 */
function httpDelete(url, headers) {
    try {
        var params = {
            "url": url,
            "method": "DELETE",
            "headers": headers || {
                "Content-Type": "application/json"
            }
        };
        return openidm.action("external/rest", "call", params);
    } catch (e) {
        return { error: "HTTP DELETE failed: " + e.message };
    }
}
