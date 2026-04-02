/*
 * Script to query managed/alpha_kyid_audit_logger and query every record
 * through the auditLogger function.
 */

//const queryFilter = "_id eq \"fe129669-e3ce-4388-a1b5-2e12e42f2e76\""; 
//const queryFilter = "createdDate sw \"2025-10\""; 
//const queryFilter = '(/createdDate sw "202" and /sessionId pr)';
const queryFilter = identityServer.getProperty("esv.2b.queryfilter.auditlogs.sqldb")
const auditLoggerManagedObj = "managed/alpha_kyid_audit_logger";

function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId,createdDateTime,createDateEpoch,ridpReferenceId,helpdeskVisibility) {
	try {
		logger.error("migrateExistingAuditLogsMO -KYID.2B1.Library.AuditLogger -- Inside Audit Logger");
		var requesteremailID = "";
		if (requesterUserId && requesterUserId !== "") {
			var userQueryFilter = '(_id eq "' + requesterUserId + '")';
			var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter }, ["mail"]);
			if (requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail) {
				requesteremailID = requesterUserObj.result[0].mail;
			}
		}
		var logPayload = {
			eventCode: eventCode,
			eventName: eventName,
			eventDetails: eventDetails,
			requesterUserId: requesterUserId,
			requestedUserId: requestedUserId,
			transactionId: transactionId,
			sessionDetails: sessionDetails || null,
			createdDate: createdDateTime,
			createdTimeinEpoch: createDateEpoch,
			emailId: emailId || "",
			applicationName: applicationName || "",
			sessionId: sessionRefId || "",
			requesterUseremailID: requesteremailID,
			requestedUseremailID: emailId || "",
      ridpReferenceId: ridpReferenceId || "",
      place: "",
      helpdeskVisibility: helpdeskVisibility || false,
		};
		logger.error(" migrateExistingAuditLogsMO KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
		try {
			const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
			logger.error(" migrateExistingAuditLogsMO Response from sendAuditLogstoDB is - " + JSON.stringify(sendlogstoDB));
		} catch (error) {
			logger.error(" migrateExistingAuditLogsMOException is -" + error);
		}

	} catch (error) {
		logger.error("migrateExistingAuditLogsMO KYIDAuditLogger ::error" + JSON.stringify(error));
		logger.error("migrateExistingAuditLogsMO KYIDAuditLogger ::error" + error);
	}
}

const response = openidm.query(auditLoggerManagedObj, {
	"_queryFilter": queryFilter
}, ["*"]);

const totalEntries = response && response.result ? response.result.length : 0;
logger.error("migrateExistingAuditLogsMO Total entries fetched: " + totalEntries + " for query filter: " + queryFilter);

if (totalEntries) {
	let processedCount = 0;
	response.result.forEach(entry => {
		auditLogger(
			entry.eventCode || "",
			entry.eventName || "",
			entry.sessionDetails || null,
			entry.eventDetails || {},
			entry.requesterUserId || "",
			entry.requestedUserId || "",
			entry.transactionId || "",
			entry.emailId || "",
			entry.applicationName || "",
			entry.sessionId || entry.sessionRefId || "",
      entry.createdDate || "",
      entry.createdTimeinEpoch || "",
      entry.ridpReferenceId || "",
      entry.helpdeskVisibility !== undefined ? entry.helpdeskVisibility : true
		);
		processedCount += 1;
	});
	logger.error("migrateExistingAuditLogsMO Total entries processed: " + processedCount + " out of " + totalEntries);
} else {
	logger.error("migrateExistingAuditLogsMO No audit logger entries found for query filter: " + queryFilter);
}


// const response = openidm.query(auditLoggerManagedObj, {
// 	"_queryFilter": queryFilter
// }, ["*"]);

// if (response && response.result && response.result.length) {
// 	response.result.forEach(entry => {
// 		auditLogger(
// 			entry.eventCode || "",
// 			entry.eventName || "",
// 			entry.sessionDetails || null,
// 			entry.eventDetails || {},
// 			entry.requesterUserId || "",
// 			entry.requestedUserId || "",
// 			entry.transactionId || "",
// 			entry.emailId || "",
// 			entry.applicationName || "",
// 			entry.sessionId || entry.sessionRefId || "",
//       entry.createdDate || "",
//       entry.createdTimeinEpoch || "",

// 		);
// 	});
// } else {
// 	logger.error("migrateExistingAuditLogsMO No audit logger entries found for query filter: " + queryFilter);
// }
