/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 if(nodeState.get("pointerFlag") === "False"){
    logger.debug("password with captcha outcome is false")
     nodeState.putShared("pointerFlag",null)
action.goTo("False")
 } else if(nodeState.get("pointerFlag") === "Back"){
    logger.debug("password with captcha outcome is back")
     nodeState.putShared("pointerFlag",null)
action.goTo("Back")
 }  else {
    logger.debug("password with captcha outcome is true")
     nodeState.putShared("pointerFlag",null)
    action.goTo("True")
 }