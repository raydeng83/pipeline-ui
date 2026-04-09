/*
 * Retrieve nameID value from Java plugin and modify
*/
function getModifiedNameID() {
  return identity.getAttributeValues("mail")[0]
}

getModifiedNameID();