
<html>
  <head>
    <meta />
    <title>Role(s) Removed</title>
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
                <p>Se han eliminado uno o más roles de su cuenta.
</p>
                <p>A continuación, se muestran los detalles:</p>
                <table align="center" border="1" cellpadding="10" cellspacing="10" style="border-collapse:collapse">
                  <thead>
                    <tr>
                      <th>Nombre del rol</th>
                      <th>Nombre de la aplicación</th>
                      <th>Eliminado por</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{{object.roleNamesHtml}}}</td>
                      <td>{{object.applicationNames}}</td>
                      <td>{{object.requesterUser}}</td>
                      <td>{{object.timeStamp}}</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  <strong>Si no solicitó este cambio:</strong>
                </p>
                <p>Comuníquese inmediatamente con nuestro equipo de soporte de KYID llamando al {{object.phoneContact}} y seleccione la opción 2 para comunicarse directamente con ellos.
</p>
                <a href="&{esv.kyid.helpcenter.url}" style="color:#0000FF;text-decoration:underline">Enlace de soporte de KYID</a>
                <p>
                  <br />KYID
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>NOTA:</strong> No responda a este correo electrónico. Esta cuenta de correo electrónico sólo se utiliza para enviar mensajes.
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>Aviso de privacidad:</strong>  Este correo electrónico, incluidos los archivos adjuntos, es para uso exclusivo del destinatario y puede contener información confidencial. Queda estrictamente prohibida cualquier revisión, uso, divulgación o distribución no autorizada. Si usted no es el destinatario, comuníquese con el remitente por correo electrónico y destruya todas las copias del mensaje original.                
                
                
                
                
                
                
                
                
                
                
                
                
                
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
