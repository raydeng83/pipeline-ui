function ismandatory(responseJSON, charLimit) {
  var errors = [];

  if (!responseJSON || !responseJSON.pages) {
    return ["Invalid responseJSON"];
  }

  responseJSON.pages.forEach((page) => {
    page.fields.forEach((field) => {
      var value = field.value;

      if (value.length > charLimit) {
        errors.push(`${field.label} cannot exceed ${charLimit} characters`);
      }
    });
  });
  return errors;
}
