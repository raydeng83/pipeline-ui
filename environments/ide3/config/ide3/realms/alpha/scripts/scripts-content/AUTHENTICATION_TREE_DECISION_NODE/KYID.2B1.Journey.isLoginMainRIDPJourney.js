 if (nodeState.get("journeyName") === "RIDP_LoginMain" || nodeState.get("journeyName")==="MFARecovery") { 
     logger.debug("ridp login main journey")
outcome = "true"         
} else {
     outcome = "false"
}
             