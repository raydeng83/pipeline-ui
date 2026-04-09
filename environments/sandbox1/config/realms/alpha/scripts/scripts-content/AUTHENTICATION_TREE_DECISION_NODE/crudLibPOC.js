/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var crudOps = require("KYID.Library.CRUDFunctions");

// var newUser = {
//     "userName": "00312fd7-dddd-4a5e-8406-f4508be20220",
//     "givenName": "shubhampoc",
//     "sn" : "testpoc",
//     "mail": "shubhamtestpoc10@yopmail.com",
//     "password": "Hello@123"
// }

var updatedUserData ={
    "givenName" : "testtest"
}
var userName = "259aa349-de58-4e60-a3e4-06abb9af020c"
var pathOps = [
    {
        "operation": "replace",
        "field": "/description",
        "value": "testPO123C"
    }
]

//var createUser = crudOps.crudOps("create","managed/alpha_user",newUser, null, null, null)
//var updatedUser = crudOps.crudOps("update","managed/alpha_user",updatedUserData, null, null, userName)
//var queryFilter = '/userName eq "259aa349-de58-4e60-a3e4-06abb9af020c"'
//var read = crudOps.crudOps("read","managed/alpha_user", null, null, null, userName)
//var patch = crudOps.crudOps("patch","managed/alpha_user", null, null, null, userName, pathOps)
//var del = crudOps.crudOps("delete","managed/alpha_user", null, null, null, userName, null);

//logger.error("deleted the User: " + JSON.stringify(del));
outcome = "true";
