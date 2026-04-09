if (nodeState.get("helpdeskjourney") === "true" && requestParameters.get("_id")) {
    var endUserFirstName = nodeState.get("firstName") || nodeState.get("givenName") || "";
    var endUserLastName = nodeState.get("lastName") || "";

    nodeState.putShared("givenName", endUserFirstName);
    nodeState.putShared("lastName", endUserLastName);

    action.goTo("helpdeskjourney");
} 
else if(nodeState.get("journey")=="ForgotPassword")
{
    action.goTo("forgotPassword");
}

else {
    action.goTo("selfservicejourney");
}