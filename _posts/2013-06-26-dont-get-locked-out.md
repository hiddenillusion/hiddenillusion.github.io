---
layout: post
title: Don't Get Locked Out
date: '2013-06-26T23:40:00.001-04:00'
author: hiddenillusion
image_folder: '2013-06-26'
tags: [Ophcrak, encryption, SafeBoot, Sticky Keys, FDE, Kon-Boot, WinTech]
modified_time: '2013-06-26T23:40:27.352-04:00'
thumbnail: http://3.bp.blogspot.com/-YSdJkEule2w/Ucumg-ayfuI/AAAAAAAAATU/n4Er6Uov4Oc/s72-c/WinTech_code.png
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-4323353762897682003
blogger_orig_url: http://hiddenillusion.blogspot.com/2013/06/dont-get-locked-out.html
---

* toc-content
{:toc}

# Scenario

The system had Full Disk Encryption (FDE) via McAfee SafeBoot and I had recently changed my Windows password but apparently fat fingered it from what I thought I had changed it to which left me unable to authenticate to Windows.  The OS and SafeBoot were working properly and I had valid credentials to login to the SafeBoot file system (SBFS)...this is because it used separate credentials from my Windows credentials.

# Considerations

Even though I could authenticate to SafeBoot and decrypt the OS, I wasn’t able to boot off of anything else (Kon-boot, Ophcrack etc.) after authenticating to SafebBoot or prior to entering the SafeBoot environment.

Since my Windows passphrase was over 18 characters (don’t ask me why) a dictionary attack wasn’t on the list of possible solutions.  While rainbow tables were next on my list, LM was turned off and the key space for my passphrase would have been too big to tackle.  There was the option to try and unlock it via FireWire (Inception) but since this was a Windows 7 x64 with SP1 and 8 GB of memory it was unlikely to work in its release at that time.

# Trials

In order to recover/troubleshoot SafeBoot you can use the [WinTech](https://kc.mcafee.com/corporate/index?page=content&id=KB61117) CD.  Once you boot your system from the WinTech CD the first thing that you must do is open up WinTech (start > Programs > SafeBoot WinTech) and enter the [daily access code](http://mysupport.mcafee.com/Eservice/Default.aspx).  

![WinTech Code]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/WinTech_code.png)

After successfully authorizing yourself the next step is to authenticate to SafeBoot.  This can be done three different ways:

![SafeTech Options]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/SafeTech_options.png)

Since I had valid credentials for this particular SafeBoot group I chose the first option - to "Authenticate From SBFS".  If all goes well you’ll see authorized and authenticated in the bottom of the program.

You now have the ability to mount your decrypted file system and browse it with an explorer within the BartPE environment or from cmd.  My first thought was to copy off the SAM and SECURITY files but again, lack of LM hashes and my long passphrase were telling me nope, try another way.

As such, I decided to try the old Sticky Keys trick.  For those of you who are unaware of what I mean, Sticky Keys is an accessibility feature within Windows meant to allow a user to be able to hold down two or more keys at a time when they would otherwise be unable to.  This feature is enabled by default on Windows installations and is therefore highly reliable as another option.  To make sure this was a possible solution I hit the ‘Shift’ key five times once I was at the Windows login screen.  If your settings haven’t been altered and Sticky Keys is enabled you’ll be presented with:

![Sticky Keys]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/sticky_keys.png)

By switching the Sticky Keys application with a command prompt on the system you can take advantage of this feature and reset a local user’s password or create a new local user.  Usually, this trick would be carried out by either booting the system from a Windows installation disk and utilizing the recovery console or by mounting the file system within a live Linux instance.  The issue that came up again is that neither of them would have sufficed since the OS file system would still be encrypted.

# Resolution

Once I was authorized and authenticated to the SBFS I opened cmd within WinTech and did the following:

Created a copy of the Sticky Keys application:

`> copy c:\Windows\system32\sethc.exe c:\Windows\system32\sethc.bak`

```
1 file(s) copied.
```

Tried to replace the Sticky Keys application with a copy of the command prompt:

`> copy /y c:\Windows\system32\cmd.exe c:\Windows\system32\sethc.exe`

```
Access is denied.
0 file(s) copied.
```

The first time around I received an "Access Denied" error in this step, as depicted above.  This is something I hadn't run into before because every time I had previously performed this trick I was working on a Windows XP system - but this time it was a Windows 7 system.  After some troubleshooting I realized this error was due to enhanced protections on the System32 files that Windows 7 has over Windows XP...so the ownership/permissions on this file need to be modified.

Within SafeTech:

- Start > Programs > File Management > MS Explorer.
- Right click on sethc.exe > Properties > Security > Advanced
- Change the current owner (TrustedInstaller) to Administrators (in my case)
- Change the permissions of who you changed ownership to (Administrators in this example) to "full control"

I attempted to replace the Sticky Keys application again with a copy of command prompt:

`> copy /y c:\Windows\system32\cmd.exe c:\Windows\system32\sethc.exe`

```
1 file(s) copied.
```

> Victory!

Then, after a system restart I pressed the Shift key 5x at the Windows login.  If all went well then the command prompt should now pop up and allow us to add a new user or reset an existing users password:

![Sethc CMD]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/sethc_cmd.png)

At which point I could just do the first of those two, reset my Windows password:

`> net user <username> <new password>`

While not a super exciting post, it was something that I had to think about for a sec. and hopefully these little notes will help someone else out there if they ever run into the same situation.
