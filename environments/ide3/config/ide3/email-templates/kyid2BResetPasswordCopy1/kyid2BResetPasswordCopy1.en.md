<html>
  <head></head>
  <body style="background-color:#324054;color:#455469;padding:60px;text-align:left">
    <div class="content" style="background-color:#fff;border-radius:4px;margin:0 auto;padding:48px">
      <p>Hi {{object.givenName}} {{object.sn}},</p>
      <p>We received a request to reset the password associated with your account. Please click the link below to reset your password.</p>
      <p>
        <a href="{{object.resumeURI}}" style="text-decoration:none;color:#109cf1">Password Reset Link</a>
      </p>
      <p>The link will expire in [X hours/minutes].</p>
      <p>If you need any assistance, please contact the KYID HelpDesk</p>
      <p>
        <a href="&{esv.helpdesk.link}" style="text-decoration:none;color:#109cf1">KYID HelpDesk</a>
      </p>
      <p>Best Regards, KYID</p>
      <p>NOTE: Do not reply to this email. This email account is only used to send messages.</p>
      <p>Privacy Notice: This email message is only for the person it was addressed to. It may contain restricted and private information. You are forbidden to use, tell, show, or send this information without permission. If you are not the person who was supposed to get this message, please destroy all copies.</p>
    </div>
  </body>
</html>