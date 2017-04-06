---
layout: post
title: dbmgr reloaded
date: '2012-10-01T21:59:00.000-04:00'
author: hiddenillusion
image_folder: '2012-10-01'
tags: [ThreatExpert, dbmgr, avsubmit, mutex, mutant, MACB]
modified_time: '2012-10-01T21:59:23.055-04:00'
thumbnail: http://4.bp.blogspot.com/-MMxfCGCE1ZY/UGpEtfuXtTI/AAAAAAAAAP4/6PHdVXTYOI8/s72-c/page+loop.png
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-2928724367898011349
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/10/dbmgr-reloaded.html
---


I recently had a discussion with another [coworker](https://twitter.com/ChristiaanBeek) regarding scenarios where you can try and determine if something malicious is or was on a system based on mutexes.

# Mutexes

For those unfamiliar with what a mutex/mutant is, a [definition](http://www.microsoft.com/security/portal/Threat/Encyclopedia/Glossary.aspx):

> <i class="fa fa-quote-left fa-fw"></i>
	Stands for Mutual Exclusion Object, a programming object that may be created by malware to signify that it is currently running in the computer. This can be used as an infection 'marker' in order to prevent multiple instances of the malware from running in the infected computer, thus possibly arousing suspicion.
	<i class="fa fa-quote-right fa-fw"></i>

Mutexes are [referred](http://computer.forensikblog.de/en/2009/04/searching-for-mutants.html) to as mutants when they're in the Windows kernel but for the purpose of this post I'm going to only refer to mutexes even when mutant might be the correct technical term (deal with it).  So in theory, and in practice, by enumerating mutexes on a system and then comparing them to a list of mutexes known to be used by malware you would have good reason to believe something malicious is/was on the system - or at least a starting point of something to dig into if you're in the 'needle in a haystack' situation.

During our conversation I remembered a [script](https://malwarecookbook.googlecode.com/svn/trunk/4/12/dbmgr.py) from the Malware Analysts Cookbook which scraped ThreatExpert reports and populated a DB (_Note : This script requires the [avsubmit.py](https://malwarecookbook.googlecode.com/svn/trunk/4/4/avsubmit.py) file from the MACB as well since it takes the ThreatExpert class from it_).  After taking another look at the script, I figured it would be less time consuming to modify it to fit my needs instead of starting from scratch.  This idea can be implemented across other online sandboxes as well but in this instance I'm just going to touch on ThreatExpert.

I grabbed the latest copy of the [dbmgr.py](https://malwarecookbook.googlecode.com/svn/trunk/4/12/dbmgr.py) script but when I went to verify it was functioning properly prior to making any modifications I ran into a tiny hiccup.  As a result of a simple grammatical error within this version of the script, the processing would come to a halt and not complete ... I submitted a quick [bugfix](https://code.google.com/p/malwarecookbook/issues/detail?id=45) and within ~2 mins MHL acknowledged the issue, commented and [fixed](http://code.google.com/p/malwarecookbook/source/detail?r=153) it.  I know it was a small fix but man, what service!

# Working with ThreatExpert

Now that there was a working copy up I took a look at the params/args which ThreatExpert made available and noticed I could use the `find` parameter in addition to the `page` parameter (which the script already included) and supply it with whatever I wanted to search for within the archived reports.

The addition of `sl=1` is credited to another [post](http://www.attackdefendsecure.com/2012/07/improved-artifact-scanner-malware-analysis-cookbook) MHL pointed out a little while ago where another user noted this would filter ThreatExperts results to only show **known bad** ... after all, for the purposes most of us will be using this for, we don't really want to have **good** results.  When you query ThreatExpert you receive ~20 results per page and ~200 pages max from what I've seen.  The other post mentioned above included a quick external bash script to loop the dbmgr.py script and supply it with a new value to grab different pages for bulk results.

To make things easier, I added another def to the script so you have the ability loop through multiple result pages and I also put in a simple check to stop processing results if there's no more left (e.g. - if you tell it to search 5 pages but only 3 are returned, instead of trying to process the last two it checks for the 'No further results to process' text which ThreatExpert produces and exists).

```python
def findme(page,query):
     import httplib
     count = 1
     while (count <= page):
         conn = httplib.HTTPConnection('www.threatexpert.com')
         conn.request('GET', '/reports.aspx?page=%d&find=%s&sl=1' % (count,query))
         response = conn.getresponse().read()
         lines = response.split('\n')
         for line in lines:
             if line.startswith('<td><a href="report.aspx?md5='):
                 addtodb( line[29:61] )
             elif "No records found." in line:
                 print "[+] No further results to process."
                 sys.exit()
         count += 1				
         continue
```

## Useful Query Terms

Example search terms which might be of interest:

- mutex
	- would  produce results which have a greater chance of containing mutexes since that's a required word within the report based on what we're querying.
- exploit.java -or- exploit.swf
	- either of these would produce results which involve either 'exploit.java' or 'exploit.swf' in their A/V name
- wpbt0.dll
	- could be used to look at reports involving a commonly associated BHEK file

There were also a few other cosmetic changes that you'll notice in the patch but those are mainly to display things a certain way I wanted to see them - but I also came across an instance where there was some funky encoding on a file name it was trying to insert which caused it to fail so I added a little sanity check there as well.

![Skip if Exists]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/skip_if_exists.png)

# Retention

So what's the point of this all and why do you care?  One of the reasons which I mentioned above was to populate a DB with known malicious mutexes (without wasting time grabbing a bunch of other reports that aren't relevant to your needs).  

![DB Filled]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/db_filled.png)

This becomes even more handy when you're analyzing a memory image and want to do a cross-reference with volatility's [mutantscan](https://code.google.com/p/volatility/wiki/CommandReference#mutantscan) command.  In fact, if you read the blurb under that commands reference you'll notice the volatility folks actually mentioned a similar PoC they tested so it's good to see others thinking the same way.  Other ways of interest could be to populate a DB and start to put together some stats regarding which registry keys are commonly associated with malware, which registry values, common file names, common file locations targeted, IP addresses contacted via the malware etc.. there's a wealth of data mining that can be done and the great thing is:

1. it can be automated
2. you don't have to have the samples or waste the time processing them in your own sandbox as you can just leverage this free resource.

If you want to play around with the patch I put out, head over to my [github](https://github.com/hiddenillusion/useful-scripts/blob/master/dbmgr.py.patch) and follow the instructions for patching the original version.

**Note** - during recent testing I noticed I wasn't getting results but I believe this might be due to something on ThreatExpert's side, or I'm just being throttled... either way, it works but just be aware in case you aren't getting results every time (even with the original script) ::
