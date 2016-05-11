---
layout: post
title: What to use for analysis on a per file extension -or- category basis
date: '2012-02-13T20:17:00.000-05:00'
author: hiddenillusion
tags: [analysis, dfir, malware, classification]
modified_time: '2014-01-21T12:42:26.126-05:00'
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-3342383691730262351
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/02/what-to-use-for-analysis-on-per-file.html
---

# Overview

As you are all aware of, there are a ton of different tools out there and the list just keeps growing.  A coworker of mine is working on some malware automation and often times we needed to determine which tools we wanted to run against said files.  This outcome varies based on the type of file it can be identified and classified as of course but still... what do you use?  I know I can't remember everything I come across everyday or sometimes have a brain fart and forget what tool can be used in what situation or on what type of file so I started to create a spreadsheet that would help aid in this type of debacle.  The list started to take on a life of its own and as you can imagine the scope can be very large depending on what your goals are and how you want to store this information.

This list could very well be made into a DB and represented/maintained better but for quick answers on the road this was the best option for me.  I'm posting this up on [Google Docs](https://docs.google.com/spreadsheet/ccc?key=0AkUsWCe2UT8HdE9sa3hCX2dVb1ZqbHNrVWVUUl9kaXc) where I will periodically update the list (feel free to give me recommendations to add.  Hopefully it will be of use for others as I know it's come in use for me and some others already.  If you need to modify it for your own means then please do - just download a local copy and have at it.  Don't send me feedback that there's a row incomplete, I'm aware.

As I started to say, my first intention was to have a list of tools broken down by what files they could be used to analyze.  Because a tool can be used to analyze more than one file extension (i.e. 7zip for .zip/.rar/.7z/.jar etc.) I have certain tools listed multiple times.  When I have a sortable list, I don't want to have to result in searching the spreadsheet to find what I'm looking for but would rather just filter by the file extension and see what results I have stored.

> **Update** : changed this so multiple file extensions would be listed next to the same tool.  It was convenient to filter just by the extension but I got tired of having so many duplicate lines for a single tool.  You can just as easily click on that column and filter based on a cell containing what you're looking to analyze.

As I continued to populate this list I thought why just list out tools for malware analysis?  There's plenty of dfir & general use tools/sites which this would be applicable to in my everyday environment so I added a few other columns.... You may notice that some of it is incomplete (i.e. not all fields are filled in for every row) or that I may have forgotten some common tools but hey, we all get busy and it's a living file - meaning it will never be complete because new things are always being released..

# Description of the list

Some of the other notes to take into account are that for me personally, I would like to know if it's a CLI/GUI (or both) type of tool, what the tools described as, where I can get it, any useful switches that I should know about, does it require an install to use and finally is it a part of anything else I may already have so I don't have to go and get it.  With that being said, the structure of the spreadsheet is as follows:

Column | Purpose
--- | ---
File Ext | what file extensions can be processed by this tool
Tool | the name of the tool
Category | what's the best fitting main category to apply to this tool (you'll notice that there's overlap)
Sub-Category | helping to narrow down for particular situations of analysis.  (i.e. I may be looking for a tool to use for ADS or VSCs or Rootkits).  This is especially helpful for those tools that aren't just to be classified by the file extensions they can handle.
Useful Switches | helps save time reading man pages or looking it up online
Type | useful to know if it's a CLI/GUI/Both for scripting purposes & forensic footprints on IR engagements
Tool Description | quick summary of what the tool is or what it can do.  In full disclosure - most of the time I did not personally write these; I usually just copied and pasted them from the authors description or wherever I found out about the tool.  Why re-invent the wheel, but credit goes to the other guys when appropriate.
Linkage | helpful to know where to get the tool at...
Require Install? | this is very important to know in certain situations so if I know that there's a full install required it will have some impact on my decision if I'm on an IR engagement and not doing some postmortem analysis in a lab.
Included In? | I started to put in some of the common frameworks/distros such as TSK, REMnux, SIFT etc.