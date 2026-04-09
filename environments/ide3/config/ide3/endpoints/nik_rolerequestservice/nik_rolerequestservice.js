(function() {
    if(request.method === 'create') {

        try{
            const requestBody = JSON.parse(request.entity);

            const applicationName = requestBody.applicationName;
            const rolename = requestBody.roleName;
            const userIdentifier = requestBody.useridentifier;
            const requestorId = requestBody.requestorId || useridentifier;

            if(!applicationName || !rolename || !userIdentifier) {
                throw{
                    code:400,
                    message: 'Missing required fields: applicationName, roleName and userIdentifier are required'
                };
            }
            const appQuery = openidm.query('managed/alpha_application',
              {
                '_queryFilter': 'name eq "${applicationName}"',
                '_fields':'_id,name'
              }  
            );

            if(!appQuery.result || appQuery.result.length ===0) {
                throw {
                    code: 404,
                    message:'Application"${applicationName}" not found'
                };
            }

            const applicationId= appQuery.result[0]._id;

            const roleQuery = openidm.query(
                'managed/alpha_role',
                {
                    '_queryFilter':'name eq "$roleNmae}" and application eq "${applicatioID}"',
                    '_fields' : '_id,name,description'
                }
            );

            if(!roleQuery.result || roleQuery.result.length === 0) {
                throw{
                    code:404,
                    message:' role"${roleName}" not found for application "$applicationName"',
                };
            }

            const roleId = roleQuery.result[0]._id;

            const userQuery = openidm.query(
                'managed/alpha_user',
                {
                  '_queryFilter':'mail eq "${userIdentifier}" or userName eq "${userIdentifier}"',
                 '_fields' : '_id,userName,mail,givenName,sn'
                }
            );

            if(!userQuery.result || userQuery.result.length===0) {
                throw{
                   code:404,
                   message:'User "$userIdentifier} notfound'
                };
            }

            const user = userQuery.result[0];

            const existingRoleQuery = openidm.query(
                'managed/user/' +user._id + '/roles',
                {
                    '_queryFilter': '_red eq "managed/alpha_role/${roleId}"'
                }
            );

            if (existingRoleQuery.result && existingRoleQuery.result.length >0) {
                throw{
                    code: 409,
                    message: 'User already has role "${roleName}" in application "${applicationName}"'
                };
            }

            const roleRequest = {
                applicatioID: applicationId,
                applicationName: applicationName,
                roleId: roleId,
                roleName: roleName,
                userId:user._id,
                userName: user.userName,
                userEmail:user.mail,
                userFullName:' ${user.givenName} ${user.sn}',
                requestorId: requestorId,
                status:'pending',
                requestDate:new date().toISOString(),
                approvalDate:null,
                approveBy:null
            };

            const createdRequest = openidm.create(
                'managed/rolerequest',
                null,
                roleRequest
            );

            return {
                success: true,
                requestId: createdRequest._id,
                message: 'role request submitted successfully for user ${user.userName}',
                details: {
                    application: applicationName,
                    role:roleName,
                    user:user.userName,
                    status: 'pending',
                    requestdate:roleRequest.requestDate
                }
            };
 

        } catch (error) {
            throw{
                code: 500,
                message: 'Internal server error:' + error.message
            };
        }
    }
}) ();