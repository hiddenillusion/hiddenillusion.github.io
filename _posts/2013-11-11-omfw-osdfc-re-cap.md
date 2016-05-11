---
layout: post
title: OMFW & OSDFC recap
date: '2013-11-11T23:12:00.000-05:00'
author: hiddenillusion
tags: [forensics, OMFW, OSDFC, volatility, memory forensics]
modified_time: '2013-11-11T23:13:53.137-05:00'
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-7436033569361116453
blogger_orig_url: http://hiddenillusion.blogspot.com/2013/11/omfw-osdfc-re-cap.html
---

# General Notes

I attended both the Open Memory Forensics Workshop (OMFW) and the Open Source Digital Forensics Conference (OSDFC) for the first time last year and just like I said last year - they're both set as recurring events on my calendar now.  I was told that my tweets and recap post of last years activities was helpful to those who couldn't attend so I figured I'd write up something again since I took notes anyway.  I really like that both conferences have ~30-40 minute talks so you're not stuck listening to anyone ramble about anything and you also get the benefit of getting more presentations.  If you haven't been able to make either of these yet or are still debating if you should attend - go for it.  They're both 1 day (well, if you just go to the presentations) each and I have yet to be let down with the overall quality of presentations and better yet, the networking that you're able to do at them.

# Best Quotes of the Cons

> <i class="fa fa-quote-left fa-fw"></i>They can tunnel faster than you can image<i class="fa fa-quote-right fa-fw"></i> - [@williballenthin](https://twitter.com/williballenthin)

> <i class="fa fa-quote-left fa-fw"></i>Brian Carrier just virtually twerked the audience<i class="fa fa-quote-right fa-fw"></i> - [@bbaskin](https://twitter.com/bbaskin)

> <i class="fa fa-quote-left fa-fw"></i>What one man can invent,  another man can discover<i class="fa fa-quote-right fa-fw"></i> - Sherlock Holmes (on someone's t-shirt)

_Disclaimer - I didn't make it to every talk at OSDFC so if I don't have notes on it, sorry.  Also - these are notes that I jotted down so if something is wrong or there are slides uploaded for ones I didn't link please contact me so I can update the post._

# OMFW

The first thing I want to say about this conference was how glad I was that it was at the same venue as OSDFC this year - this makes it really convenient for those attending both so hopefully it stays that way next year {nudge [@volatility](https://twitter.com/volatility)}.

## The State of Volatility

Presenter | [AAron Walters](https://twitter.com/4tphi)
Notes | Went over where Volatility currently stands, major updates/changes and what's on their [roadmap](https://code.google.com/p/volatility/wiki/VolatilityRoadmap).

### Highlights

	- The Volatility Foundation has officially become a 501(c)(3)
	- Version [2.3.1](https://code.google.com/p/volatility/wiki/Release23) of Volatility is officially released and includes full Mac support, Android/ARM support, new address spaces and new/updated plugins.
	- AAron also touched on a new plugin he created, [dumpfiles](https://code.google.com/p/volatility/wiki/CommandReference23#dumpfiles), which is extremely useful as it reconstructs files from the Windows cache manager and share section objects. 

## Stabalizing Volatility

Presenter | Mike Auty
Notes | Went over a lot of the questions that need to be addressed/answered moving forward with the framework and discussed some of the code layout/structure that needs to be modified

### Highlights

- Version 2.4 of Volatility is pretty much done already but the real focus is version 3 of Volatility.
- The big thing I took away here is that it will be written in Python v3... so I guess it's time to start writing in it too :worried:

## Mastering Truecrypt and Windows 8/Server 2012 Memory Forensics

Presenter | [MHL](https://twitter.com/iMHLv2)
Notes | MHL talked on the research he's recently done regarding Truecrypt and the support that Volatility now has in order to help recover Truecrypt keys in memory.  His slides go into more detail about the structure of Truecrypt'ed data and where to look for it etc. so hopefully those will pop-up online as there was some good information on them.

### Highlights

- The older versions aren't currently supported but that doesn't indicate that it can't, just that most people are probably using the newer versions of it anyway so why waste time on it?
- Did I mention Volatility can analyze Windows 8 and Server 2012 dumps?  The true beauty of open source showed here... just after new releases came to the market there were Volatility profiles to analyze them.  This is pure awesomeness because it means you don't have to wait for a vendor to implement it into a new release of the tool you're using... you can go home and analyze it today!
- Two new plugins were mentioned, and are said to be committed in v2.4, Truecryptpassprase and Truecryptsummary

## All Your Social Media are Belong to Volatility

Presenter | [Jeff Bryner](https://twitter.com/0x7eff)
Notes | Gave a presentation about the recent [plugins](https://github.com/jeffbryner/volatilityPlugins) he contributed to Volatility regarding extracting social media artifacts within memory.  Jeff's only scraped the begining of this and hopefully he or someone else can also take a look at the other social media sites he hasn't yet gotten around too - except MySpace... no one uses that anymore, honestly.

### Highlights

- The first thing about his [presentation](http://jeffbryner.com/omfw2013/) that caught my eyes was his slide deck.  After digging a little into his source code I saw it was all being done with [reveal.js](https://github.com/hakimel/reveal.js) - cool thing to bookmark and also gives you the ability to say "my slides are online right now" so people don't have to bug you about where to find them.
- After watching Jeff demo his plugins some discussions started to spark.  When you visit these social media pages you get a huge JSON file returned and why you may not realize it - there're some real gems in there.  You have the possibility of determining who a users friends are, what they 'like'/'favorite', what they've viewed etc.  This can be significant if you need to say they've communicated with someone or viewed something they're denying.

## All the things you think only exist in movies and sci-fi books

_...OK, I made up the title because I don't remember what it was... but I think this one is fitting anyway_

Presenter | George M. Garner Jr.
Notes | This talk wasn't listed on the schedule but this made up title is right on point.  George seems to either have a presentation that is extremely technical and will make you feel dumb on several occasions or he'll talk about things that some think only happen in the movies... the latter in this instance. Most of his content was just speaking so unfortunately I don't think having his slides would be of more use.

### Highlights

- scary, fun, exciting
- George went into detail about engagements he's been on where there was malware in the BIOS and optical drives.... and of course the recent buzz around 'airgapped' malware wasn't left out.  The only difference... this wasn't fabricated in a Hollywood studio.  This got me thinking, as I'm sure many other in attendance and reading this... how the hell do you even detect these types of things?  I know for sure I'm not looking for this type of malware in my routine investigations but I guess if there's some suspicion then this type of deeper analysis could be started.

## Memory, Volatility and the Threat Intel life Cycle

Presenters | Steven Adair and Sean Koessel
Notes | While this was probably the least technical presentation of the conference, it still added value.  I enjoy hearing about what others have faced while in this field, what worked, what didn't work etc. 

### Highlights

- While I'm sure some of those reading this post already do similar things within their analysis process, I figured it would still be worth mentioning a good tactic they covered - making [YARA](http://plusvic.github.io/yara/) signatures for all archive utilities, Microsoft tools (e.g. - net, copy, xcopy, ftp, psexec, sticky keys etc.).  Useful for many things but in this talk they mentioned leveraging these rules with [yarascan](https://code.google.com/p/volatility/wiki/CommandReferenceMal23#yarascan) to run across memory dumps.
- They also discussed some of the things they've encountered during engagements and some of the things they've needed to recommend to customers.  I feel these are worth pointing out here because I may or may not also come across a lot of these too often and feel they need to be changed as well : 2 factor authentication, flat networks, ability to change all passwords and ability to perform DNS sink-holing.

## Dalvik Memory Analysis and a Call to ARMs

Presenter | [Joe Sylve](https://twitter.com/jtsylve)
Notes | Joe touched on some of the work he's been doing to add ARM support to Volatility, went over the tool 'Dalvik Inspector' and put out a call for people who are interested in this space to help out as there's still a lot to be tackled/uncovered.

### Highlights

- The tool referenced above may or may not sound familiar to you... but in case it doesn't or you forgot where you hear it from, check out the related [blog post](http://www.504ensics.com/automated-volatility-plugin-generation-with-dalvik-inspector/) for it. The tool looks pretty slick and the auto creation of Volatility plugins will surely help others during their Android investigations.  I didn't hear an exact date on its release but it's supposed to be soon so be on the look out!

## Bringing Mac Memory Forensics to the Mainstream

Presenter | [Andrew Case](https://twitter.com/attrc)
Notes | One of the big things with the latest Volatility release was the Mac support.  Some of the Mac support/plugins have been around for a bit but if you look now you'll see the number of [plugins](https://code.google.com/p/volatility/wiki/MacCommandReference23) specifically for Mac is over 30!

### Highlights

- There are some Mac profiles are in a [.zip](https://code.google.com/p/volatility/wiki/MacMemoryForensics#Download_pre-built_profiles) file on the wiki

	> Don't copy them all to the Volatility directory or upon execution it will load each of them and slow things down.  Only copy the one that's applicable.

- **launchd shouldn't be a child process**
- lsmod may show ones with a size of 0 and aren't found on disk - doesn't mean it's malware
- slide 4 on Mac userland rootkits shows how to detect them with plugins (these slides would help, nudge @attrc).
- 10.9.x of Mac compresses free pages so running strings over a dump won't show anything

## Memoirs of a Hidsight Hero: Detecting Rootkits in OS X

Presenter | Gem Gurkok
Notes | Don't try and write a book about Mac rootkits or Gem will make it his hobby to disprove your data before you get to publish it

### Highlights

- There was some really good information here on showing how to detect every new method some authors were saying couldn't be detected but I think the slides would be of better explanation.  

## Every Step You Take: Profiling the System

Presenter | [Jamie Levy](https://twitter.com/gleeda)
Notes | I always tend to find the stuff Jamie talks on to be the most relevant to my daily operations.  Last year she talked on MBR/MFT stuff and this year she showed off some plugins related to profiling/intelligence.

### Highlights

- Jamie touched on a plugin she created a little bit ago, [CybOX](http://volatility-labs.blogspot.com/2013/09/leveraging-cybox-with-volatility.html), which checks for threat indicators in memory samples
- There was also mention of profiling memory dumps.  I can't specifically recall if there was a plugin called 'profiler' but never the less, it was sweet.  Think about generating profiles of memory dumps so you can detect either good stuff or malicious stuff.  In one way of thinking, you can create your golden profile - a baseline of a clean system so you can diff that against another memory dump and see what's different. This can help detect new software, processes etc.  Another thought is creating a memory dump while the system is infected and then using some of those artifacts to later determine if they exist in another memory dump.  This is something that can scale and I'm really excited to start playing with it.

## Honorable Mention

- [ethscan](http://jamaaldev.blogspot.com/2013/07/ethscan-volatility-memory-forensics.html) - This plugin was a runner up in Volatility's plugin contest but it's definitely something I can start to leverage on engagements right away.  I'm not sure how the author's blog post managed to slip under the cracks but it's linked above so give it a look.  I like the fact that it will work for any OS' memory dump and can utilize [dpkt](https://code.google.com/p/dpkt/) to save the network traffic to a PCAP file.

# OSDFC

First... I'm glad the official conference page had a Twitter hashtag to use this year but I still ran into the same issue as last year - people using a variety of hashtags... stick to the default! One of the first observations this year was that it appeared the attendance was double that of last year.  Additionally, I noticed there were a lot of younger attendees this year so it's great to see them getting involved and starting to network.  On the disappointing side - I did feel like I was seeing a noticeable amount of people doing the same things as others have already done.  I know it's useful from a learning perspective to do things yourself but why spend so much time re-doing something that's already out there to use? 

## Forensics Visualizations with Open Source Tools

Presenter | Simson Garfinkel
Slides | http://simson.net/ref/2013/2013-11-05_VizSec.pdf
Notes | Simson has spoken at every OSDFC, he hates pie graphs and likes PDFs

### Highlights

- No seriously, doesn't like pie graphs... and when he rotated them around it kind of made sense.  When you rotate the pie chart the focus of what you're trying to show changes.  He referenced another presentation, [Save the Pies for Desert](http://www.perceptualedge.com/articles/08-21-07.pdf), that's worth a read.
- Simson brought up an interesting point that some graphing tools (graphviz etc.) will produce different graphs when run more than once.  This happens when there's randomized algorithms being used and the seed keeps changing when producing the graphs.  Not good when need things to be repeatable by others.
- Have you every visualized network traffic?  It can certainly be helpful... what about creating some stats/reports?  Sometimes looking at graphs instead of lines within Wireshark can help show things you might have otherwise missed.  A quick, high-level overview can be generated with 'netviz' (slide 46).  It's currently within [tcpflow](https://github.com/simsong/tcpflow) and creates some histogram for you.
- He made some valid points for PDFs having a high resolution that could be zoomed in on and also they have the ability to be text searchable

## Autopsy 3: Extensible Desktop Forensics

Presenter | Brian Carrier
Notes | Brian twerked it

### Highlights
- Brian had a great transition in his slides to incorporate a Miley Cyrus picture (related quote later in this post)
- The keyword searches within Autopsy refresh every 5 mins by default
- The searches for specific locations (e.g. - user's folders) are prioritized so their results show first.  (can this be modified??)
- The video triage module does periodic screenshots of the video so you don't have to sit there and watch the entire thing to see if it changes at any point
- The text gisting module helps translate text into English
- Future things - will use SQLite for hash DB, carve using Scalpel and will have Mac and *nix installers

## "Challenge Results" - Autopsy Module Contest

Notes |  I was surprised there were only two submissions to this contest and just as surprised that both of them were more on the complex side of things.  Someone could have just created a module to periodically show a cat picture and won some dinero.  Of the two submissions, one was a remote submission and only had a video to show if off.  It looked useful, but just didn't cut it - Willi B took the gold.

### Highlights

- [Registry Module](https://github.com/williballenthin/Autopsy-WindowsRegistryIngestModule/); an entire library in Java
- [fuzzy Hash Module](https://github.com/pcbje/autopsy-ahbm)

## A Tool for Answering the Question: What Changed on Disk?

Presenter | Stuart Maclean
Notes | Tool to do some diffing (waiting for github for code)

### Highlights

- Armour - shell program to compare TSK bodyfile's
- slide 15 - cmd's
- slide 19 - cuckoo report
- Not just used for VM diffing, slide 21 - can do psychical machine disk diffing w/ external drive and *nix live cd

## Bulk_Extract Like a Boss

Presenter | [Jon Stewart](https://twitter.com/codeslack/)
Slides | http://www.lightboxtechnologies.com/wp-content/uploads/2013/11/OSDFC2013-JonStewart-Bulk_extract_Like_A_Boss.pdf
Notes | Lightgrep FTW

### Highlights

- Unicode shout out to U+1F4A9 (you know you want to look this up now)
- With lightgrep incorporated into bulk_extractor, if you disable the normal 'find' disabled (-x find) you'll have blazingly fast searches - slide 11
- Bulk_extractor contains recursive scanners to extract files then scan them (defaults to recurse 7 times to make sure don't fall into zip bombs)
- There's a couple of new scanners - xor and hiberfil
- "useful options" - slide 8
- paper in last years DFWRS on its unicode support
- Lightgrep is incorporated into the Windows installer and the source can be downloaded and installed yourself for other flavors

## Making Molehills Out of Mountains: Data Reduction Using Sleuth Kit Tools

Presenter | Tobin Craig
Notes | The speaker saw a gap and tackled it but I do think some of it is repetitive to what's already out there.

### Highlights

- Built to work on DEFT v8
- Created a bash script that leverages TSK
- **limitations**: limited to FAT/NTFS partitions and relies on file extentions to determine file types

## Doing More with Less: Triaging Compromised Systems with Constrained Resources

Presenter | [Willi Ballenthin](https://twitter.com/williballenthin)
Notes | Willi showed that you don't always need to have the entire disk in order to answer the key questions to your investigation.  He also let us into his analysis process and a peek into all of the sweet things he's written.

### Highlights

- '[pareto principle](http://en.wikipedia.org/wiki/Pareto_principle)' - get 20% of artifacts to answer 80% of the questions
- The key data to grab is generally the $MFT, Registry files and Event Logs (others, depending in your questions to ask could be memory, Internet history etc.)
- These key files compress extremely well and are generally result in being under 100MB 

Repo | Tool | Notes
--- | --- | ---
[INDXParse](https://github.com/williballenthin/INDXParse) | [list_mft.py](https://github.com/williballenthin/INDXParse/blob/master/list_mft.py) | creates timeline and can also pull resident INDX records
[INDXParse](https://github.com/williballenthin/INDXParse) | [MFTView.py](https://github.com/williballenthin/INDXParse/blob/master/MFTView.py) | pulls resident data if it's there in the 'Data' ta and tells what sectors to pull from disk to get contents of it if not ; right pane shows Unicode/ASCII strings so can see refinements of what was previously there
[INDXParse](https://github.com/williballenthin/INDXParse) | [get_file_info.py](https://github.com/williballenthin/INDXParse/blob/master/get_file_info.py) | CLI that's scriptable and creates a mini timeline
[python-registry](https://github.com/williballenthin/python-registry) | [reg_view.py](https://github.com/williballenthin/python-registry/blob/master/samples/regview.py) | R/O GUI registry viewer
[python-registry](https://github.com/williballenthin/python-registry) | [findkey.py](https://github.com/williballenthin/python-registry/blob/master/samples/findkey.py) | search keys/values/paths etc. to feed it keywords to search for
[python-registry](https://github.com/williballenthin/python-registry) | [timeline.py](https://github.com/williballenthin/python-registry/blob/master/samples/timeline.py) | create timeline from key modification time stamps
[python-registry](https://github.com/williballenthin/python-registry) | [forensicating.py](https://github.com/williballenthin/python-registry/blob/master/samples/forensicating.py) | some functions I put together to show how to utilize this library for forensics (got a sweet shout out for it, w00t w00t... now your turn)
[python-evtx](https://github.com/williballenthin/python-evtx) | [Lfle.py](https://github.com/williballenthin/LfLe) | carve for records

Willi also mentioned a GUI Event Log Viewer which has the ability to index records for easier searching and puts the event IDs in categories/sub-categories that are sortable.  This is something I had talked to a few about over the years and I'm really glad to see someone finally doing it, thanks Willi!  This currently isn't publicly released yet but be on the lookout.

## Computer Forensic Triage using Manta Ray

Presenters | Doug Koster & Kevin Murphy
Notes |  "Automated Triage" - looks to be the same thing as Tapeworm was.  There looks like there still needs some things to be ironed out/finished.  In my investigations I don't need to run every tool every time and that's kind of what I feel this does... maybe useful for others but doesn't fit into my process flow.

### Highlights

- Going to be in SIFT v3.0 but for the time being it's at mantarayforensics.com

## Honorable Mention

- [Noriben](https://github.com/Rurik/Noriben) - [Brian Baskin](https://twitter.com/bbaskin) gave a quick demo of his latest version ; useful for quick analysis
- [SIFTER](https://github.com/jonstewart/Sifter) - "the Google of digital forensics"... I unfortunately didn't make it to this talk but I heard it was great so I'm putting it here as it's something I want to look into and feel others might want to as well.
MassScan - This was described as an internal VirusTotal tool.  Unfortunately the display on the projectors wasn't working properly so it wasn't easy to follow along but I'm eager to see the code and what it can really do. (_anyone have a link?_)
