/*
 * Copyright 2024-2025 Ping Identity Corporation. All Rights Reserved
 *
 * This code is to be used exclusively in connection with Ping Identity
 * Corporation software or services. Ping Identity Corporation only offers
 * such software or services to legal entities who have entered into a
 * binding license agreement with Ping Identity Corporation.
 */
/*
  - Data made available by nodes that have already executed is available in the nodeState variable.
  - Use the action object to set the outcome of the node.
 */


if(nodeState.get("EntityID")){
    logger.error("EntityID in KYID.2B1.Journey.checkIfAppRequiresMFA script => "+nodeState.get("EntityID"))
    var entityID = nodeState.get("EntityID")
    var listOfEntityIDRequiresMFA = systemEnv.getProperty("esv.apps.require.authcontext").split(",")
    if(listOfEntityIDRequiresMFA.includes(entityID)){
        logger.error("Application found which requires MFA")
		action.goTo("true").putSessionProperty('evaluateSSOAuthContext', "true")
	} else {
        logger.error("No Application found which requires MFA")
		action.goTo("true").putSessionProperty('evaluateSSOAuthContext', "false")
	}
} 
action.goTo("true") 



/*if(nodeState.get("appName")){
    logger.error("Appname in KYID.2B1.Journey.checkIfAppRequiresMFA script => "+appName)
    var appName = nodeState.get("appName")
    //appName = "Kynect Benefits"
  //  var listOfAppRequiresMFA = systemEnv.getProperty("esv.apps.require.authcontext").split(",")
 //   if(listOfAppRequiresMFA.includes(appName)){
    if(true){
        logger.error("App found which requires MFA")
		action.goTo("true").putSessionProperty('evaluateSSOAuthContext', "true")
	} else {
        logger.error("No App found which requires MFA")
		action.goTo("true").putSessionProperty('evaluateSSOAuthContext', "false")
	}
}
logger.error("No appName exist in sharedState in KYID.2B1.Journey.checkIfAppRequiresMFA script")
action.goTo("true")
*/


