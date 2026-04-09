<html>
  <head>
    <meta />
    <title>Reminder to Review Request</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f4f4f4">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;margin-top:20px;border:1px solid #ddd">
            <tr>
              <td style="background-color:#0073b1;height:8px"></td>
            </tr>
            <tr>
              <td style="padding:30px 40px">
                <img alt="KYID Logo" src="https://sih.uat.kyid.ky.gov/images/Download/KYID%20Logo.png" style="display:block;margin:auto;width:156px;height:65px;border-radius:4px" />
                <div class="otp-box" style="background:rgba(255, 255, 255, 0.8);padding:20px;border-radius:8px;box-shadow:0 0 15px rgba(0, 0, 0, 0.1)">
                  <h2 style="text-align:left;margin-top:30px">Hi {{object.givenName}} {{object.sn}}, </h2>
                  <p style="margin-top:10px">
                           An enrollment request for {{object.request.custom.requesterUser.requesterUserMail}} to the KYID {{object.request.custom.requesterUser.applicationName}} has been cancelled on {{object.timeStamp}}.
                        </p>
                  <p style="margin-top:10px">
                  Application Name: {{object.request.custom.requesterUser.applicationName}}


                    
                    
                    <br />
                  Role Name: {{object.request.custom.requesterUser.roleName}}



                  
                  
                  </p>
                  {{#if object.reason}}
                  <p> Reason for cancellation: {{object.reason}}</p>{{/if}}
                  {{#if object.cancelledBy}}
                  <p> Cancelled by: {{object.cancelledBy}}</p>{{/if}}
                  {{#if object.comment}}
                  <p> Comment: {{object.comment}}</p>{{/if}}
                  
                  <p>This message is for your information only and no further action is required on your part.
</p>
                  <p>If you have any question, please contact our KYID Helpdesk Team immediately at 502-564-0104 and choose option 2 to connect directly with the Helpdesk Team.
</p>
                  <a href="&{esv.kyid.helpcenter.url}" style="color:#0000FF;text-decoration:underline">KYID HelpDesk link</a>
                  <p>
                    <br />KYID

















                  
                  
                  
                  
                  
                  </p>
                  <br />
                  <p style="text-align:left;line-height:1.6">
                    <strong>NOTE:</strong> Do not reply to this email. This email account is only used to send messages.

















                  
                  
                  
                  
                  
                  </p>
                  <p style="text-align:left;line-height:1.6">
                    <strong>Privacy Notice:</strong> This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential data. Any unauthorized review, use, disclosure, or distribution is strictly prohibited. If you are not the intended recipient, please contact the sender by e-mail and destroy all copies of the original message.

















                  
                  
                  
                  
                  
                  </p>
                  <p></p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>