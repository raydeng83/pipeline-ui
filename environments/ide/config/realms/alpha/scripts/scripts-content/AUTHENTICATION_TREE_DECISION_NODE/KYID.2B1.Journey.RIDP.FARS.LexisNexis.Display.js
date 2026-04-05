var pageHeader= {"pageHeader": "5_Unable_To_verify"};
nodeState.putShared("patchPrereq",null)
callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader))
var response = {"apiCalls":[],"message":"appEnroll_ID_Proofing_Completed","status":"NOT_STARTED"}
callbacksBuilder.textOutputCallback(0,JSON.stringify(response));