(function () {
    var mailRaw = nodeState.get("EmailAddress");
    var kogidRaw = nodeState.get("KOGID");

    var mail = mailRaw ? String(mailRaw).trim().toLowerCase() : null;
    var kogid = kogidRaw ? String(kogidRaw).trim() : null;

    try {
        var resp = openidm.query("managed/alpha_kyid_deltausers", { "_queryFilter": "true" }, ["restrictedEmail", "restrictedKOGID"]);
        logger.error("restricted_entries response: " + JSON.stringify(resp));

        if (!resp || !resp.result || resp.result.length === 0) {
            logger.error("No alpha_kyid_deltausers records found; defaulting to proceed");
            action.goTo("proceed");
            return;
        }

        var record = resp.result[0] || {};
        var emailArray = record.restrictedEmail || [];
        var kogidArray = record.restrictedKOGID || [];

        // Build Sets for efficient lookups
        var restrictedEmailsSet = {};
        for (var i = 0; i < emailArray.length; i++) {
            var e = emailArray[i] && emailArray[i].EmailIDs;
            if (e) {
                restrictedEmailsSet[String(e).trim().toLowerCase()] = true;
            }
        }

        var restrictedKOGIDsSet = {};
        for (var j = 0; j < kogidArray.length; j++) {
            var k = kogidArray[j] && kogidArray[j].KOGID;
            if (k) {
                restrictedKOGIDsSet[String(k).trim()] = true;
            }
        }

        var emailRestricted = !!(mail && restrictedEmailsSet[mail] === true);
        var kogidRestricted = !!(kogid && restrictedKOGIDsSet[kogid] === true);
        var isRestricted = emailRestricted || kogidRestricted;

        logger.error("mail=" + mail + " kogid=" + kogid + " emailRestricted=" + emailRestricted + " kogidRestricted=" + kogidRestricted + " isRestricted=" + isRestricted);

        if (isRestricted) {
            logger.error("user wait")
            nodeState.putShared("failedOrInactive","Please wait for sometime before logging in")
            action.goTo("wait");
        } else {
            logger.error("user proceed")
            action.goTo("proceed");
        }
    } catch (e) {
        logger.error("Exception while evaluating restrictions: " + e);
        // Decide your fail stance. Here: proceed on error.
        action.goTo("proceed");
    }
}());

// function normalizeToArray(maybeArrayOrString) {
//     if (maybeArrayOrString === null || maybeArrayOrString === undefined) return [];
//     if (Array.isArray(maybeArrayOrString)) return maybeArrayOrString;
//     if (typeof maybeArrayOrString === "string") {
//         try { return JSON.parse(maybeArrayOrString); } catch (e) { return []; }
//     }
//     return [];
// }

// function checkRestrictedEntries(inputFlag) {
//     logger.error("Inside check restricted entries");
//     try {
//         var response = openidm.query("managed/alpha_kyid_deltausers/", { _queryFilter: "true" }, ["*"]);
//         if (!response || !response.result || response.result.length === 0) return [];

//         var rec = response.result[0] || {};

//         if (inputFlag === "email") {
//             var restrictedEmailArray = normalizeToArray(rec.restrictedEmail);
//             var emails = [];

//             for (var i = 0; i < restrictedEmailArray.length; i++) {
//                 var row = restrictedEmailArray[i] || {};
//                 var emailVal = row.EmailIDs // supports common variants
//                 if (emailVal) emails.push(String(emailVal).trim().toLowerCase());
//             }

//             logger.error("restricted emails normalized: " + JSON.stringify(emails));
//             return emails;

//         } else if (inputFlag === "kogid") {
//             var restrictedKOGIDArray = normalizeToArray(rec.restrictedKOGID);
//             var kogids = [];

//             for (var j = 0; j < restrictedKOGIDArray.length; j++) {
//                 var row2 = restrictedKOGIDArray[j] || {};
//                 var kogidVal = row2.KOGID || row2.kogid || row2.Kogid;
//                 if (kogidVal) kogids.push(String(kogidVal).trim());
//             }

//             logger.error("restricted kogids normalized: " + JSON.stringify(kogids));
//             return kogids;
//         }

//         return [];
//     } catch (e) {
//         logger.error("Exception in checkRestrictedEntries: " + e);
//         return [];
//     }
// }

// // --- routing ---
// var mail = nodeState.get("EmailAddress");
// var kogid = nodeState.get("KOGID");

// var restrictedEmails = checkRestrictedEntries("email");
// var restrictedKOGIDs = checkRestrictedEntries("kogid");

// var isRestricted =
//     (mail && restrictedEmails.indexOf(String(mail).trim().toLowerCase()) !== -1) ||
//     (kogid && restrictedKOGIDs.indexOf(String(kogid).trim()) !== -1);

// logger.error("mail=" + mail + " kogid=" + kogid + " isRestricted=" + isRestricted);

// if (isRestricted) {
//      logger.error("user wait")
//     action.goTo("wait");
// } else {
//      logger.error("user proceed")
//     action.goTo("proceed");
// }