/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var validation = require("KYID.Library.ValidationFunctions");


//Test1 Character Limit
var maxLimit = validation.maxLimit("Shubham",50)
var maxLimit2 = validation.maxLimit("Shubhammmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm",50)
logger.error("maxLimit Testing: "+  JSON.stringify(maxLimit));
logger.error("maxLimi2t Testing: "+  JSON.stringify(maxLimit2))

//Test2 Select Box
var forRadio = validation.forRadio("male",["male", "female", "other"]);
var forRadio2 = validation.forRadio("ale",["male", "female", "other"]);
var forRadio3 = validation.forRadio("",["male", "female", "other"]);
logger.error("forRadio Testing: "+  JSON.stringify(forRadio));
logger.error("forRadio2 Testing: "+  JSON.stringify(forRadio2))
logger.error("forRadio3 Testing: "+  JSON.stringify(forRadio3))


//Test3 Radio button
var forRadio4 = validation.forRadio("single",["single", "married", "divorced", "widowed"]);
var forRadio5 = validation.forRadio("ale",["single", "married", "divorced", "widowed"]);
var forRadio6 = validation.forRadio("",["single", "married", "divorced", "widowed"]);
logger.error("forRadio4 Testing: "+  JSON.stringify(forRadio4));
logger.error("forRadio5 Testing: "+  JSON.stringify(forRadio5))
logger.error("forRadio6 Testing: "+  JSON.stringify(forRadio6))


//Test4 Terms and condition
var terms1 = validation.forRadio("true",["true"]);
var terms2 = validation.forRadio("",["true"]);
var terms3 = validation.forRadio("false",["true"]);
logger.error("terms1 Testing: "+  JSON.stringify(terms1));
logger.error("terms2 Testing: "+  JSON.stringify(terms2))
logger.error("terms3 Testing: "+  JSON.stringify(terms3))


// Test5 DOB
var dob1 = validation.validateDate("1998-02-05", "true");
var dob2 = validation.validateDate("199-05-02", "true");
var dob3 = validation.validateDate("1998-00-02", "true");
var dob4 = validation.validateDate("1998-02-28", "true");
var dob5 = validation.validateDate("05-02-1998", "true");
var dob6 = validation.validateDate(1998-30-02, "true");
var dob7 = validation.validateDate("2026-01-01", "true");
logger.error("dob1 Testing: "+  JSON.stringify(dob1));
logger.error("dob2 Testing: "+  JSON.stringify(dob2))
logger.error("dob3 Testing: "+  JSON.stringify(dob3))
logger.error("dob4 Testing: "+  JSON.stringify(dob4));
logger.error("dob5 Testing: "+  JSON.stringify(dob5))
logger.error("dob6 Testing: "+  JSON.stringify(dob6))
logger.error("dob7 Testing: "+  JSON.stringify(dob7))


//Test6 Profile Picture
var file1={type: "image/png"};
var file2={type: "image/jpg"};
var file3={type: "image/jpeg"};
var file4={type: "image/"};

var test1 = validation.validateProfilePicture(file1, 2000)
var test2 = validation.validateProfilePicture(file2, 2000)
var test3 = validation.validateProfilePicture(file3, 2000)
var test4 = validation.validateProfilePicture(file4, 2000)
var test5 = validation.validateProfilePicture(file1, 2000000000)
logger.error("test1 Testing: "+  JSON.stringify(test1));
logger.error("test2 Testing: "+  JSON.stringify(test2));
logger.error("test3 Testing: "+  JSON.stringify(test3));
logger.error("test4 Testing: "+  JSON.stringify(test4));
logger.error("test5 Testing: "+  JSON.stringify(test5));


//Test7 phoneNumber
var phone1 = validation.validatePhoneNumber("+917090325015")
var phone2 = validation.validatePhoneNumber("+1 (123) 456-7890")
var phone3 = validation.validatePhoneNumber("+1 123 456-7890")
logger.error("phone1 Testing: "+  JSON.stringify(phone1));
logger.error("phone2 Testing: "+  JSON.stringify(phone2))
logger.error("phone3 Testing: "+  JSON.stringify(phone3))


//Test8 Hobbies
var hobby1 =validation.validateCheckbox(["",""])
var hobby2 =validation.validateCheckbox(["reading","traveling"])
var hobby3 =validation.validateCheckbox(["reading","traveling","something"])
var hobby4 =validation.validateCheckbox(["reading","traveling",""])
logger.error("hobby1 Testing: "+  JSON.stringify(hobby1));
logger.error("hobby2 Testing: "+  JSON.stringify(hobby2));
logger.error("hobby3 Testing: "+  JSON.stringify(hobby3));
logger.error("hobby4 Testing: "+  JSON.stringify(hobby4));


//Test9 EMAIL
var email1 = validation.validateEmail("somehitng@yopmail.com")
var email2 = validation.validateEmail("somehitngyopmail.com")
var email3 = validation.validateEmail("somehitng@yopmailcom")
var email4 = validation.validateEmail("somehitng@yopmail.om")
var email5 = validation.validateEmail("")
logger.error("email1 Testing: "+  JSON.stringify(email1));
logger.error("email2 Testing: "+  JSON.stringify(email2));
logger.error("email3 Testing: "+  JSON.stringify(email3));
logger.error("email4 Testing: "+  JSON.stringify(email4));
logger.error("email5 Testing: "+  JSON.stringify(email5));
outcome = "true";
