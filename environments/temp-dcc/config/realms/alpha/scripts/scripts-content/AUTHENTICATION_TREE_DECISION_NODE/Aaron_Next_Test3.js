/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var share = nodeState.get("share")

nodeState.putShared("share123123", share)


var tran = nodeState.get("tran")

nodeState.putShared("tran123123", tran)

outcome = "true";
