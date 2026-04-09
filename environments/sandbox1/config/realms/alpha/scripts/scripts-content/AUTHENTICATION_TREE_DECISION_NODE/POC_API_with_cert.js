var jsonObjBody = {
    "LegalFirstName": "pry",
    "LegalLastName": "agrwl",
    "EmailAddress": "pryag@mailinator.com",
    "Password": "Password@1",
    "AlternateEmailAddress": "pryag2@mailinator.com",
    "MobilePhone": "1111111111",
    "KYID": "7DAAEDA0-49A5-4D8F-B6FA-1EDB435C743D",
    "TransactionID": "ED4FCAA9-93FC-4CE2-9A24-0868ED3056B0",
    "ContextID": "B017A9A6-1030-468D-8C34-F02A5C28F405"
};
var requestOptions = {
    "clientName": "kyidHttpClient",
    "method": "POST",
    "headers": {
        "Content-Type": "application/json"
      },
    "body": jsonObjBody
 };

// var requestOptions = {
//     "method": "POST",
//     "headers": {
//         "Content-Type": "application/json"
//       }
//  };

var creatAccURL = "https://prod-57.eastus.logic.azure.com:443/workflows/3e53adfcb02647dc84aa8a2d09c03062/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=O98wvg_fIkVKFmwrgSnwD9u-e13bBj72uwcpQjBQ8yw";

var res = httpClient.send(creatAccURL,requestOptions).get(); 
logger.error("response res "+JSON.stringify(JSON.parse(res.text())));
action.withHeader(`Response code: ${res.status}`);

if (res.status == 200) {
    logger.error("inside 200 resp")
  action.goTo("true")
      //.withDescription(response.text());
} else {
    logger.error("response is not 200")
  action.goTo("false");
};