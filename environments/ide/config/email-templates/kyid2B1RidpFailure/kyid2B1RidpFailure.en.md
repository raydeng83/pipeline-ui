
<html>
  <head>
    <meta />
    <title>KYID Remote Identity Verification Failure</title>
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
                <h2 style="text-align:left;margin-top:30px">Hi {{object.givenName}} {{object.sn}},</h2>
                <p>Your recent attempt for KYID remote identity verification was unsuccessful. Please see below for the details:

</p>
                <p>Verification Type: {{object.verificationType}}
</p>
                <p>Timestamp: {{object.timeStamp}}
</p>
                <p>Reason(if applicable): {{object.failureReason}}
</p>
                <p>
                  <strong>If you did not request this change:</strong>
                </p>
                <p>Please contact our KYID Helpdesk Team immediately at {{object.phoneContact}} and choose option 2 to connect directly with the Helpdesk Team.
</p>
                <p>
                  <br />KYID 
                
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>NOTE:</strong> Do not reply to this email. This email account is only used to send messages.
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>Privacy Notice:</strong> This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential data. Any unauthorized review, use, disclosure, or distribution is strictly prohibited. If you are not the intended recipient, please contact the sender by e-mail and destroy all copies of the original message.
         
                
                
     
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                </p>
                <p></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>