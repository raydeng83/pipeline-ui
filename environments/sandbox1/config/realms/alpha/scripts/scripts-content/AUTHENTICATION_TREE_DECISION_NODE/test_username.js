    // var mail = nodeState.get("objectAttributes").get("mail").trim();    
    // logger.error("printing cleaned mail: ++++++++++++++++++++++++++++++++++++++++++++++++++++++++=++++++" + mail);
    // nodeState.putShared("mail", mail);
    // outcome = "true";


if (requestCookies.get("OIDCFirstPhaseCompleted")){
    var mail = requestCookies.get("email");
    nodeState.putShared("objectAttributes", {"mail": mail}); 
    nodeState.putShared("mail",mail); 
    var AuthenticationInstant = new Date().toISOString();
     nodeState.putShared("AuthenticationInstant",AuthenticationInstant);
    action.goTo("true").putSessionProperty("emailaddress",mail).putSessionProperty("AuthenticationInstant",AuthenticationInstant);

} else {
    action.goTo("false")
}

// nodeState.putShared("objectAttributes", {"mail": "DEV_KYAUG9_I_14@mailinator.com"}); 
// nodeState.putShared("mail","DEV_KYAUG9_I_14@mailinator.com"); 
// nodeState.putShared("AuthenticationInstant","2025-02-21T09:56:59.013Z");
// //nodeState.putShared("applicationType","");
// //outcome = "true";
// action.goTo("true").putSessionProperty("emailaddress","DEV_KYAUG9_I_14@mailinator.com").putSessionProperty("AuthenticationInstant","2025-02-21T09:56:59.013Z");
