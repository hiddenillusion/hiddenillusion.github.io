---
layout: post
title: Is that an Infection or a False Positive?
date: '2012-07-02T10:05:00.002-04:00'
author: hiddenillusion
image_folder: '2012-07-02'
tags: [anti-virus, hash, sigtool, ZeuS, ClamAV, pescanner, commodity malware, CFF Explorer, HxD]
modified_time: '2012-07-02T11:30:13.337-04:00'
thumbnail: http://2.bp.blogspot.com/-4X9nr2RNtnQ/T-pylYRJxwI/AAAAAAAAAK0/GMX1XV5Yh0E/s72-c/7z+sections+extract.jpg
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-1832592053795789690
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/07/is-that-infection-or-false-positive.html
---

* toc-content
{:toc}

Have you been in a situation where there's a file being flagged by A/V and you don't really agree? I was in a situation where I was noticing files being flagged as a generic variant of ZeuS and while at first you can't necessarily disregard the alert -no matter your feelings on the A/V- you can do a little digging and try to determine what's actually going on.  This  is not something you are or should do for every infection you come across, but rather a more practical use is to understand why certain files may be mis-classified when they are in fact benign.

The particular A/V vendor that was reporting the alerts was classifying them as _W32/Zbot.gen.*_ ... the "gen.b" was most noticeable.  I grabbed one of the files in question and started to poke around.  Some of the usual first steps led no where - internal hash lookups, external hash look-ups (Cymru, VT etc.), pescanner had a generic YARA hit for banker based on a string which looked all too common, dynamic analysis didn't show anything... so I started to extend some of my initial steps.

## Analysis Steps

I extracted the PE sections with `7zip` so I could do sectional MD5 hashing and see if I could get any leads by comparing those to other known bad sectional hashes:

`7z x <file>.exe -osections`

The above syntax will extract the contents of each of the PE sections, in a tree structure (note that these will most likely be hidden since they start with "." so make sure you list all):

![7z Sections Extracted]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/7z_sections_extracted.jpg)

Now that the PE sections are dumped I opted to use ClamAV for creating the sectional based MD5's.  ClamAV gives you this ability by using the following syntax:

`sigtool --mdb <file>`

The format that gets created for these signatures is **PESectionSize:MD5:MalwareName**

If you do it right, you should see similar output to this:

```
57344:fceb22b4c5be5a981e6b7bd1e47dca63:.data
45:8e5a1b84a87bcd2eed7b3ab698a72123:files.txt
77824:34aeb441429d8f6184d0f6ba5d34cddd:.rdata
479232:68c0e32b605b7ccead4ad9520d5a5acc:.text
```

Welp... no luck on that front either -  but since I didn't have all my samples to cross-check them against, it was more of a long shot anyway.  Now what sparked curiosity is that ClamAV was also raising alerts on this particular file with the name _Trojan.Murofet_.  That name is interchanged with Zbot depending on which vendor you're using so it was still leaning towards the same kind of classification for this file.  Hey, if two A/V's are flagging it for pretty much the same thing isn't that more credibility?

I've been incorporating ClamAV and it's misc. tools more into my process because it's free, maintained, cross-platform, I'm able to create my own signatures and I can even view/edit theirs.  Think about how great the latter of that statement is... If I don't like how something's being detected, I can change it myself.  If I want to catch something from my personal collection I can create my own signature and here's the greatest part - I can see what was being used in order to classify a detection.  Most of the bigger A/V companies hold that little gem to themselves and thus make this type of analysis difficult.

Using ClamAV's `sigtool` I decompressed its main signature datababase:

`sigtool -u /path/to/main.cvd`

![ClamAV DB Unpacked]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/unpack_clamav_db.jpg)

The second part of the above image shows me searching for the detection it was classifying it as (Murofet).  You'll notice that there's more than one entry in this case and that they're both a bit different.  The first hit, Trojan.Murofet, is a sectional hash signature taking on the following format:

PESectionSize | MD5 | MalwareName
--- | --- | ---
69632 | 7e82be33bfa6b241bf081909d40e265c|Trojan.Murofet

The second hit, W32.Murofet, is a regular signature taking on the following format:

Meaning | Data
--- | ---
MalwareName | W32.Murofet
TargetType | 1
Offset | EP+0
HexSignature[:MinFL:[MaxFL]] | e850000000e9????????73686c776170692e646c6c0061647661706933322e646c6c0075726c6d6f6e2e646c6c00536f6674776172655c4d6963726f736f667400746d7000687474703a2f2f002f666f72756d2f005589e583ec0453e8ea0100008945fc

The second hit is of more interest in this case if we take a look at what it's really saying...

<i class="fa fa-quote-left fa-fw"></i>For any 32/64 bit EXE, if at the entrypoint you see "èPéshlwapi.dlladvapi32.dllurlmon.dllSoftware\Microsofttmphttp:///forum/U‰åƒì Sèê ‰Eü" then flag it as W32.Murofet.<i class="fa fa-quote-right fa-fw"></i>

> The HEX string showed in the hit can be decoded from HEX to ASCII which will reveal the string displayed above between the quotes.  The use of double question marks inbetween is a wildcard stating _match any byte_

Since I now know what the signature within ClamAV was triggering on I wanted to take a look at the EXE's entry point and see if those strings were in fact there.  Even though this could have still been done within REMnux, I flipped over to a Windows analysis box and opened the file in [CFF Explorer](http://www.ntcore.com/exsuite.php) to get a different view of things.  From within the 'Sectional Headers' I could see the entrypoint (bottom right):

![CFF Explorer Entry Point]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/CFF_explorer_entry_point.jpg)

Geared with that value I opened a hex editor, HxD in this example, and pointed it to go to that offset :

![HxD Entry Point]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/HxD_going_to_entry_point.jpg)

and wouldn't ya know it ... I was presented with "shlwapi.dll , advapi32.dll,  urlmon.dll, Software\Microsoft, tmp, http://, forum" .  So does the presence of these strings make the file malicious or do they simply help in trying to determine its characteristics/capabilities from a static analysis perspective?  If you've ever analyzed a ZeuS sample you'd notice that what was uncovered here doesn't quite line up with the normal data encountered, however, what about ZeuS-Licat?  Trend Micro has a great write up [here](http://www.trendmicro.com/cloud-content/us/pdfs/security-intelligence/white-papers/wp__file-partching-zbot-varians-zeus-2-9.pdf)<i class="fa fa-file-pdf-o fa-fw"></i>.  What it appears is that there was a version of ZeuS somewhere else which dropped Licat and what we saw at the files entry point was newly added malicious code - now  appended to this once legitimate file (file infector characteristic).

Even if you can't dig into the signature responsible on the other A/V you shouldn't call it quits.  If you can find another tool (such as ClamAV) which is classifying it in a similar way then there's a good chance that it's following some of the uncovered signatures logic within ClamAV and you have an idea of how/if it was being mis-classified. Even if you look at a file and a large majority of it looks legitimate -and- even may still run as it once did (in this example the malicious code would execute at the entry point and then jump back to the files original entry point so it could run as it normally did) try and look for anomalies and if possible cross reference the file in question with another version of the original file to find discrepancies.

# Further Reading

More information on ClamAV signatures can be found [here](http://www.clamav.net/doc/latest/signatures.pdf)<i class="fa fa-file-pdf-o fa-fw"></i>