---
layout: post
title: Making Volatility Work for You
date: '2012-03-26T20:15:00.000-04:00'
author: hiddenillusion
image_folder: '2012-03-26'
tags: [dfir, volatility, memory forensics]
modified_time: '2012-04-25T21:01:16.124-04:00'
thumbnail: http://3.bp.blogspot.com/-KvmMqRArijg/T29Iu8kIYrI/AAAAAAAAABI/9shgV8EpjY0/s72-c/procexedump_prior.tiff
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-7603799264860101057
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/03/making-volatility-work-for-you.html
---

* toc-content
{:toc}

# Overview

Lately I've been spending some time customizing Volatility to meet some of the needs I was facing.  What were they?  I needed an automated way to leverage Volatility to perform an analysis and while doing so I noticed there were some small changes to some of its files that I wanted to make so certain information was displayed differently.  The latter is what I'm going to quickly touch on in this post as others may find it beneficial for their own needs and to me personally, just made sense to display the output as I'll show.

While there's a few branches, the following will be focused on the current trunk (v2.0.0) at the time of writing this.  I put in the line numbers but in disclosure, things are always changing so look for the text instead of the line number and you're likely to get a better hit.

> I'm not a Volatility expert, I just wanted things displayed differently for my own needs.  If there's something I did wrong or could've done a different by all means drops me a line.

The below set of modifications resulted from analyzing the output of some plugins that **dump** files from the memory image.  I noticed that the current way those dumped files were being displayed were stuck with some static text instead of displaying useful information I cared about.  After the static text the naming convention consists of the PID and sometimes the base address followed by a static file extension depending on the plugin.

Now what I didn't want to have to do was look at all of the dumped files and then have to lookup the process name corresponding to the PID.  All of that information is already there so why not include the **process name+PID+base(varies).extension** and so-on?

With the information presented in that new format I no longer have to look in separate places to understand that I'm looking at and saves me a step - sometimes that could mean a lot of time if I have a lot of dumped files to correlate with another plugins output.

The `procdump` plugin dumps files with the following naming convention **executable.pid.exe**.

> **Note:** this plugin has two lines to change unlike the other examples later on

## Procdump

File | /path/to/volatility/plugins/procdump.py
Line | 58
From | `outfd.write("Dumping {0}, pid: {1:6} output: {2}\n".format(task.ImageFileName, pid, "executable." + str(pid) + ".exe"))`
To | `outfd.write("Dumping {0}, pid: {1:6} output: {2}\n".format(task.ImageFileName, pid, task.ImageFileName + "." + str(pid) + ".exe"))`
Line | 59
From | `of = open(os.path.join(self._config.DUMP_DIR, "executable." + str(pid) + ".exe"), 'wb')`
To | `of = open(os.path.join(self._config.DUMP_DIR, task.ImageFileName + "." + str(pid) + ".exe"), 'wb')`

### Procdump Prior
![Procexedump Prior]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/procexedump_prior.jpg)

### Procdump After
![Procexedump After]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/procexedump_after.jpg)

After modification we got rid of the static **executable** text and added the actual process name to the output file name... much better.

## Dlldump

The `dlldump` plugin dumps files with the following naming convention **module.pid.procOffset.DllBase**

File | /path/to/volatility/plugins/dlldump.py
Line | 94
From | `dump_file = "module.{0}.{1:x}.{2:x}.dll".format(proc.UniqueProcessId, process_offset, mod.DllBase)`
To | `dump_file = "{0}.{1}.dll".format(mod.BaseDllName, proc.ImageFileName)`

### Dlldump Prior

![Dlldump Prior]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/dlldump_prior.jpg)

### Dlldump After

![Dlldump After]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/dlldump_after_procname.jpg)

There's many ways to change the output around but for this example I got rid of the static **module** text and modified it so it saves as *what's being dumped.where it came from.dll*.. this could include the PID, offset, base etc... what fits your needs?

## Moddump

The `moddump` plugin dumped files with the following naming convention **driver.modBase.sys**

File | /path/to/volatility/plugins/moddump.py 
Line | 100
From | `dump_file = "driver.{0:x}.sys".format(mod_base)`
To | `dump_file = "{0}.{1:x}.sys".format(mod_name, mod_base}`

### Moddump Prior

![Moddump Prior]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/moddump_prior.jpg)

### Moddump After

![Moddump After]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/moddump_after.jpg)

Once again, you can see that after the modification the dumped SYS file now starts with the actual process name... yes there's an extra file extension in the beginning but this is just giving examples - you're free to change as needed.  For me, the biggest thing was just pulling all information into the dumped file so I didn't have to look in multiple places.
The point here... open source is great.  You have the ability to give back to the community and customize it to meet your needs so if you want something changed, as I did, don't settle and change it... just be cautious of the projects updates in case one of them conflicts with your modifications.