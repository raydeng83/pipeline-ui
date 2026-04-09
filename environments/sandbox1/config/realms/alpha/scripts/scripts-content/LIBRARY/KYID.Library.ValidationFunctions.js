/**
 * Function:
 *        nodeLogger(level,message)
 * Description:
 * Returns:
 * Date: 27th April September 2025
 * Author: Deloitte
 */


logger.error("********KYID.Library.ValidationFunctions***********")

// Validates if the provided value adheres to the specified character limit.
function maxLimit(value, charLimit) {
  if (!value) {
    return ["Invalid responseJSON"];
  }

  if (value.length > charLimit) {
    return {
      isValid: false,
      message: `${value} cannot exceed ${charLimit} characters`,
    };
  }

  return { success: true, message: "Validation passed" };
}

// Ensures that the value is not empty
function ismandatory(value) {
  if (!value) {
    return ["Invalid responseJSON"];
  }
  if (value.length <= 0) {
    return { isValid: false, message: `${value} cannot be empty` };
  }
  return { success: true, message: "Validation passed" };
}

// Verifies the selected radio and select type option by checking against specified value.
function forRadio(value, validValues) {
  if (!value) {
    return ["Invalid responseJSON"];
  }

  if(!Array.isArray(validValues)){
       return { isValid: false, message: `${validValues} should be an array` };
  }
  if (!validValues.includes(value)) {
    return { isValid: false, message: `${value} has an invalid value` };
  }

  return { success: true, message: "Validation passed" };
}

// Ensures that the DOB is valid and not empty.
function validateDate(dob, isRequired) {
   // dob = "1998-02-05";
  if (!dob) {
    return { isValid: false, message: "Date of birth is required" };
  }


 // var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    var dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
                 
    if (!dateRegex.test(dob)) {
        return {
            isValid: false,
            message: "Invalid date format, please use YYYY-MM-DD",
        };
    }

  var dateObj = new Date(dob);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: "Invalid Date" };
  }

  var today = new Date();
  if (dateObj > today) {
    return { isValid: false, message: "Date of birth cannot be in future" };
  }

  return { isValid: true, message: "Valid Date" };
}

// Verifies that the profile picture s in JPEG or PNG format and does not exceed 1MB in size
function validateProfilePicture(file, size) {
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSize = 1048576;

  if (!file) {
    return { isValid: false, message: "Profile Picture is required" };
  } else {
    if (!allowedTypes.includes(file.type)) {
        logger.error("filetypeis"+ file.type);
      return {
        isValid: false,
        message: "Only JPEG and PNG format is allowed",
      };
    }
  }

  if (size > maxSize) {
    return { isValid: false, message: "File size should be less than 1 MB" };
  }
  return { isValid: true, message: "Validation Passed" };
}


// To validate the phone number.
function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return { isValid: false, message: "Phone Number is required" };
  }

  const phoneRegex = /^\+1 {{{{\(\d{3}\)}}}} \d{3}-\d{4}$/;

  if (!phoneRegex.test(phoneNumber)) {
    return {
      isValid: false,
      message: "Phone number must be in the format +1 (123) 456-7890",
    };
  }

  return { isValid: true, message: "Validation Passed" };
}

// Validates the selected value of the hobbies checkbox option
function validateCheckbox(values) {
  const allowedHobbies = ["reading", "traveling", "cooking", "sports"];

  if (!values || values.length === 0) {
    return { isValid: false, message: "At least one hobby is required" };
  }

  const invalidHobbies = values.filter(
    (hobby) => !allowedHobbies.includes(hobby)
  );

  if (invalidHobbies.length > 0) {
    return {
      isValid: false,
      message: `Invalid hobbies selected ${invalidHobbies.join(
        ", "
      )} cannot be empty`,
    };
  }

  return { isValid: true, message: "Validation Passed" };
}


//To validate the Email Id
function validateEmail(mail, charLimit) {
  if (!mail) {
    return { isValid: false, message: "Email is required" };
  }

  mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (mail.length > charLimit) {
    return {
      isValid: false,
      message: `${mail} cannot exceed ${charLimit} characters`,
    };
  }

  if (!mailRegex.test(mail)) {
    return { isValid: false, message: "Invalid email format" };
  }

  return { isValid: true, message: "Valid emaail" };
}

exports.maxLimit = maxLimit;
exports.ismandatory = ismandatory;
exports.validateDate = validateDate;
exports.validateProfilePicture = validateProfilePicture;
exports.forRadio = forRadio;
exports.validatePhoneNumber = validatePhoneNumber;
exports.validateCheckbox = validateCheckbox;
exports.validateEmail = validateEmail;


