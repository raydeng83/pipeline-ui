
<html>
  <head>
    <meta />
    <title>KYID Account Invitation</title>
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
                <p>{{object.requesterFullName}} le ha invitado a acceder al KYID {{object.applicationNames}}.
</p>
                <table width="100%" border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;margin:30px 0;border:1px solid #ddd">
                  <thead>
                    <tr>
                      <th>Nombre de la aplicación</th>
                      <th>Nombre del rol</th>
                      {{#object.hasDelegationEndDate}}
                      
                      <th>Acceso Delegado Hasta</th>{{/object.hasDelegationEndDate}}
                      
                      <th>Agregado por</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{{object.roleNamesHtml}}}
                  </tbody>
                </table>
                <p>
                  Haga clic en el enlace de abajo y siga las instrucciones para finalizar la configuración de su acceso.
                </p>
                <p>
                  <a href="{{object.requestUri}}" style="text-decoration:none;color:#109cf1">Enlace de invitación</a>
                </p>
                <p style="text-align:left;line-height:1.6">
                  Si necesita ayuda, comuníquese inmediatamente con nuestro equipo de soporte de KYID llamando al {{object.phoneContact}} y seleccione la opción 2 para comunicarse directamente con ellos.
















                  
                  
                  <br />
                  <br />
                  <a href="&{esv.kyid.helpcenter.url}" style="color:#0000FF;text-decoration:underline">Enlace de soporte de KYID</a>
                </p>
                <p>
                  <br />KYID


















                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>NOTA:</strong> No responda a este correo electrónico. Esta cuenta de correo electrónico sólo se utiliza para enviar mensajes.


















                
                
                </p>
                <p style="text-align:left;line-height:1.6">
                  <strong>Aviso de privacidad: </strong> Este correo electrónico, incluidos los archivos adjuntos, es para uso exclusivo del destinatario y puede contener información confidencial. Queda estrictamente prohibida cualquier revisión, uso, divulgación o distribución no autorizada. Si usted no es el destinatario, comuníquese con el remitente por correo electrónico y destruya todas las copias del mensaje original.


















                
                
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