---
title: Access an IIS Express site from a remote computer
summary: Bind an IIS Express site to your IP address and open the firewall so other computers on your network can browse the site.
category: ASP.NET and Blazor
order: 40
---

# Access an IIS Express site from a remote computer

By default, an IIS Express site is available only on `http://localhost:[port]`. Use this procedure to open the site from another computer on your network, for example to test it in a browser that does not run on your development computer.

You do not have to deploy the site to IIS. Visual Studio runs the site in IIS Express instead of the older built-in web server (Cassini).

## Before you start

- Visual Studio with IIS Express.
- The IP address of your development computer (the examples use `192.168.1.42`).
- The port of your site (the examples use `58938`).
- An administrator command prompt.

## Bind the site to your IP address

1. Open the IIS Express configuration file:
   - Visual Studio 2017 and later: `{solution folder}/.vs/{solution name}/config/applicationhost.config`.
   - Visual Studio 2015: `{solution folder}/.vs/config/applicationhost.config`.
   - Earlier versions: `%USERPROFILE%\Documents\IISExpress\config\applicationhost.config`.
2. Find your site. It looks like this:

   ```xml
   <site name="Alpha.Web" id="2">
       <application path="/">
           <virtualDirectory path="/" physicalPath="C:\Users\Johan\HgReps\Alpha\Alpha.Web" />
       </application>
       <bindings>
           <binding protocol="http" bindingInformation="*:58938:localhost" />
       </bindings>
   </site>
   ```

3. In `<bindings>`, add a binding with your IP address and port:

   ```xml
   <binding protocol="http" bindingInformation="*:58938:192.168.1.42" />
   ```

> **TIP:** If you use Visual Studio 2015 or later, add `.vs/` to your `.gitignore` or `.hgignore` file.

## Allow incoming connections

Windows (for example, Windows 7) blocks almost all incoming connections. You must allow incoming connections to your site.

1. Start an administrator command prompt.
2. Tell `http.sys` that it can accept requests for the URLs. Use your IP address and port.

   For HTTP:

   ```cmd
   netsh http add urlacl url=http://192.168.1.42:58938/ user=everyone
   netsh http add urlacl url=http://localhost:58938/ user=everyone
   ```

   For HTTPS:

   ```cmd
   netsh http add urlacl url=https://192.168.1.42:58938/ user=everyone
   netsh http add urlacl url=https://localhost:58938/ user=everyone
   ```

3. Add a Windows Firewall rule that allows incoming connections to the port. Use the profile of your network (`private`, `public`, or `domain`):

   ```cmd
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=private action=allow
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=public action=allow
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=domain action=allow
   ```

4. To allow connections only from computers on your local subnet, add `remoteip=localsubnet` to the rule:

   ```cmd
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=private remoteip=localsubnet action=allow
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=public remoteip=localsubnet action=allow
   netsh advfirewall firewall add rule name="IISExpressWeb" dir=in protocol=tcp localport=58938 profile=domain remoteip=localsubnet action=allow
   ```

5. In Visual Studio, press Ctrl+F5.

**Result:** You can open the site from another computer at `http://192.168.1.42:58938/`.

## Delete the URL reservations

1. Show the URL reservations:

   ```cmd
   netsh http show urlacl
   ```

2. Delete a reservation:

   ```cmd
   netsh http delete urlacl url=http://192.168.1.42:58938/
   ```

> **NOTE:** Dated (checked November 2026): Visual Studio 2022 has dev tunnels. A dev tunnel makes a local site available to other computers and devices without changes to `applicationhost.config`, `netsh`, or the firewall.

## Related links

- [Accessing an IIS Express site from a remote computer (Johan Driessen)](https://johan.driessen.se/posts/Accessing-an-IIS-Express-site-from-a-remote-computer/)
- [Video 1](https://youtu.be/5ZqDuvTqQVs)
- [Video 2](https://youtu.be/_t9u9DKlKP4)
- [Conveyor by Keyoti (Visual Studio extension)](https://marketplace.visualstudio.com/items?itemName=vs-publisher-1448185.ConveyorbyKeyoti)
