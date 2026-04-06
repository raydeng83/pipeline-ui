// Get the attribute value

/*function getModifiedNameID() {
  return identity.getAttributeValues("fr-attr-istr2")[0] //return the logon value from the user attributes
}

getModifiedNameID();*/


function getModifiedNameID() {
   var custom_attrs= identity.getAttributeValues("fr-idm-custom-attrs")[0]; // returns the first String from the List<String> of all the custom user attributes.
   return (JSON.parse(custom_attrs)).custom_windowsAccountName; //return the value for the custom_windowsAccountName attribute.

 
}

getModifiedNameID();
