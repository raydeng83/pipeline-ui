<html>
  <head></head>
  <body style="background-color:#324054;color:#455469;padding:60px;text-align:center">
    <div class="content" style="background-color:#fff;border-radius:4px;margin:0 auto;padding:48px;width:235px">
      <p>Hello, {{object.user.givenName}} {{object.user.sn}}! 
        
        <br />
A certification task for the campaign {{object.campaign.name}} was assigned to you.
        
        </p>
        <p>you need to review and take action for the following users:</p>
        <p>{{#each object.task.items}}* -{{this.target.userName}} {{/each}}</p>
      </div>
    </body>
  </html>