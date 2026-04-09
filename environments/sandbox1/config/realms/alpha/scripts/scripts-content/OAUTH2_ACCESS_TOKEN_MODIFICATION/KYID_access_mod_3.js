    var fr=JavaImporter(
        com.sun.identity.idm.IdType
    );
   var groups=[];
    identity.getMemberships(fr.IdType.GROUP).toArray().forEach(function(group){
        groups.push(group.getAttribute("cn").toArray());
    });
    accessToken.setField("groups",groups);


    var firstname=identity.getAttribute("givenName").toArray()[0];
    accessToken.setField("firstname",firstname);
    var lastname=identity.getAttribute("sn").toArray()[0];
    accessToken.setField("lastname",lastname);
    var mail=identity.getAttribute("mail").toArray()[0];
    accessToken.setField("mail",mail);

    var roles=identity.getAttribute("fr-idm-effectiveRole").toArray();
    var rolenames=roles.map(role=>JSON.parse(role).name);

        

    // var roles=identity.getAttribute("fr-idm-effectiveRole").toArray();
    // var rolenames=roles.map(role=>JSON.parse(role).name);
    accessToken.setField("roles",rolenames);