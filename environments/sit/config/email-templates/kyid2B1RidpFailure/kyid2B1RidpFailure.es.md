
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
                <h2 style="text-align:left;margin-top:30px">Hola {{object.givenName}} {{object.sn}},</h2>
                <p>Su intento reciente de verificación remota de identidad KYID no fue exitoso. Por favor, vea a continuación los detalles:
</p>
                <p>Tipo de verificación: {{object.verificationType}}
</p>
                <p>Marca de tiempo: {{object.timeStamp}}
</p>
                <p>Razón (si corresponde): {{object.failureReason}}
</p>
                <p>
                  <strong>Si no solicitó este cambio:</strong>
                </p>
                <p>Por favor, comuníquese con nuestro equipo de asistencia de KYID inmediatamente al {{object.phoneContact}} y elija la opción 2 para conectarse directamente con el equipo de asistencia.
</p>
                <p>
                  <br />KYID   
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>NOTA:</strong> No responda a este correo electrónico. Esta cuenta de correo electrónico solo se utiliza para enviar mensajes.
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>Aviso de privacidad:</strong> Este mensaje de correo electrónico, incluidos los archivos adjuntos, es para el uso exclusivo del destinatario(s) previsto y puede contener datos confidenciales. Cualquier revisión, uso, divulgación o distribución no autorizada está estrictamente prohibida. Si no es el destinatario previsto, comuníquese con el remitente por correo electrónico y destruya todas las copias del mensaje original.
                
                
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