/*if (object.frUnindexedString1!= null || object.frUnindexedString1!= ""){
let userType = object.frUnindexedString1;
}
if (object.frUnindexedString2 != null || object.frUnindexedString2!= ""){
let userDomain = frUnindexedString2;
}*/
let userType = object.frUnindexedString1;
logger.error("User Type Is "+ userType )
//let userDomain = frUnindexedString2;
if (userType ==="External"){
logger.info("Creating BirthRight Roles of the User")
let allRoles = openidm.query("/managed/alpha_role", {
    "_queryFilter": 'name eq "kyidPortal"'
});
 
// Ensure there are results from the query
if (allRoles && allRoles.result && allRoles.result.length > 0) {
    // Iterate over each role in the result
    for (let i = 0; i < allRoles.result.length; i++) {
        let groupId = allRoles.result[i]._id;  // Access the role's ID
        // Perform the patch operation to add the user to the role
        openidm.patch("managed/alpha_role/" + groupId, null, [{
            'operation': 'add',
            'field': '/members/-',
            'value': {
                '_ref': 'managed/alpha_user/' + object._id
            }
        }]);
    }
} else {
    // Handle the case where no roles were found
    logger.error("No roles found with the specified query filter.");
}
}
else{
logger.error("This user does not belongs to external user");
}
