/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var n=nodeState.get("chooseanothermethod")
var ExistedPhone=nodeState.get("ExistedPhone")
logger.error("***********************************"+n)
if(n==="true" || ExistedPhone==="true"){
    nodeState.putShared("chooseanothermethod","false")
    nodeState.putShared("ExistedPhone","false")

    action.goTo("true")
    logger.error("*****************going to true******************"+n)

}
else{

        action.goTo("false")
        logger.error("*****************going to false******************"+n)


}
