var mail = nodeState.get("objectAttributes").get("mail");
nodeState.putShared("mail", mail);
var sn = nodeState.get("objectAttributes").get("sn");
nodeState.putShared("sn", sn);
var givenName = nodeState.get("objectAttributes").get("givenName");
nodeState.putShared("givenName", givenName);
var userKOGId=nodeState.get("objectAttributes").get("password");
nodeState.putShared("userKOGId", userKOGId);

outcome = "true";
