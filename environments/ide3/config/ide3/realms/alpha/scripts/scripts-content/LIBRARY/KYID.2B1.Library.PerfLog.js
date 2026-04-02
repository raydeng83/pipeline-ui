/**
 * Script: KYID.2B1.Library.PerfLog
 * Description: Performance logging utility for measuring operation durations
 *
 * Usage:
 *   var perfLog = require("KYID.2B1.Library.PerfLog");
 *   // perfLog.init(logger);  // Optional: pass custom logger, defaults to global logger
 *
 *   // Method 1: Script-level timing (for measuring entire script execution)
 *   var scriptTimer = perfLog.scriptStart("KYID.2B1.Journey.ScriptName");
 *   // ... script logic ...
 *   perfLog.scriptEnd(scriptTimer, "KOGID", "123456");
 *
 *   // Method 2: Timer-based (for individual operations)
 *   var timer = perfLog.start("OperationName", "email", "user@example.com");
 *   // ... your operation ...
 *   perfLog.end(timer);
 *
 *   // Method 3: Checkpoint-based (for measuring from a specific start time)
 *   // Note: checkpoint() is not currently used, reserved for special cases
 *   perfLog.checkpoint("CheckpointName", startTime, "KOGID", "123456");
 */

// Read from ESV, defaults to true if not set
// ESV: esv.kyid.2b.perflog.enabled (set to "false" to disable)
var PERF_LOG_ENABLED = (function() {
    try {
        var esvValue = systemEnv.getProperty("esv.kyid.2b.perflog.enabled");
        if (esvValue) {
            return esvValue !== "false";
        }
    } catch (e) {
        // systemEnv not available, use default
    }
    return true; // default to enabled if ESV not set or error
})();

var _logger = null; // External logger reference

exports.enabled = PERF_LOG_ENABLED;

exports.init = function(externalLogger) {
    _logger = externalLogger;
};

/**
 * Start a timer for an operation
 * @param {string} operation - Name of the operation
 * @param {string} identifierType - Type of identifier (e.g., "email", "KOGID", "userKyid")
 * @param {string} identifierValue - Identifier value for correlation
 * @returns {object} Timer object to pass to end()
 */
exports.start = function(operation, identifierType, identifierValue) {
    return {
        op: operation,
        idType: identifierType || "unknown",
        idValue: identifierValue || "unknown",
        startTime: Date.now()
    };
};

/**
 * End a timer and log the elapsed time
 * @param {object} timer - Timer object from start()
 * @returns {number} Elapsed time in ms
 */
exports.end = function(timer) {
    if (!PERF_LOG_ENABLED) return 0;
    var elapsed = Date.now() - timer.startTime;
    var log = _logger || logger;
    log.error("PERF[LIB]::" + timer.op + "::" + elapsed + "ms::" + timer.idType + "::" + timer.idValue);
    return elapsed;
};

/**
 * Log checkpoint with elapsed time from a start time
 * @param {string} operation - Name of the operation
 * @param {number} startTime - Start time from Date.now()
 * @param {string} identifierType - Type of identifier (e.g., "email", "KOGID", "userKyid")
 * @param {string} identifierValue - Identifier value for correlation
 * @returns {number} Elapsed time in ms
 */
exports.checkpoint = function(operation, startTime, identifierType, identifierValue) {
    if (!PERF_LOG_ENABLED) return 0;
    var elapsed = Date.now() - startTime;
    var log = _logger || logger;
    log.error("PERF[LIB]::" + operation + "::" + elapsed + "ms::" + (identifierType || "unknown") + "::" + (identifierValue || "unknown"));
    return elapsed;
};

exports.getScriptStartTime = function() {
    return Date.now();
};

/**
 * Log script start and return timer for scriptEnd
 * @param {string} scriptName - Name of the script
 * @returns {object} Script timer object
 */
exports.scriptStart = function(scriptName) {
    var startTime = Date.now();
    if (!PERF_LOG_ENABLED) return { name: scriptName, start: startTime };
    var log = _logger || logger;
    log.error("PERF[LIB][SCRIPT_START]::" + scriptName);
    return {
        name: scriptName,
        start: startTime
    };
};

/**
 * Log script end with total elapsed time
 * @param {object} scriptTimer - Timer from scriptStart()
 * @param {string} identifierType - Type of identifier (e.g., "email", "KOGID", "userKyid")
 * @param {string} identifierValue - Identifier value for correlation
 * @returns {number} Elapsed time in ms
 */
exports.scriptEnd = function(scriptTimer, identifierType, identifierValue) {
    if (!PERF_LOG_ENABLED) return 0;
    var elapsed = Date.now() - scriptTimer.start;
    var log = _logger || logger;
    log.error("PERF[LIB][SCRIPT_END]::" + scriptTimer.name + "::" + elapsed + "ms::" + (identifierType || "unknown") + "::" + (identifierValue || "unknown"));
    return elapsed;
};
