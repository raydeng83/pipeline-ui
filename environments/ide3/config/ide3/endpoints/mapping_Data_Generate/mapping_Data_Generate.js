(function() {
      if (request.method !== 'create') {
          throw {
              code: 405,
              message: 'Method not allowed. Use POST.'
          };
      }

      var content = request.content;
      var id = content.id;
      var kogId = content.kogId;

      if (!id || !kogId) {
          throw {
              code: 400,
              message: 'Missing required parameters: id and kogId'
          };
      }

      var response = {
          accessInfo: [],
          userIdentity: null
      };

      // Query alpha_kyid_access with filter userIdentifier=id
      // Include relationship fields: user, app, role
      var accessQuery = openidm.query('managed/alpha_kyid_access', {
          '_queryFilter': 'userIdentifier eq "' + id + '"',
          '_fields': 'user/mail,user/sn,user/givenName,app/name,app/kogAppId,role/name,role/'
      });

      if (accessQuery.result && accessQuery.result.length > 0) {
          response.accessInfo = accessQuery.result.map(function(item) {
              return {
                  user: item.user,
                  app: item.app,
                  role: item.role
              };
          });
      }

      // Query alpha_kyid_user_identity with filter KOGID=kogId
      var userIdentityQuery = openidm.query('managed/alpha_kyid_user_identity', {
          '_queryFilter': 'KOGID eq "' + kogId + '"',
          '_fields': 'givenName,sn'
      });

      if (userIdentityQuery.result && userIdentityQuery.result.length > 0) {
          var userIdentity = userIdentityQuery.result[0];
          response.userIdentity = userIdentity;
      }

      //Query alpha_user
      var userQuery =  openidm.query('managed/alpha_user', {
          '_queryFilter': 'userName eq "' + kogId + '"',
          '_fields': 'givenName,sn,mail'
      });

      if (userQuery.result && userQuery.result.length > 0) {
          var user = userQuery.result[0];
          response.user = user;
      }

  
      return response;
  })();