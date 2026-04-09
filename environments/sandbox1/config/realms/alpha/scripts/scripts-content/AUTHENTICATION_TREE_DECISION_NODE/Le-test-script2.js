/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var test = "abc"
logger.error("le-test-log:" + test)

var ab = action.goTo("True");   // or "true" depending on your outcome label
ab.putSessionProperty("propertyone", "propertyonevalue");
ab.putSessionProperty("propertytwo", "propertytwovalue");
var json = {
  "http://schemas.chfs.ky.gov/kog/v1/identity/claims/logon": "dev_kyapr25_i_34@kydev.dev.ky.gov",
  "http://schemas.chfs.ky.gov/kog/v1/identity/claims/firstname": "Naimabcg"
};

var keys = Object.keys(json);
for (var i = 0; i < keys.length; i++) {
  var key = keys[i];
  var value = json[key];
  if (value === null || typeof value === "undefined") value = "";
  else if (typeof value === "object") value = JSON.stringify(value);
  else value = String(value);
  ab.putSessionProperty(String(key), String(value));
}

ab;

/*
//action.goTo("True").putSessionProperty("upn", "myemail.com").putSessionProperty("KOGID","myemail.com").putSessionProperty("am.protected.username","05767548-f8bc-4cd7-98bo-c9b680770ff4");


var fr = JavaImporter(
    org.forgerock.openam.auth.node.api.Action
);

  fr.Action.ActionBuilder.putSessionProperty("actionbuilderkey","actionbuilderValue");
  //action = fr.Action.goTo("True").build();*/




action.goTo("True");