/*
 * Retrieve nameID value from Java plugin and modify
*/
function getModifiedNameID() {
  var nameIDValue = nameIDScriptHelper.getNameIDValue();

  if (nameIDValue.includes(".com")) {
      return nameIDValue.replace(".com", ".org");
  }
  return nameIDValue;
}

/*
 * Use identity binding to gather attributes
*/
function getIdentityNameID() {
  var givenName = identity.getAttributeValues("givenName")[0];
  var lastName = identity.getAttributeValues("sn")[0];

  return givenName + "_" + lastName;
}

getModifiedNameID();
//getIdentityNameID();