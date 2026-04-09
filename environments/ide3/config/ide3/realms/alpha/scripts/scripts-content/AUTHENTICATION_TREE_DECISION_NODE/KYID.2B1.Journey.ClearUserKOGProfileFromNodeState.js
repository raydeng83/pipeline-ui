/**
 * Script: KYID.Journey.ClearUserKOGProfileFromSharedState
 * Description: This script is used to removed user KOG profile information from sharedstate.
 * Date: 26th July 2024
 * Author: Deloitte
 */

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
};
logger.debug("JITComplpeted!");
nodeState.putShared("kogUserProfileAPIResponse","");

action.goTo(nodeOutcome.SUCCESS);
