/**
 * @name <useractivity>
 * @description Endpoint to read, create, manage useractivity logs.
 *
 * @usage Action 4 - Get User Activity Logs with Advanced Filtering
 *
 * Request:
 * POST /openidm/endpoint/useractivity
 * {
 *   "action": 4,
 *   "payload": {
 *     "requestedUserId": "string",        // Required: User ID to query audit logs
 *     "returnParams": {},                 // Optional: Additional query parameters
 *     "showExtendedFields": boolean,      // Optional: Include extended fields (default: true)
 *     "filters": {                        // Optional: Advanced search filters
 *       "applications": ["string", ...],  // Optional: Filter by application names (match any)
 *       "roles": ["string", ...],         // Optional: Filter by role names (match any)
 *       "prerequisites": ["string", ...], // Optional: Filter by prerequisite names (match any)
 *       "startDate": "string",            // Optional: Start date (e.g., "2025-10-06" or "2025-10-06T00:00:00.000Z")
 *       "endDate": "string"               // Optional: End date (e.g., "2025-10-06" or "2025-10-06T23:59:59.999Z")
 *     }
 *   }
 * }
 *
 * Response:
 * {
 *   "totalCount": number,                 // Total number of unique sessions
 *   "accountActivity": [                  // Array of activities grouped by date
 *     {
 *       "title": {                        // Date label in multiple languages
 *         "en": "Today, October 6, 2025",
 *         "es": "Hoy, 6 de octubre de 2025"
 *       },
 *       "date": "10/06/2025",             // Date in MM/DD/YYYY format
 *       "activities": [                   // Array of session activities
 *         {
 *           "time": {...},                // Activity timestamp
 *           "place": {...},               // Location information
 *           "status": {...},              // Activity status/event name
 *           "deviceDetails": [...],       // Device information
 *           "applicationDetails": [...],  // Application details
 *           "AdditionalDetails": [...],   // Additional event details
 *           "subactivities": [...]        // Related activities in same session
 *         }
 *       ]
 *     }
 *   ],
 *   "AdvanceSearchDropdown": {            // Only returned when no filters applied
 *     "applications": ["string", ...],    // Array of available application names
 *     "roles": ["string", ...],           // Array of available role names
 *     "prerequisites": ["string", ...]    // Array of available prerequisite names
 *   }
 * }
 *
 * Notes:
 * - Records without sessionId are filtered out to ensure data quality
 * - Activities are grouped by sessionId within each date
 * - AdvanceSearchDropdown is only included when no filters are applied
 */

// DST helper: returns offset in hours for Eastern Time (UTC-4 or UTC-5)
function getEasternOffset(dateObj) {
    var year = dateObj.getUTCFullYear();
    // DST starts second Sunday in March, ends first Sunday in November
    var dstStart = new Date(Date.UTC(year, 2, 8, 7, 0, 0)); // March
    dstStart.setUTCDate(8 + (7 - dstStart.getUTCDay()) % 7);
    var dstEnd = new Date(Date.UTC(year, 10, 1, 6, 0, 0)); // November
    dstEnd.setUTCDate(1 + (7 - dstEnd.getUTCDay()) % 7);
    if (dateObj >= dstStart && dateObj < dstEnd) {
        return -4; // EDT
    }
    return -5; // EST
}

// Returns "EDT" or "EST"
function getEasternAbbreviation(dateObj) {
    return getEasternOffset(dateObj) === -4 ? "EDT" : "EST";
}

// Converts a UTC date to a Date object in Eastern time
function getEasternDate(dateObj) {
    var offset = getEasternOffset(dateObj);
    return new Date(dateObj.getTime() + offset * 60 * 60 * 1000);
}

// Returns a zero-padded string
function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
}

// Formats: "September 5, 2025 10:42:18 AM EDT"
function formatEasternDateTime(dateObj) {
    var easternDate = getEasternDate(dateObj);
    var abbr = getEasternAbbreviation(dateObj);
    var monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    var hours = easternDate.getHours();
    var minutes = pad2(easternDate.getMinutes());
    var seconds = pad2(easternDate.getSeconds());
    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    var timeStr = hour12 + ":" + minutes + ":" + seconds + " " + ampm;
    var dateStr = monthNames[easternDate.getMonth()] + " " +
        easternDate.getDate() + ", " +
        easternDate.getFullYear() + " " +
        timeStr + " " + abbr;
    return dateStr;
}

// Formats: "Today at 10:42:18 AM EDT"
function formatEasternTimeOnly(dateObj, prefix) {
    var easternDate = getEasternDate(dateObj);
    var abbr = getEasternAbbreviation(dateObj);
    var hours = easternDate.getHours();
    var minutes = pad2(easternDate.getMinutes());
    var seconds = pad2(easternDate.getSeconds());
    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    var timeStr = hour12 + ":" + minutes + ":" + seconds + " " + ampm + " " + abbr;
    return prefix + " " + timeStr;
}

// Formats: "Hoy a las 10:42:18 AM EDT"
function formatEasternTimeOnlyEs(dateObj, prefix) {
    var easternDate = getEasternDate(dateObj);
    var abbr = getEasternAbbreviation(dateObj);
    var hours = easternDate.getHours();
    var minutes = pad2(easternDate.getMinutes());
    var seconds = pad2(easternDate.getSeconds());
    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    var timeStr = hour12 + ":" + minutes + ":" + seconds + " " + ampm + " " + abbr;
    return prefix + " " + timeStr;
}

function isValidGuid(id) {
    // Matches standard GUID format (case-insensitive)
    return typeof id === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

function batchArray(arr, batchSize) {
    var batches = [];
    for (var i = 0; i < arr.length; i += batchSize) {
        batches.push(arr.slice(i, i + batchSize));
    }
    return batches;
}

/**
 * Returns device detail value for key (case-insensitive).
 * For "ip", if not found, also checks for "ipAddress" (case-insensitive).
 * For "operatingSystem", if not found, also checks for "os" (case-insensitive).
 */
function getDeviceDetail(item, eventDetailsObj, key) {
    if (item[key] && typeof item[key] === "string" && item[key].trim() !== "") {
        return item[key];
    }
    if (eventDetailsObj) {
        var lowerKey = key.toLowerCase();
        for (var k in eventDetailsObj) {
            if (eventDetailsObj.hasOwnProperty(k)) {
                if (k.toLowerCase() === lowerKey && eventDetailsObj[k] && typeof eventDetailsObj[k] === "string" && eventDetailsObj[k].trim() !== "") {
                    return eventDetailsObj[k];
                }
            }
        }
        if (lowerKey === "ip") {
            for (var k2 in eventDetailsObj) {
                if (eventDetailsObj.hasOwnProperty(k2)) {
                    if (k2.toLowerCase() === "ipaddress" && eventDetailsObj[k2] && typeof eventDetailsObj[k2] === "string" && eventDetailsObj[k2].trim() !== "") {
                        return eventDetailsObj[k2];
                    }
                }
            }
        }
        if (lowerKey === "operatingsystem") {
            for (var k3 in eventDetailsObj) {
                if (eventDetailsObj.hasOwnProperty(k3)) {
                    if (k3.toLowerCase() === "os" && eventDetailsObj[k3] && typeof eventDetailsObj[k3] === "string" && eventDetailsObj[k3].trim() !== "") {
                        return eventDetailsObj[k3];
                    }
                }
            }
        }
    }
    return undefined;
}

/**
 * Returns value for applicationLogo from eventDetailsObj (case-insensitive)
 */
function getApplicationLogo(eventDetailsObj) {
    if (eventDetailsObj) {
        for (var k in eventDetailsObj) {
            if (eventDetailsObj.hasOwnProperty(k)) {
                if (k.toLowerCase() === "applicationlogo" && eventDetailsObj[k] && typeof eventDetailsObj[k] === "string" && eventDetailsObj[k].trim() !== "") {
                    return eventDetailsObj[k];
                }
            }
        }
    }
    return undefined;
}

function getApplicationId(eventDetailsObj) {
    if (eventDetailsObj) {
        for (var k in eventDetailsObj) {
            if (eventDetailsObj.hasOwnProperty(k)) {
                if ((k.toLowerCase() === "applicationid" || k.toLowerCase() === "applicationName") && eventDetailsObj[k] && typeof eventDetailsObj[k] === "string" && eventDetailsObj[k].trim() !== "") {
                    return eventDetailsObj[k];
                }
            }
        }
    }
    return undefined;
}

/**
 * Parses a user-agent string and returns { browser, os }
 * example:
 * - browser: "Chrome 139.0.0.0"
 * - os: "Windows NT 10.0; Win64; x64"
 */
function parseUserAgent(userAgent) {
    var browser = "Unknown";
    var os = "Unknown";
    var version = "";

    if (typeof userAgent !== "string" || userAgent.trim() === "") {
        return { browser: browser, os: os };
    }

    // OS Extraction: everything inside first parentheses
    var osMatch = userAgent.match(/\(([^)]+)\)/);
    if (osMatch && osMatch[1]) {
        os = osMatch[1].trim(); // e.g., "Windows NT 10.0; Win64; x64"
    }

    // Browser Extraction (priority order)
    var browserRegexes = [
        { name: "Edge", regex: /Edg\/([0-9\.]+)/ },
        { name: "Chrome", regex: /Chrome\/([0-9\.]+)/ },
        { name: "Firefox", regex: /Firefox\/([0-9\.]+)/ },
        { name: "Safari", regex: /Version\/([0-9\.]+).*Safari/ },
        { name: "Internet Explorer", regex: /MSIE ([0-9\.]+)/ },
        { name: "Internet Explorer", regex: /Trident\/.*rv:([0-9\.]+)/ }
    ];

    for (var i = 0; i < browserRegexes.length; i++) {
        var match = userAgent.match(browserRegexes[i].regex);
        if (match) {
            browser = browserRegexes[i].name;
            version = match[1];
            break;
        }
    }

    // If Safari but not Chrome
    if (browser === "Unknown" && userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) {
        var safariMatch = userAgent.match(/Version\/([0-9\.]+).*Safari/);
        if (safariMatch) {
            browser = "Safari";
            version = safariMatch[1];
        }
    }

    // Fallback: just pick the first word after the last ")"
    if (browser === "Unknown") {
        var parts = userAgent.split(")");
        if (parts.length > 1) {
            var afterParen = parts[1];
            var fallbackMatch = afterParen.match(/([A-Za-z]+)\/([0-9\.]+)/);
            if (fallbackMatch) {
                browser = fallbackMatch[1];
                version = fallbackMatch[2];
            }
        }
    }

    if (version) {
        browser = browser + " " + version;
    }

    return { browser: browser, os: os };
}

// function getDateLabel(dateObj) {
//     // Always use Eastern time for all calculations
//     var easternDateObj = getEasternDate(dateObj);

//     var nowUtc = new Date();
//     var nowEastern = getEasternDate(nowUtc);

//     var today = new Date(nowEastern.getFullYear(), nowEastern.getMonth(), nowEastern.getDate());
//     var logDate = new Date(easternDateObj.getFullYear(), easternDateObj.getMonth(), easternDateObj.getDate());

//     var diffDays = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));

//     var monthNames = [
//         "January", "February", "March", "April", "May", "June",
//         "July", "August", "September", "October", "November", "December"
//     ];
//     var monthNamesEs = [
//         "enero", "febrero", "marzo", "abril", "mayo", "junio",
//         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
//     ];

//     var dateStr = ("0" + (easternDateObj.getMonth() + 1)).slice(-2) + "/" +
//                   ("0" + easternDateObj.getDate()).slice(-2) + "/" +
//                   easternDateObj.getFullYear();

//     var fullDateEn = monthNames[easternDateObj.getMonth()] + " " + easternDateObj.getDate() + ", " + easternDateObj.getFullYear();
//     var fullDateEs = easternDateObj.getDate() + " de " + monthNamesEs[easternDateObj.getMonth()] + " de " + easternDateObj.getFullYear();

//     if (diffDays === 0) {
//         return {
//             title: {
//                 en: "Today, " + fullDateEn,
//                 es: "Hoy, " + fullDateEs
//             },
//             date: dateStr,
//             timePrefix: { en: "Today at", es: "Hoy a las" }
//         };
//     } else if (diffDays === 1) {
//         return {
//             title: {
//                 en: "Yesterday, " + fullDateEn,
//                 es: "Ayer, " + fullDateEs
//             },
//             date: dateStr,
//             timePrefix: { en: "Yesterday at", es: "Ayer a las" }
//         };
//     } else if (diffDays < 7) {
//         return {
//             title: {
//                 // en: fullDateEn,
//                 // es: fullDateEs
//                 en: "Last week, " + fullDateEn,
//                 es: "La semana pasada, " + fullDateEs
//             },
//             date: dateStr,
//             //timePrefix: { en: "Last week "+fullDateEn+" at", es: "La semana pasada "+fullDateEs+" a las" }
//             timePrefix: { en: fullDateEn+" at", es: fullDateEs+" a las" }
//         };
//     } else if (
//         nowEastern.getMonth() === easternDateObj.getMonth() &&
//         nowEastern.getFullYear() === easternDateObj.getFullYear()
//     ) {
//         return {
//             title: {
//                 // en: fullDateEn,
//                 // es: fullDateEs
//                 en: "This month, " + fullDateEn,
//                 es: "Este mes, " + fullDateEs
//             },
//             date: dateStr,
//             //timePrefix: { en: "This month "+fullDateEn+" at", es: "Este mes "+fullDateEs+" a las" }
//             timePrefix: { en: fullDateEn+" at", es: fullDateEs+" a las" }
//         };
//     } else if (
//         (nowEastern.getMonth() - 1 === easternDateObj.getMonth() && nowEastern.getFullYear() === easternDateObj.getFullYear()) ||
//         (nowEastern.getMonth() === 0 && easternDateObj.getMonth() === 11 && nowEastern.getFullYear() - 1 === easternDateObj.getFullYear())
//     ) {
//         return {
//             title: {
//                 // en: fullDateEn,
//                 // es: fullDateEs
//                 en: "Last month, " + fullDateEn,
//                 es: "El mes pasado, " + fullDateEs
//             },
//             date: dateStr,
//             //timePrefix: { en: "Last month "+fullDateEn+" at", es: "El mes pasado "+fullDateEs+" a las" }
//             timePrefix: { en: fullDateEn+" at", es: fullDateEs+" a las" }
//         };
//     } else {
//         return {
//             title: {
//                 en: fullDateEn,
//                 es: fullDateEs
//             },
//             date: dateStr,
//             timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
//         };
//     }
// }

function getDateLabel(dateObj) {
    var logEasternDateObj = getEasternDate(dateObj);
    var nowUtc = new Date();
    var nowEasternDateObj = getEasternDate(nowUtc);

    // Truncate time for comparison
    var todayEastern = new Date(
        nowEasternDateObj.getFullYear(),
        nowEasternDateObj.getMonth(),
        nowEasternDateObj.getDate()
    );
    var logDayEastern = new Date(
        logEasternDateObj.getFullYear(),
        logEasternDateObj.getMonth(),
        logEasternDateObj.getDate()
    );

    var diffDays = Math.floor((todayEastern - logDayEastern) / (1000 * 60 * 60 * 24));

    var monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    var monthNamesEs = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    var dateStr = ("0" + (logEasternDateObj.getMonth() + 1)).slice(-2) + "/" +
                  ("0" + logEasternDateObj.getDate()).slice(-2) + "/" +
                  logEasternDateObj.getFullYear();

    var fullDateEn = monthNames[logEasternDateObj.getMonth()] + " " + logEasternDateObj.getDate() + ", " + logEasternDateObj.getFullYear();
    var fullDateEs = logEasternDateObj.getDate() + " de " + monthNamesEs[logEasternDateObj.getMonth()] + " de " + logEasternDateObj.getFullYear();

    // Week calculations (Sunday as first day of week)
    function getWeekStart(date) {
        var d = new Date(date);
        var day = d.getDay(); // 0 = Sunday
        d.setDate(d.getDate() - day);
        d.setHours(0,0,0,0);
        return d;
    }
    function getWeekEnd(date) {
        var d = new Date(date);
        var day = d.getDay();
        d.setDate(d.getDate() + (6 - day));
        d.setHours(23,59,59,999);
        return d;
    }

    var todayWeekStart = getWeekStart(todayEastern);
    var todayWeekEnd = getWeekEnd(todayEastern);
    var lastWeekStart = new Date(todayWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    var lastWeekEnd = new Date(todayWeekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    if (diffDays === 0) {
        return {
            title: { en: "Today, " + fullDateEn, es: "Hoy, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: "Today at", es: "Hoy a las" }
        };
    } else if (diffDays === 1) {
        return {
            title: { en: "Yesterday, " + fullDateEn, es: "Ayer, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: "Yesterday at", es: "Ayer a las" }
        };
    } else if (logDayEastern >= todayWeekStart && logDayEastern <= todayWeekEnd) {
        return {
            title: { en: "This week, " + fullDateEn, es: "Esta semana, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
        };
    } else if (logDayEastern >= lastWeekStart && logDayEastern <= lastWeekEnd) {
        return {
            title: { en: "Last week, " + fullDateEn, es: "La semana pasada, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
        };
    } else if (
        nowEasternDateObj.getMonth() === logEasternDateObj.getMonth() &&
        nowEasternDateObj.getFullYear() === logEasternDateObj.getFullYear()
    ) {
        return {
            title: { en: "This month, " + fullDateEn, es: "Este mes, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
        };
    } else if (
        (nowEasternDateObj.getMonth() - 1 === logEasternDateObj.getMonth() && nowEasternDateObj.getFullYear() === logEasternDateObj.getFullYear()) ||
        (nowEasternDateObj.getMonth() === 0 && logEasternDateObj.getMonth() === 11 && nowEasternDateObj.getFullYear() - 1 === logEasternDateObj.getFullYear())
    ) {
        return {
            title: { en: "Last month, " + fullDateEn, es: "El mes pasado, " + fullDateEs },
            date: dateStr,
            timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
        };
    } else {
        return {
            title: { en: fullDateEn, es: fullDateEs },
            date: dateStr,
            timePrefix: { en: fullDateEn + " at", es: fullDateEs + " a las" }
        };
    }
}

/**
 * Check if an audit record matches the application filter
 * @param {Object} item - The audit record
 * @param {Object} eventDetailsObj - Parsed eventDetails JSON
 * @param {Array} filterApps - Array of application names to match (OR logic)
 * @returns {Boolean} true if matches any filter value, false otherwise
 */
function checkApplicationMatch(item, eventDetailsObj, filterApps) {
    if (!filterApps || !Array.isArray(filterApps) || filterApps.length === 0) {
        return true;
    }

    // Check item.applicationName (top-level field, may be comma-separated)
    if (item.applicationName) {
        var appNames = item.applicationName.split(',');
        for (var i = 0; i < appNames.length; i++) {
            if (filterApps.indexOf(appNames[i].trim()) !== -1) {
                return true;
            }
        }
    }

    // Check eventDetails.applicationNames array
    if (eventDetailsObj && eventDetailsObj.applicationNames && Array.isArray(eventDetailsObj.applicationNames)) {
        for (var j = 0; j < eventDetailsObj.applicationNames.length; j++) {
            if (filterApps.indexOf(eventDetailsObj.applicationNames[j]) !== -1) {
                return true;
            }
        }
    }

    // Check eventDetails.applicationName string
    if (eventDetailsObj && eventDetailsObj.applicationName && filterApps.indexOf(eventDetailsObj.applicationName) !== -1) {
        return true;
    }

    return false;
}

/**
 * Check if an audit record matches the role filter
 * @param {Object} eventDetailsObj - Parsed eventDetails JSON
 * @param {Array} filterRoles - Array of role names to match (OR logic)
 * @returns {Boolean} true if matches any filter value, false otherwise
 */
function checkRoleMatch(eventDetailsObj, filterRoles) {
    if (!eventDetailsObj) {
        return false;
    }

    if (!filterRoles || !Array.isArray(filterRoles) || filterRoles.length === 0) {
        return true;
    }

    // Check roleNames array
    if (eventDetailsObj.roleNames && Array.isArray(eventDetailsObj.roleNames)) {
        for (var i = 0; i < eventDetailsObj.roleNames.length; i++) {
            if (filterRoles.indexOf(eventDetailsObj.roleNames[i]) !== -1) {
                return true;
            }
        }
    }

    // Check roleName string
    if (eventDetailsObj.roleName && filterRoles.indexOf(eventDetailsObj.roleName) !== -1) {
        return true;
    }

    // Check removedRoles array (contains objects with 'role' property)
    if (eventDetailsObj.removedRoles && Array.isArray(eventDetailsObj.removedRoles)) {
        for (var j = 0; j < eventDetailsObj.removedRoles.length; j++) {
            if (eventDetailsObj.removedRoles[j].role && filterRoles.indexOf(eventDetailsObj.removedRoles[j].role) !== -1) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check if an audit record matches the prerequisite filter
 * @param {Object} eventDetailsObj - Parsed eventDetails JSON
 * @param {Array} filterPrereqs - Array of prerequisite names to match (OR logic)
 * @returns {Boolean} true if matches any filter value, false otherwise
 */
function checkPrerequisiteMatch(eventDetailsObj, filterPrereqs) {
    if (!eventDetailsObj) {
        return false;
    }

    if (!filterPrereqs || !Array.isArray(filterPrereqs) || filterPrereqs.length === 0) {
        return true;
    }

    // Check if prerequisiteName matches any filter value (OR logic)
    return filterPrereqs.indexOf(eventDetailsObj.prerequisiteName) !== -1;
}

function getAuditLogsByRequestedUserId(requestedUserId, returnParams, showExtendedFields, filters) {
    try {
        if (!requestedUserId) {
            throw { code: 400, message: 'requestedUserId is required' };
        }
        var queryFilter = '/requestedUserId eq "' + requestedUserId + '"';

        // Add date range filters if provided
        if (filters) {
            if (filters.startDate) {
                queryFilter += ' and /createdDate ge "' + filters.startDate + '"';
            }
            if (filters.endDate) {
                queryFilter += ' and /createdDate le "' + filters.endDate + '"';
            }
        }
      var clientName = null
      if(context && context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.client_id ){
        clientName = context.oauth2.rawInfo.client_id
      }
      if(clientName === "kyid-portal-id"){
        logger.error("clientName is "+ clientName)
          queryFilter += ' and !(/helpdeskVisibility eq true)';
        logger.error("queryFilter is "+ JSON.stringify(queryFilter))
      }else{
        //  queryFilter += ' and !(sspVisibility eq true)';
        // logger.error("queryFilter is "+ JSON.stringify(queryFilter))
      }

        var response = openidm.query("managed/alpha_kyid_audit_logger", { "_queryFilter": queryFilter }, returnParams);
        if (!response || !response.result || response.result.length === 0) {
            return {
                totalCount: 0,
                accountActivity: [],
                AdvanceSearchDropdown: {
                    applications: [],
                    roles: [],
                    prerequisites: []
                }
            };
        }

        // Group activities by date (MM/DD/YYYY)
        var grouped = {};
        var dateMeta = {};
        var totalCount = response.result.length;

        // Sort all records by createdDate/createdTimeinEpoch descending
        var sortedRecords = response.result.slice().sort(function(a, b) {
            var aTime = a.createdDate ? new Date(a.createdDate).getTime() : Number(a.createdTimeinEpoch);
            var bTime = b.createdDate ? new Date(b.createdDate).getTime() : Number(b.createdTimeinEpoch);
            return bTime - aTime;
        });

        // Collect all unique user IDs from audit logs
        var allUserIds = {};
        for (var i = 0; i < response.result.length; i++) {
            var item = response.result[i];
            if (item.requestedUserId && isValidGuid(item.requestedUserId)) allUserIds[item.requestedUserId] = true;
            if (item.requesterUserId && isValidGuid(item.requesterUserId)) allUserIds[item.requesterUserId] = true;
        }
        var userIdList = Object.keys(allUserIds);

        // Query alpha_user in batches
        var userMailMap = {};
        if (userIdList.length > 0) {
            var batches = batchArray(userIdList, 50); // try 50, adjust as needed
            for (var b = 0; b < batches.length; b++) {
                var batch = batches[b];
                var userQueryFilter = batch.map(function(id) { return '_id eq "' + id + '"'; }).join(' or ');
                try {
                    logger.error("Query Filter for managed/alpha_user: " + userQueryFilter);
                    var userResponse = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ['_id', 'mail']);
                    logger.error("Query Response for managed/alpha_user: " + JSON.stringify(userResponse));
                    if (userResponse && userResponse.result) {
                        for (var i = 0; i < userResponse.result.length; i++) {
                            var user = userResponse.result[i];
                            userMailMap[user._id] = user.mail || user._id;
                        }
                    }
                } catch (e) {
                    logger.error("Error querying managed/alpha_user batch: " + JSON.stringify(e));
                }
            }
        }

        // var userMailMap = {};
        // if (userIdList.length > 0) {
        //     var userQueryFilter = userIdList.map(function(id) { return '_id eq "' + id + '"'; }).join(' or ');
        //     try {
        //         logger.error("Query Filter for managed/alpha_user: " + userQueryFilter);
        //         var userResponse = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter, fields: ['_id', 'mail'] });
        //         logger.error("Query Response for managed/alpha_user: " + JSON.stringify(userResponse));
        //         if (userResponse && userResponse.result) {
        //             for (var i = 0; i < userResponse.result.length; i++) {
        //                 var user = userResponse.result[i];
        //                 userMailMap[user._id] = user.mail || user._id;
        //             }
        //         }
        //     } catch (e) {
        //         logger.error("Error querying managed/alpha_user: " + JSON.stringify(e));
        //         // If query fails, just leave userMailMap empty and fallback to IDs below
        //     }
        // }

        // Collect unique values for AdvanceSearchDropdown
        var uniqueApplications = {};
        var uniqueRoles = {};
        var uniquePrerequisites = {};

        // Build grouped activities by date
        for (var i = 0; i < sortedRecords.length; i++) {
            var item = sortedRecords[i];

            // Skip records without sessionId (data quality issue)
            if (!item.sessionId) {
                continue;
            }
            var dateObj = item.createdDate ? new Date(item.createdDate) : new Date(Number(item.createdTimeinEpoch));
            var easternDateObj = getEasternDate(dateObj);
            var dateStr = ("0" + (easternDateObj.getMonth() + 1)).slice(-2) + "/" +
                          ("0" + easternDateObj.getDate()).slice(-2) + "/" +
                          easternDateObj.getFullYear();

            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
                dateMeta[dateStr] = getDateLabel(dateObj);
            }

            // Parse eventDetails JSON
            var additionalDetails = [];
            var eventDetailsObj = undefined;

            // Exclude certain keys always
            var alwaysExcluded = [
                "os",
                "operatingsystem",
                "browser",
                "ip",
                "ipaddress",
                "sessionrefid",
                "applicationlogo",
                "applicationid",
                "applicationname",
                "error",
                "userprerequisiteid",
                "failurepoint"
            ];


            // Extract applicationName from top-level field (stored by auditLogger)
            if (item.applicationName && typeof item.applicationName === "string" && item.applicationName.trim() !== "") {
                // Handle comma-separated or toString() format from arrays
                var appNames = item.applicationName.split(',');
                for (var appIdx = 0; appIdx < appNames.length; appIdx++) {
                    var appName = appNames[appIdx].trim();
                    if (appName) {
                        uniqueApplications[appName] = true;
                    }
                }
            }

            if (item.eventDetails) {
                try {
                    eventDetailsObj = JSON.parse(item.eventDetails);

                    // Extract data for AdvanceSearchDropdown
                    // Applications from eventDetails (for endpoints that store it there)
                    if (eventDetailsObj.applicationNames && Array.isArray(eventDetailsObj.applicationNames)) {
                        for (var appIdx = 0; appIdx < eventDetailsObj.applicationNames.length; appIdx++) {
                            var appName = eventDetailsObj.applicationNames[appIdx];
                            if (appName && typeof appName === "string" && appName.trim() !== "") {
                                uniqueApplications[appName] = true;
                            }
                        }
                    } else if (eventDetailsObj.applicationName && typeof eventDetailsObj.applicationName === "string" && eventDetailsObj.applicationName.trim() !== "") {
                        uniqueApplications[eventDetailsObj.applicationName] = true;
                    }

                    // Roles - extract from roleNames (standardized field)
                    if (eventDetailsObj.roleNames && Array.isArray(eventDetailsObj.roleNames)) {
                        for (var roleIdx = 0; roleIdx < eventDetailsObj.roleNames.length; roleIdx++) {
                            var roleName = eventDetailsObj.roleNames[roleIdx];
                            if (roleName && typeof roleName === "string" && roleName.trim() !== "") {
                                uniqueRoles[roleName] = true;
                            }
                        }
                    } else if (eventDetailsObj.roleName && typeof eventDetailsObj.roleName === "string" && eventDetailsObj.roleName.trim() !== "") {
                        uniqueRoles[eventDetailsObj.roleName] = true;
                    }

                    // Also extract from removedRoles array (contains objects with 'role' property)
                    if (eventDetailsObj.removedRoles && Array.isArray(eventDetailsObj.removedRoles)) {
                        for (var rmIdx = 0; rmIdx < eventDetailsObj.removedRoles.length; rmIdx++) {
                            var removedRoleObj = eventDetailsObj.removedRoles[rmIdx];
                            if (removedRoleObj && removedRoleObj.role && typeof removedRoleObj.role === "string" && removedRoleObj.role.trim() !== "") {
                                uniqueRoles[removedRoleObj.role] = true;
                            }
                        }
                    }

                    // Prerequisites
                    if (eventDetailsObj.prerequisiteName && typeof eventDetailsObj.prerequisiteName === "string" && eventDetailsObj.prerequisiteName.trim() !== "") {
                        uniquePrerequisites[eventDetailsObj.prerequisiteName] = true;
                    }

                    for (var key in eventDetailsObj) {
                        if (eventDetailsObj.hasOwnProperty(key)) {
                            var lowerKey = key.toLowerCase();

                            // Exclude always-excluded keys (already shown in deviceDetails or not needed)
                            if (alwaysExcluded.indexOf(lowerKey) !== -1) {
                                continue;
                            }

                            var rawValue = eventDetailsObj[key];
                            var formattedValue = "";

                            if (rawValue === null || rawValue === undefined) {
                                formattedValue = "";
                            } else if (typeof rawValue === "string") {
                                formattedValue = rawValue;
                            } else if (typeof rawValue === "number" || typeof rawValue === "boolean") {
                                formattedValue = String(rawValue);
                            } else if (typeof rawValue === "object") {
                                // Array or Object - convert to JSON string
                                try {
                                    formattedValue = JSON.stringify(rawValue);
                                } catch (e) {
                                    formattedValue = String(rawValue);
                                }
                            } else {
                                formattedValue = String(rawValue);
                            }
                          if(key && key.toLowerCase() === "lexisnexisrequest"){
                            key = "Lexis Nexis Request"
                          }
                          else if(key && key.toLowerCase() === "lexisnexisresponse"){
                            key = "Lexis Nexis Response"
                          }
                          else if(key && key.toLowerCase() === "usecase"){
                            key = "Use Case"
                            if(formattedValue && formattedValue.toLowerCase() === "createaccount"){
                              formattedValue = "Create Account"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "appenroll"){
                              formattedValue = "Application Enrollment"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "forgotpassword"){
                              formattedValue = "Forgot Password"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "updateprofile"){
                              formattedValue = "Update Profile"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "firsttimelogin"){
                              formattedValue = "First Time Login"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "mfarecovery"){
                              formattedValue = "MFA Recovery"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "organdonor"){
                              formattedValue = "Organ Donor"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "forgotemail"){
                              formattedValue = "Forgot Email"
                            }
                            else if(formattedValue && formattedValue.toLowerCase() === "userverification"){
                              formattedValue = "User Verification"
                            }
                          }
                         else if(key && key.toLowerCase() === "message"){
                            key = "Message"
                          }
                         else if(key && key.toLowerCase() === "reason"){
                            key = "Event Reason"
                          }
                         else if(key && key.toLowerCase() === "useridentityrecord"){
                            key = "User Identity"
                          }
                         else if(key && key.toLowerCase() === "usecaseinput"){
                            key = "Use Case Input"
                          }


                            additionalDetails.push({
                                label: { en: key, es: key },
                                value: formattedValue
                            });   
                        }
                    }
                } catch (e) {
                    logger.error("Failed to parse eventDetails for _id " + item._id + ": " + item.eventDetails);
                }
            }

            var requesterMail = (item.requesterUserId && isValidGuid(item.requesterUserId) && userMailMap[item.requesterUserId])
                ? userMailMap[item.requesterUserId]
                : (item.requesterUserId || "");

            var requestedMail = (item.requestedUserId && isValidGuid(item.requestedUserId) && userMailMap[item.requestedUserId])
                ? userMailMap[item.requestedUserId]
                : (item.requestedUserId || "");

            additionalDetails.push({
                label: { en: "Requested By", es: "Solicitado por:" },
                value: requesterMail
            });
            additionalDetails.push({
                label: { en: "Requested For", es: "Solicitado para:" },
                value: requestedMail
            });

            if (showExtendedFields === undefined || showExtendedFields === null) {
                showExtendedFields = true;
            }
            if (showExtendedFields) {
                if (item.sessionId && typeof item.sessionId === "string" && item.sessionId.trim() !== "") {
                    additionalDetails.push({
                        label: { en: "Session ID", es: "Session ID" },
                        value: item.sessionId
                    });
                }
                if (item.transactionId && typeof item.transactionId === "string" && item.transactionId.trim() !== "") {
                    additionalDetails.push({
                        label: { en: "Transaction ID", es: "Transaction ID" },
                        value: item.transactionId
                    });
                }
                if (item.eventCode && typeof item.eventCode === "string" && item.eventCode.trim() !== "") {
                    additionalDetails.push({
                        label: { en: "Event Code", es: "Event Code" },
                        value: item.eventCode
                    });
                }
            }

            // Device details with fallback to eventDetails (case-insensitive)
            var browser = getDeviceDetail(item, eventDetailsObj, "browser") || "Unknown";
            var operatingSystem = getDeviceDetail(item, eventDetailsObj, "operatingSystem") || "Unknown";
            var uaParsed = parseUserAgent(browser);
            browser = uaParsed.browser || browser;
            operatingSystem = uaParsed.os || operatingSystem;
            var ip = getDeviceDetail(item, eventDetailsObj, "ip") || "Unknown";
            var cpu = getDeviceDetail(item, eventDetailsObj, "cpu") || "Unknown";
            var deviceName = getDeviceDetail(item, eventDetailsObj, "deviceName") || "Unknown";

            var deviceDetailsArr = [
                {
                    deviceName: { en: deviceName, es: deviceName === "Unknown" ? "Desconocido" : deviceName },
                    operatingSystem: { en: operatingSystem, es: operatingSystem === "Unknown" ? "Desconocido" : operatingSystem },
                    cpu: { en: cpu, es: cpu === "Unknown" ? "Desconocido" : cpu },
                    browser: { en: browser, es: browser === "Unknown" ? "Desconocido" : browser },
                    ip: ip
                }
            ];

            // Application details as array (add logic to push multiple apps if applicable)
            var appDateTime = formatEasternDateTime(dateObj);
            var applicationLogo = getApplicationLogo(eventDetailsObj);
            var applicationId = getApplicationId(eventDetailsObj);
            var applicationDetailsObj = {
                ApplicationName: { en: item.applicationName || "Unknown", es: item.applicationName || "Desconocido" },
                DateTime: appDateTime
            };
            if (applicationLogo) {
                applicationDetailsObj.ApplicationLogo = applicationLogo;
            }
            if (!item.applicationName && applicationId) {
                applicationDetailsObj.ApplicationName = { en: applicationId || "Unknown", es: applicationId || "Desconocido" }
            }
            var applicationDetailsArr = [applicationDetailsObj]; //dharjani - commenting to stop showing app details section

            var timeStrEn = formatEasternTimeOnly(dateObj, dateMeta[dateStr].timePrefix.en);
            var timeStrEs = formatEasternTimeOnlyEs(dateObj, dateMeta[dateStr].timePrefix.es);
            // logger.error("endpoint-useractivity is --> "+JSON.stringify(context))
            var activity = {
                time: {
                    en: timeStrEn,
                    es: timeStrEs
                },
                place: {
                    en: item.place || "Unknown",
                    es: item.place || "Desconocido"
                },
                status: {
                    en: item.eventName || "Unknown",
                    es: item.eventName || "Desconocido"
                },
                deviceDetails: deviceDetailsArr,
                applicationDetails: applicationDetailsArr,
                AdditionalDetails: additionalDetails.length > 0 ? additionalDetails : undefined,
                _sessionId: item.sessionId || null,
                _eventCode: item.eventCode || null,
                _dateStr: dateStr 
            };

            // Attach sessionId, eventCode, and timestamp for grouping and sorting logic
            activity._sessionId = item.sessionId || null;
            activity._eventCode = item.eventCode || null;
            activity._dateStr = dateStr;
            activity._timestamp = dateObj.getTime(); // Unix timestamp in milliseconds for accurate sorting
            // if(item.idProofingDetails){
            //       activity.useCase=item.idProofingDetails.useCase || null
            //       activity.useCaseInput=item.idProofingDetails.useCaseInput || null
            //       activity.lexisnexisRequest=item.idProofingDetails.lexisnexisRequest || null
            //       activity.lexisnexisResponse=item.idProofingDetails.lexisnexisResponse || null
            //       activity.reason=item.idProofingDetails.reason || null
            // }

            // Apply filters at individual record level (not session level)
            if (filters) {
                var matchesFilter = true;

                if (filters.applications) {
                    matchesFilter = matchesFilter && checkApplicationMatch(item, eventDetailsObj, filters.applications);
                }

                if (filters.roles) {
                    matchesFilter = matchesFilter && checkRoleMatch(eventDetailsObj, filters.roles);
                }

                if (filters.prerequisites) {
                    matchesFilter = matchesFilter && checkPrerequisiteMatch(eventDetailsObj, filters.prerequisites);
                }

                if (!matchesFilter) {
                    continue; // Skip this individual record
                }
            }

            grouped[dateStr].push(activity);
        }

        // --- NEW LOGIC STARTS HERE ---
        // For each date, group activities by sessionId
        var accountActivity = [];
        var sortedDates = Object.keys(grouped).sort(function (a, b) {
            var aParts = a.split('/');
            var bParts = b.split('/');
            var aDate = new Date(aParts[2], aParts[0] - 1, aParts[1]);
            var bDate = new Date(bParts[2], bParts[0] - 1, bParts[1]);
            return bDate - aDate;
        });

        for (var k = 0; k < sortedDates.length; k++) {
            var dStr = sortedDates[k];
            var activitiesArr = grouped[dStr];
            var sessionMap = {}; // sessionId -> array of activities

            // Group by sessionId
            for (var i = 0; i < activitiesArr.length; i++) {
                var act = activitiesArr[i];
                if (!act._sessionId) continue;
                if (!sessionMap[act._sessionId]) sessionMap[act._sessionId] = [];
                sessionMap[act._sessionId].push(act);
            }

            var sessionActivities = [];
            for (var sessionId in sessionMap) {
                if (!sessionMap.hasOwnProperty(sessionId)) continue;
                var sessionActs = sessionMap[sessionId];

                // Sort sessionActs by timestamp ascending (earliest first)
                sessionActs.sort(function(a, b) {
                    return (a._timestamp || 0) - (b._timestamp || 0);
                });

                // Find "Successful Login" with eventCode LOG001
                var mainIdx = -1;
                for (var j = 0; j < sessionActs.length; j++) {
                    if (
                        sessionActs[j].status &&
                        sessionActs[j].status.en === "Successful Login" &&
                        sessionActs[j]._eventCode === "LOG001"
                    ) {
                        mainIdx = j;
                        break;
                    }
                }
                if (mainIdx === -1) mainIdx = 0; // fallback: first activity

                var mainActivity = sessionActs[mainIdx];
                var subactivities = [];
                for (var j = 0; j < sessionActs.length; j++) {
                    if (j !== mainIdx) {
                        var subact = Object.assign({}, sessionActs[j]);
                        // Remove helper fields
                        delete subact._sessionId;
                        delete subact._eventCode;
                        delete subact._dateStr;
                        delete subact._timestamp;
                        subactivities.push(subact);
                    }
                }
                // Remove helper fields from main
                delete mainActivity._sessionId;
                delete mainActivity._eventCode;
                delete mainActivity._dateStr;
                delete mainActivity._timestamp;
                mainActivity.subactivities = subactivities;

                sessionActivities.push(mainActivity);
            }

            // Only add the date if there are activities
            if (sessionActivities.length > 0) {
                accountActivity.push({
                    title: dateMeta[dStr].title,
                    date: dStr,
                    activities: sessionActivities
                });
            }
        }

        // --- NEW LOGIC ENDS HERE ---

        // Count of unique session IDs
        var uniqueSessionIds = {};
        for (var d = 0; d < accountActivity.length; d++) {
            var acts = accountActivity[d].activities;
            for (var s = 0; s < acts.length; s++) {
                var sid = null;
                if (acts[s].AdditionalDetails) {
                    for (var adIdx = 0; adIdx < acts[s].AdditionalDetails.length; adIdx++) {
                        var det = acts[s].AdditionalDetails[adIdx];
                        if (det.label && det.label.en === "Session ID") {
                            sid = det.value;
                            break;
                        }
                    }
                }
                if (sid) uniqueSessionIds[sid] = true;
            }
        }

        // Build response - only include AdvanceSearchDropdown if no filters are applied
        var response = {
            totalCount: Object.keys(uniqueSessionIds).length,
            accountActivity: accountActivity
        };

        // Only include AdvanceSearchDropdown when not using advanced search filters
        if (!filters || (!filters.applications && !filters.roles && !filters.prerequisites && !filters.startDate && !filters.endDate)) {
            var applications = Object.keys(uniqueApplications).sort();
            var roles = Object.keys(uniqueRoles).sort();
            var prerequisites = Object.keys(uniquePrerequisites).sort();

            response.AdvanceSearchDropdown = {
                applications: applications,
                roles: roles,
                prerequisites: prerequisites
            };
        }

        return response;

    } catch (error) {
        logger.error("getAuditLogsByRequestedUserId error is - " + JSON.stringify(error));
        throw { code: 500, message: error };
    }
}

function decodeAccessToken(token) {
    try {
        logger.error("decodeAccessToken ::inside " );
        //get the payload and replace the invalid character for base64url
        let tokenPayload = token.split(".")[1]
        tokenPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/')

        //padding with =
        let pad = tokenPayload.length % 4
        if (pad) {

            tokenPayload += new Array(5 - pad).join('=')
        }

        //Decode the String
        let decodedTokenPayload = java.lang.String(java.util.Base64.getDecoder().decode(tokenPayload), "UTF-8").toString()
 
        logger.error("decodeAccessToken ::inside "+JSON.parse(decodedTokenPayload).sessionRefId);    
        return JSON.parse(decodedTokenPayload).sessionRefId

    } catch (error) {
        logger.error("decodeAccessToken ::inside "+error);   
        throw {
            code: 400,
            message: "Exception when decode access token"
        }
    }
}


function auditLogger(eventCode, eventName, eventDetails, requesterUserId, requestedUserId, emailId, applicationID, transactionId, sessionRefID) {
    try {
        logger.error("Inside Audit Logger - Create Log Method")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();

         //Defect Fix# 211192 (Unknown Location) - 03/12  ----BEGIN
          sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
           sessionRefId = deepParse(sessionRefId)
           logger.error("In endpoint/useractivity:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))
      
           var city = sessionRefId.city || "";
            var state = sessionRefId.state || "";
            var country = sessionRefId.country || "";
              
            var placeParts = [];
            if (city && city !== undefined && city !== "undefined") {
              placeParts.push(city);
            }
            if (state && state !== undefined && state !== "undefined") {
              placeParts.push(state);
            }
            if (country && country !== undefined && country !== "undefined" && (country.toUpperCase() !== "US" || country.toUpperCase() !== "UNITED STATES" )) {
              placeParts.push(country);
            }
        
            logger.error("***placeParts in endpoint/useractivity => "+placeParts)
            var place = "";
             if(!city){
                 logger.error("city empty in event details")
                 place = "Unknown Location"
             } else{
                 logger.error("placeParts")
              place = placeParts.join(", ");
             }
         //Defect Fix# 211192 (Unknown Location) - 03/12 ----END
      
        var logPayload = {
            eventCode:eventCode,
            eventName: eventName,
            eventDetails: JSON.stringify(eventDetails),
            requesterUserId: requesterUserId,
            requestedUserId: requestedUserId,
            transactionId: transactionId,
            //sessionDetails:sessionDetails?JSON.stringify(sessionDetails):null,
            createdDate: createdDate,
            createdTimeinEpoch: currentTimeinEpoch,
            emailId: emailId || "",
            applicationName: applicationID || "",
            sessionId: sessionRefId.sessionRefId || "",      //Defect Fix# 211192 (Unknown Location) - 03/12
            place: place || ""   //Defect Fix# 211192 (Unknown Location) - 03/12
            //sessionId: sessionRefID || ""
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));

      //23-Feb PA for sending logs to DB
      try{
   const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
   logger.error("Response from sendAuditLogstoDB is - "+JSON.stringify(sendlogstoDB))
   } catch(error){
	logger.error("Exception from sendAuditLogstoDB is -"+error)
   }
      
    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
    }
       
}

function findNestedKeyByType(obj, key, type) {
    if (typeof type === "undefined" || type === null) {
        type = "primitive";
    }
    if (obj && typeof obj === "object") {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (k === key) {
                    if (type === "object" && typeof obj[k] === "object" && obj[k] !== null) {
                        return obj[k];
                    }
                    if (type === "primitive" && (typeof obj[k] !== "object" || obj[k] === null)) {
                        return obj[k];
                    }
                }
                if (obj[k] && typeof obj[k] === "object") {
                    var result = findNestedKeyByType(obj[k], key, type);
                    if (result !== null && result !== undefined) {
                        return result;
                    }
                }
            }
        }
    }
    return null;
}

(function () {

    const validateEndptRequestBody = {
        "payload": context,
        "action": 0
    }
  
    try {
        let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
        logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
        if(res.status === 200){
          logger.error("Continue executing endpoint...")
        } else {
          return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }
  
    var payload = request.content && request.content.payload;
    var action = request.content && request.content.action;
    logger.error("Inside User Activity Endpoint: Request Method = " + request.method + " - Action = " + action);
    logger.error("Inside User Activity Endpoint: Payload = " + JSON.stringify(payload));
    try{
        logger.error("Inside User Activity Action 1 Function TRY");
        if (request.method == "create") {
            logger.error("Inside User Activity Action 1 Function CREATE");
            if (action === 1) {
                logger.error("Inside User Activity Action 1 Function ACTION 1");
                try {
                    logger.error("Inside User Activity Action 1 Function");
                    var eventCode = payload && payload.eventCode;
                    var eventName = payload && payload.eventName;
                    var eventDetails = payload && payload.eventDetails;
                    var requesterUserId = payload && payload.requesterUserId;
                    var requestedUserId = payload && payload.requestedUserId;
                    var emailId = payload && payload.emailId;
                    var applicationID = payload && payload.applicationID;
                    var transactionId = null;
                    //var nestedTransactionId = findNestedKeyByType(context, "transactionId", "object");
                    //logger.error("Inside User Activity Action 1 Function Request Ready for Logging. Transaction Id Context = " + JSON.stringify(nestedTransactionId));
                    //transactionId = nestedTransactionId && nestedTransactionId.hasOwnProperty("value") ? nestedTransactionId.value : null;
                    var nestedSessionId = findNestedKeyByType(context, "sessionRefId");
                    //var sessionRefID = nestedSessionId ? decodeAccessToken(nestedSessionId) : null;
                    var sessionRefID = nestedSessionId;
                    logger.error("Inside User Activity Action 1 Function Request Ready for Logging. Context = " + JSON.stringify(context));
                    logger.error("Inside User Activity Action 1 Function Request Ready for Logging");
                    try {
                        auditLogger(eventCode, eventName, eventDetails, requesterUserId, requestedUserId, emailId, applicationID, transactionId, sessionRefID);
                        logger.error("User Activity Logging Successful");
                        return {code: 200, message: "user activity record creation success"}
                    } catch(error) {
                        logger.error("User Activity Logging failed: " + error);
                        return {code: 200, message: "user activity record creation failed"}
                    }
                } catch(error) {
                    logger.error("User Activity Request Creation failed: " + error);
                    return {code: 200, message: "user activity record creation failed"}
                }
            } else if (action === 2) {
                throw { code: 501, message: 'Action 2 (patch) not implemented yet.' };
            } else if (action === 4) {
                var requestedUserId = payload && payload.requestedUserId;
                var returnParams = payload && payload.returnParams;
                var showExtendedFields = (payload && payload.showExtendedFields !== undefined) ? payload.showExtendedFields : true;
                var filters = payload && payload.filters; // Extract filters for advanced search
                return getAuditLogsByRequestedUserId(requestedUserId, returnParams, showExtendedFields, filters);
            } else {
                throw { code: 400, message: 'Unknown action' };
            }
        } else if (request.method === 'read') {
            return {};
        } else if (request.method === 'update') {
            return {};
        } else if (request.method === 'patch') {
            return {};
        } else if (request.method === 'delete') {
            return {};
        }
        throw { code: 500, message: 'Unknown error' };
    } catch(error){
      return error;
    }
    
}());

/**
* @name getException
* @description Get exception details
*
* @param {JSON} exception
* @returns {JSON} exception.
*/
function getException(e) {
    let _ = require('lib/lodash');
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

function currentDate() {
    let currentDate = Date.now();
    return new Date(current).toISOString();

}


function deepParse(data) {
  // If it's not a string, we can't parse it further
  if (typeof data !== 'string') {
    return data;
  }

  try {
    const parsed = JSON.parse(data);
    // If the parsed result is still a string, keep parsing
    return deepParse(parsed);
  } catch (e) {
    // If JSON.parse fails, it's a regular string, so return it
    return data;
  }
}