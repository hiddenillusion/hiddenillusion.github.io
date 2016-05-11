---
layout: post
title: YARA + Volatility ... the beginning
date: '2012-04-19T21:41:00.003-04:00'
author: hiddenillusion
image_folder: '2012-04-19'
tags: [YARA, ClamAV, pescanner, volatility, REMnux, bash, python, scripting]
modified_time: '2012-11-12T11:42:48.376-05:00'
thumbnail: https://lh3.ggpht.com/-VcTjSVTn3fU/T3E7_iY9yoI/AAAAAAAAACQ/e4kBirVe39k/s72-c/remnux_pescanner_yara.tiff
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-1646534841352484532
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/04/yara-volatility-beginning.html
---

YARA - the sleeping giant.  There's been mention of it over the last few years but as far as adoption - I think it's still lacking in the tool set of many analysts. I personally like to leverage YARA on its own, within pescanner and most definitely within volatility's malfind.  I've recently encountered two obstacles:

1. Converting ClamAV to YARA signatures
2. How to process multiple YARA rule files.

# YARA's include feature

If you take a look at page 26 of YARA's v1.6 User's Manual you'll see it outlines an option to include multiple rule files from within a single file (_thanks Par_).  In other words, if you use the standard syntax for calling YARA from the cli:

`yara /path/to/rules.yara <file>`

you can't specify multiple rule files (without some foo of course).  Another prime example is within MHL's pescanner where you define the location of your rules file at the bottom, but again, a single rules file:

```python
# You should fill these in with a path to your YARA rules...
pescan = PEScanner(files, '/usr/local/etc/capabilities.yara')
```

The above snippet of code within pescanner where you define the path to your YARA rules.  This particular example is taken from [REMnux](https://remnux.org/) and is already filled out, generally it's left blank for your own configuration. 

The use of the `include` feature is one way of circumventing such a restriction because by placing this with the path to your other rule files to the top of the main rules file you're invoking, YARA will automatically process those additional rule files as well.  Here's an example of what I mean:

```python
include "/path/to/other/rules.yara"
include "/path/to/other/rules2.yara"
```

Simple and straightforward.  Just pop that syntax into the top of your main rule file and you're good to go.

So.. cool right?  Sort of... maybe useful if you have certain rule files you want to use for certain things, like pescanner, but I have a lot of files :/ . If you don't have many rule files then sure... but what if you have a bunch of different ones and foresee yourself continuing to split up or create new ones?

> Having to constantly update the main rule file with an `include /path/to/new/rules.yara` every time just sounds like too much upkeep.

...Say what...you don't see yourself having that many rule files for it to be a concern you say? ... Well what if, for example, you convert the ClamAV signatures to YARA rules?

# Converting ClamAV rules to YARA signatures

The Malware Analysts Cookbook provides such a means with [clamav_to_yara.py](http://malwarecookbook.googlecode.com/svn/trunk/3/3/clamav_to_yara.py).  At the time of writing this there is an open issue with this script but there are a couple modified versions which work a bit better - still produce some errors, but not nearly as many.  There are a few tutorials out there on how to convert ClamAV signatures to YARA rules and it looks pretty straight forward, but I found some things have either changed or people just left out details.  If you have a fresh install of ClamAV you need to make sure you unpack its signature file before you can use the conversion script on it.  This can be done using ClamAV's sigtool:

`$ sigtool -u /var/lib/clamav/main.cvd`

which when complete will leave present you with the following:

![ClamAV Decompressed]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/clamav_decompressed.jpg)

Once you have the .ndb file you can proceed to converting as follows:

`$ python clamav_to_yara.py -f main.ndb -o clamav.yara`

Based on what I've encountered I believe depending on what version of the ClamAV signature DB you have and which version of the clamav_to_yara.py script you have, you may or may not get some signatures which YARA won't process.  I happened to get the problem child this time around and if get errors relating to invalid jumps etc. you can just remove those rules as needed since the errors are nice enough to tell you which lines it doesn't like.

**The resulting file was ~18 MB of newly generated YARA rules based off the ClamAV signatures** ...fwe... that's a lot.  I tried multiple ways/attempts to get YARA to use this rule file but failed every time.  My assumption was that it's just too big to process in a timely manner like all of the other (smaller) rule files.

# Bashing it up

But I had a thought... so I started to split this big ol' file into smaller chunks and wanted to see at about what size would be ideal.  Finally at ~512K it seemed to be pretty fast and effective.  To split the file in an easy fashion you can use some form of the `split` command... e.g.:

`$ split -d -b 512k clamav.yara`

> If you split based on size like I did here you need to realize that it's going to cut the top/bottom signatures into pieces because you're only taking size into consideration and not splitting based on the signatures' structure. This can be easily fixed by going through each one and re-assembling just those two rules but if you don't do this, it's going to scream about the broken rules.

If you did the math, now you can see where I'm going.  This little workaround produced (33) YARA rule files and no, I don't want to add them all statically in case something changes.  When I'm doing some Volatility automation I usually define the path to my YARA rules in the beginning, e.g.:

```python
YARA_Rules="/path/to/capabilities.yara"
```

but because of what we've just found out, a simple workaround to use instead is:

```bash
YARA_Rules=(`find /path/to/rules/ -type f -iname *.yara -exec ls {} \;`);
```

What this essentially does (in Bash) is point to the location where you keep all of your YARA rules and then it will list them all so that you don't have list them one-by-one... you can then parse them in an array:

```bash
for rule in "${YARA_Rules[@]}"; do
```

and then pass them to the normal volatility syntax from within your Volatility automation script, e.g.:

```bash
YARA_Rules=(`find /path/to/rules/ -type f -iname *.yara -exec ls {} \;`);  

for rule in "${YARA_Rules[@]}"; do
   vol.py -f <mem.raw> --profile=<profile> malfind -Y $rule -D /path/to/dump/directory >> log
done
```

Hopefully my troubles and workarounds will help someone else out there.. as always, ping me for feedback, tips etc. 

# Feedback from MHL's comment

Ah yes, 18MB of converted clamav signatures is a lot. That's why in the book we said _it is not useful to convert **all** ClamAV signatures_ ;-) 

> If your goal is to scan memory with all clamav signatures, and you already have clamav installed, which you must in order to use sigtool, I'd suggest either:

1) use `vaddump` and `moddump` to extract data to disk, then run `clamscan` on the directory
2) write a volatility plugin that uses pyclamd API or invokes clamscan 

> The problem with your method above is that you're calling `malfind` once for each yara rules file, and you have 33, which results in the entire scan taking 33 times longer than it normally would.

Just to see how much effort was involved, I wrote a few sample plugins which are posted here: http://pastebin.com/1XZdGXNv. If you want to combine scanning to use all clamav rules and your custom yara rules which are spread across multiple rules files, do the rules file enumeration inside the plugin. That way, the data you're scanning is only carved from the memory dump once, and it will all be a lot faster.