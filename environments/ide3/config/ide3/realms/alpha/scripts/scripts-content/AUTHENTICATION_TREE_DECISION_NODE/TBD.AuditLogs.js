logger.error("PA-->the ESV-AUDITHISTORY-SECRET"+ systemEnv.getProperty("esv-audithistory-secret"))
logger.error("PA-->the esv-kyid-2b-kogapi-token-clientcredentials"+ systemEnv.getProperty("esv-kyid-2b-kogapi-token-clientcredentials"))
logger.error("PA-->the esv-kyid-2b-kogapi-token-clientid"+ systemEnv.getProperty("esv-kyid-2b-kogapi-token-clientid"))
outcome = "true"

// logger.error("Executing TBD.AuditLogs Script");

//     var logPayload = {
//     "eventCode": "MFA009",
//     "eventName": "MFA Authentication Success",
//     "eventDetails": {
//       "IP": "205.204.186.1",
//       "Browser": null,
//       "OS": null,
//       "applicationName": "KYID Portal",
//       "applicationLogo": "kyid-portal-ui.png",
//       "MFATYPE": "forgerock"
//     },
//     "requesterUserId": "163ece4a-16f8-421b-950d-1c47e20972f4",
//     "requestedUserId": "163ece4a-16f8-421b-950d-1c47e20972f4",
//     "transactionId": "00-27b979bb5b0301fe4164ebf391be3871-85da2c573c149aa1-01/0",
//     "sessionDetails": { "sessionRefId": "fb891e51-de9e-4974-beb9-7199a386d439" },
//     "createdDate": "2025-09-29T16:25:24.757Z",
//     "createdTimeinEpoch": 1759163124757,
//     "emailId": "jerzhu@deloitte.com",
//     "applicationName": "12345-12345",
//     "sessionId": "fb891e51-de9e-4974-beb9-7199a386d439",
//     "place": "KY"
//   }
//     logger.error("KYIDAuditLogger logPayload :::" + JSON.stringify(logPayload));

//   // var idmPatchResponse;
//   //   try {
//   //     idmPatchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
//   //     logger.error("KYIDAuditLogger :: patchResponse from IDM :" + JSON.stringify(idmPatchResponse));
//   //   } catch (repoErr) {
//   //     logger.error("KYIDAuditLogger :: IDM create failed :: " + repoErr);
//   //   }

//     var patchResponse;
//     try {
//     //   var apiRequest = {
//     //     method: "POST",
//     //     headers: {
//     //         "Content-Type": "application/json"
//     //         },
//     //     body: logPayload
//     //   }  
//     //   // var apiURL = "https://sih.uat.kyid.ky.gov/external/api/ide3/UserActivityLogs?subscription-key=255b0e1d46ec488c95dab3bef2c55b94";  
//     //   //var apiURL = "https://sih.uat.kyid.ky.gov/external/api/ide3/UserAuditLogs?subscription-key=255b0e1d46ec488c95dab3bef2c55b94";

//     //     var apiURL = ""
//     //     if(systemEnv.getProperty("esv.kyid.sih.auditlogsdb") && systemEnv.getProperty("esv.kyid.sih.auditlogsdb")!=null) {
//     //          apiURL = systemEnv.getProperty("esv.kyid.sih.auditlogsdb");   
//     //     }  else {
//     //          logger.debug("sihlogdburl is not present");
//     //     }
// var sihcertforlogapi;
// if (systemEnv.getProperty("esv.kyid.cert.logs.client") && systemEnv.getProperty("esv.kyid.cert.logs.client") != null) {
//     sihcertforlogapi = systemEnv.getProperty("esv.kyid.cert.logs.client");
//     logger.error("the sihcertforlogapi"+sihcertforlogapi)
// } else {
//     logger.error("sihcertforlogapi is missing");
// }
//        var requestOptions = {
//         clientName: "kyidLogsHttpClient",
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Ocp-Apim-Subscription-Key": "255b0e1d46ec488c95dab3bef2c55b94"
//             },
//         body: logPayload
//       }
//       //   var requestOptions = {
//       //   clientName: "kyidLogsHttpClient",
//       //   method: "POST",
//       //   headers: {
//       //       "Content-Type": "application/json"
//       //       },
//       //   body: logPayload
//       // }
//        //var apiURL = "https://perf.sih.ngateway.ky.gov/external/api/ide3/UserActivityLogs"; 
//         logger.error("the requestOptions::"+JSON.stringify(requestOptions))
//         logger.error("the pem cert is"+ systemEnv.getProperty("esv.2b.kyid.mtls.pfx.cert.logs"))
//    var apiURL = "https://perf.sih.ngateway.ky.gov/external/api/ide3/UserActivityLogs"
//         //var apiURL = "https://perf.sih.ngateway.ky.gov/external/api/ide3/UserActivityLogs?subscription-key=255b0e1d46ec488c95dab3bef2c55b94"
//       //var apiResponse = httpClient.send(apiURL, apiRequest).get();
//     var res = httpClient.send(apiURL, requestOptions).get();
//       //  action.withHeader(`Response code: ${res.status}`);
//       logger.error("KYIDAuditLogger apiResponse status :: " + res.status + " :: response :: "+  res.text());
//     } catch (httpErr) {
//       logger.error("KYIDAuditLogger :: HTTP request failed :: " + httpErr);
//     }
// outcome = "true"