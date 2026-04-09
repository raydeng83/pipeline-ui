(function () {

    logger.error("onCreate script:: started for org: " + source.name);

    try {

        var orgName = source.name;
        var query = {_queryFilter: "name" + ` eq "`+orgName+ `"`}

        // Check if org has members
        if (!source.members){
            var orgMembers = openidm.query("managed/alpha_organization", query, ["members"]);
            if(orgMembers.resultCount > 0){
              logger.error("onCreate script:: members " + orgMembers.result[0].members);
              var orgMemberConvert = []
              for(var i = 0; i < orgMembers.result[0].members.length; i++){

                orgMemberConvert.push(orgMembers.result[0].members[i]);
              }

              target.members = JSON.stringify(orgMemberConvert);
            }
            logger.error("onCreate script:: members " + target.members);
        } 


    } catch (e) {
        logger.error("onCreate script:: Error in onCreate script: " + e.message);
        logger.error("onCreate script:: Stack trace: " + e);
    }
})();