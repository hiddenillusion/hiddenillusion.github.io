---
layout: post
title: Go Prefetch Yourself
date: '2016-05-10T17:00:00.000-05:00'
author: hiddenillusion
tags: [prefetch, execution, indxparse, jinja, python, tsk, fls, volatility, memory forensics]
---

{% assign counter=0 %}

* toc-content
{:toc}

# Overview

If you're reading this then I'm sure you're aware of what _Prefetch_ on a Windows system is so I won't bore you with a recap. Instead, I'd rather touch upon a different view of Prefetch and how I've leveraged it in non-traditional ways during my forensicating. Occasionally I've come across a few situations where I needed both sides of a Prefetch file. By two sides, I'm referring to:

1. the prefetch filename (application name + path hash)
2. the full path for where the file it was created for resided during execution

I've come across various verbiage when reading on this topic so for the remainder of this post, I'll be referring to these two items, and some others as:

Term | Example
--- | ---
_original path_ | C:\Windows\Users\user\AppData\Local\Temp\svchost.exe
_filename_ | svchost.exe
_file directory_ | \Windows\Users\user\AppData\Local\Temp\
_kernel path_ | \DEVICE\HARDDISKVOLUME1\WINDOWS\USERS\USER\APPDATA\LOCAL\TEMP\SVCHOST.EXE
_device path_ | \DEVICE\\(HARDDISKVOLUME#\|LANMANREDIRECTOR\|HGFS)
_prefetch file_ | SVCHOST.EXE-41CE8261.pf
_path hash_ | 41CE8261

## TL;DR

In the event you only have details about the _prefetch file_, one can attempt to "bruteforce" the _original path_ by iterating combinations of:

> _device path_ <i class="fa fa-plus" aria-hidden="true"></i> known _file directory_ <i class="fa fa-plus" aria-hidden="true"></i> _filename_

Otherwise, if you only have details about the _file directory_\\_filename_ but aren't sure which device held the _filename_, one can attempt to "bruteforce" the _original path_ by iterating combinations of:

> all possible/known _device path_ s <i class="fa fa-plus" aria-hidden="true"></i> known _file directory_ <i class="fa fa-plus" aria-hidden="true"></i> _filename_

# Hashing

If you look at libjoachim's [notes](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#54-hashing-the-executable-filename), the steps to generate the name of a prefetch file involve:

> 1. Determine the full path for the executable, e.g. let’s assume the full path for "notepad.exe" is "C:\Windows\notepad.exe".
2. Convert the full path into an upper-case Windows device path: "\DEVICE\HARDDISKVOLUME1\WINDOWS\NOTEPAD.EXE"
3. Convert the string into an UTF-16 little-endian stream without a byte-order-mark or an end-of-string character (2x 0-bytes)
4. Apply the appropriate hash function.

To put this into perspective:

<i class='fa fa-quote-left'></i> On a Windows XP (32-bit) system, calculating the prefetch hash of "\DEVICE\HARDDISKVOLUME1\WINDOWS\NOTEPAD.EXE" should generate the value 0x189578da. This in turn should correspond to the _prefetch hash_ value in the _prefetch file_ (e.g. - C:\Windows\Prefetch\NOTEPAD.EXE-*189578DA*.pf). <i class='fa fa-quote-right'></i>

## Those Ah-Ha's

In addition to the hashing method described above, you may come across an instance where:

- the application which was ran originally resided on another device

> Note: On **Windows Vista** and **Window 7** the volume indicated by C: is often the second volume (where the boot partition is the first) hence the Windows device path for C: will be "**\DEVICE\HARDDISKVOLUME2**". [ref](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#54-hashing-the-executable-filename)

While that note is definitely something to be aware of, you also need to consider situations where that may not be the case (e.g. - a Windows 7 virtual machine vs. a harddisk with Windows 7 pre-installed from Dell). If you're unsure, the best approach is just to loop through "\device\harddiskvolume*#*".

What about hosting applications and command line arguments?

- the application which ran was a hosting application (e.g. dllhost.exe, mmc.exe, rundll32.exe or svchost.exe)
- the [`/prefetch`](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#61-prefetch-flag) switch is used

<i class='fa fa-quote-left'></i> In these cases, the Prefetch file name no longer relies on a device .exe path only. It does take it into account of course, but it also includes a command line used to launch an application itself and/or /Prefetch command line argument if it exists. <i class='fa fa-quote-right'></i> [ref](http://www.hexacorn.com/blog/2012/06/13/prefetch-hash-calculator-a-hash-lookup-table-xpvistaw7w2k3w2k8/)


# Tooling Around

Now that we have an understanding of how a Prefetch file's hash is created we need to translate those steps into some usable code. There are other code snippets out in the interwebs but since these are commonly referenced and have been used successfully, here are three resources to help with the generation of Prefetch path hashes:

Code/Resource | Notes
--- | ---
[`prefetch_hash.py`](https://github.com/gleeda/misc-scripts/blob/master/prefetch/prefetch_hash.py) | Standalone python script that generates the name of the prefetch file given a kernel path to the program. Supports<sup>1</sup> **XP/2003/Vista/2008/7** SCCA hashing algorithms.
[libscca](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#5-calculating-the-prefetch-hash) | Contains python functions to produce the same as the above script but has support for newer SCCA hashing & doesn't require an additional module. Supports **XP/2003/Vista/2008/7/2012/8/8.1** SCCA hashing algorithms.
[`prefhashcalc.pl`](http://hexacorn.com/d/prefhashcalc.pl) | Prefetch hash calculator and lookup table generator. It also supports calculating the _prefetch hash_ when there're command line arguments (e.g. - dllhost, mmc, rundll32, svchost). Supports (_some bitness_) of **XP/2003/Vista/2008/7** SCCA hashing algorithms.

<sup>1</sup> <small>Even though it doesn't say it, this script should likely [support](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#5-calculating-the-prefetch-hash) Windows 2012/8/8.1</small>

Additionally, here're some other resources leveraged for this post:

Code/Resource | Notes
--- | ---
[`list_mft.py`](https://github.com/williballenthin/INDXParse) | Python script that parses a $MFT and provides entry details (file paths of files on said system in this case) + supports _jinja2_ templating
[`prefetchparser`](https://github.com/superponible/volatility-plugins/pull/4) | `volatility` plugin that scans a memory dump for Prefetch files and provides the _prefetch file_/_path hash_/_original path_
[`generate_prefetch_hashes.py`](https://github.com/hiddenillusion/IR/blob/master/Research/generate_prefetch_hashes.py) | Script I wrote to combine above mentioned hashing algorithms, allows one to supply filepaths a few ways & has the ability to try and brute force a filepath for you.
[`volatility`](https://github.com/volatilityfoundation/volatility) | Because it rock the memory out of you
[Memory dumps from Jackcr's DFIR challenge](https://github.com/volatilityfoundation/volatility/wiki/Memory-Samples) | Memory dumps used for testing + parsed $MFT's to validate memory findings & SCCA hash calculations
[`jq`](https://stedolan.github.io/jq/) | will be your new besty for dealing with JSON data (_but it might take some getting used_)

# Why Do You Care?

There are several reason why this blog post might ring a bell for you or you might bookmark it for further engagements, if you're not already aware and leveraging this type of technique. Some of the more obvious reasons why I'm even writing about this are:

When you only have the _path hash_, the ability to map the _path hash_ to an _original path_ produces evidence that:

1. the file resided at the _original path_ at one point in time
1. indicates the file at _original path_ executed on the system

When you can determine where the _prefetch file_ was originally location you:

1. can determine what device the application was actually located on
1. have the ability to map the _original file_ to having contact with said system
1. indicates the file at _original path_ executed on the system

## Use Cases

So what might some of those situations I made mention of previously actually entail you ask...

1. Did said file exist on the system, and if so, what was its _original path_ ?
1. Were there any indications said file executed on the system?
1. If you recovered or carved the Prefetch file
1. If you only have references to the _prefetch file_ as a string (think keyword hit in unallocated space)
1. Reference to the _original path_ was found in another artifact (event logs, $MFT, A/V logs etc.) and no _prefetch file_ was found or what you're analyzing doesn't cover/contain those details
1. You know the _prefetch file_ but can't determine which device it was originally located on.

### Scenario Uno

Through some means (timeline analysis, an entry within A/V logs etc.) we found a file of interest, or _original path_; However, this file was no longer present on the system at the time of analysis. 

**Q. What do we know?**

In this scenario we only have the full path to the file of interest _C:\Users\User\AppData\Local\Temp\svchost.exe_. The physical _prefetch file_ is either not present on the system or the evidence we're sifting through doesn't contain it (e.g. - just reviewing A/V logs or $MFT).

**Q. Solution**

We can leverage the [known SCCA hashing code](#tooling-around) and try to determine what the _prefech file_ would have been.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				<li>generate_prefetch_hashes.py -i 'C:\Users\User\AppData\Local\Temp\svchost.exe'</li>
				<ul>
				<li>{</li>
				    <li>"2BF01587": [</li>
				        <li>"xp_gleeda",</li>
				        <li>"xp_libyal"</li>
				    <li>],</li>
				    <li>"41CE8261": [</li>
				        <li>"vista_gleeda",</li>
				        <li>"vista_libyal",</li> 
				        <li>"2008_libyal"</li>
				    <li>],</li>
				    <li>"device_used": "\\DEVICE\\HARDDISKVOLUME1\\",</li>
				    <li>"filepath": "\\DEVICE\\HARDDISKVOLUME1\\USERS\\USER\\APPDATA\\LOCAL\\TEMP\\SVCHOST.EXE"</li>
				<li>}</li>
				</ul>
				<li>prefetch_hash.py -v -p '\DEVICE\HARDDISKVOLUME1\USERS\USER\APPDATA\LOCAL\TEMP\SVCHOST.EXE</li>
				SVCHOST.EXE-41CE8261.pf
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

In the above example, we:

1. Used the _original path_ that we knew and ran it through each SCCA hashing function with the _device path_ as HARDDISKVOLUME1
1. Validated the HEX version (41CE8261) of the calculated _path hash_ was correct with another [script](#tooling-around).

But - what if HARDDISKVOLUME1 isn't the correct device? ([refer back](#those-ah-has)). In this situation, instead of supplying
a _device path_ we can use the `--brute_force` option in my [p.o.c script](#tooling-around) and generate various _path hash_ values
for multiple SCCA hashing algorithms & multiple (known) _device paths_. While the script may not be perfect, the thought process is on track.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				<li>generate_prefetch_hashes.py -b -i 'Users\User\AppData\Local\Temp\svchost.exe'</li>
				<ul>
				<li>{</li>
				    <li>"390E4197": [</li>
				        <li>"xp_gleeda",</li>
				        <li>"xp_libyal"</li>
				    <li>],</li>
				    <li>"81D3D7CC": [</li>
				        <li>"vista_gleeda",</li>
				        <li>"vista_libyal",</li>
				        <li>"2008_libyal"</li>
				    <li>],</li>
				    <li>"device_used": "\\DEVICE\\HARDDISKVOLUME0\\",</li>
				    <li>"filepath": "\\DEVICE\\HARDDISKVOLUME0\\USERS\\USER\\APPDATA\\LOCAL\\TEMP\\SVCHOST.EXE"</li>
				<li>}</li>
				<li>{</li>
				    <li>"2BF01587": [</li>
				        <li>"xp_gleeda",</li>
				        <li>"xp_libyal"</li>
				    <li>],</li>
				    <li>"41CE8261": [</li>
				        <li>"vista_gleeda",</li>
				        <li>"vista_libyal",</li>
				        <li>"2008_libyal"</li>
				    <li>],</li>
				    <li>"device_used": "\\DEVICE\\HARDDISKVOLUME1\\",</li>
				    <li>"filepath": "\\DEVICE\\HARDDISKVOLUME1\\USERS\\USER\\APPDATA\\LOCAL\\TEMP\\SVCHOST.EXE"</li>
				<li>}</li>
				...
				<li>{</li>
				    <li>"22D6F8E6": [</li>
				        <li>"xp_gleeda",</li>
				        <li>"xp_libyal"</li>
				    <li>],</li>
				    <li>"4ECE2F8": [</li>
				        <li>"vista_gleeda",</li>
				        <li>"vista_libyal",</li>
				        <li>"2008_libyal"</li>
				    <li>],</li>
				    <li>"device_used": "\\DEVICE\\LANMANREDIRECTOR\\X\\",</li>
				    <li>"filepath": "\\DEVICE\\LANMANREDIRECTOR\\X\\USERS\\USER\\APPDATA\\LOCAL\\TEMP\\SVCHOST.EXE"</li>
				<li>}</li>
				...
				</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

In the above output, the `--brute_force` switch allows us to iterate known _device paths_ and concatenate them to our known _file directory_\\_filename_. As you can see, we got the same result as our previous attempt "41CE8261".

Since this route produces a lot of _path hash_ values, one possible option afterwards would be to scan whatever evidence/artifacts are available to you for any of the newly generated _prefetch files_ and if you have a hit then you'll know the _original path_.


### Scenario Dos

A keyword search conducted on a physical image of the system yielded hits for various "svchost.exe" related _prefetch files_. 

**Q. What do we know?**

We know that there were multiple hits for "svchost.exe" _prefetch files_ but only have their _filenames_ (e.g. - _SVCHOST.EXE-41CE8261.pf_)

> Since this is a commonly used application with both malicious and legitimate use cases, knowing the said Prefetch file once resided on the system isn't overly useful by itself. (e.g. - did it executed from %windir%\System32 or somewhere else?)

**Q. Solution**

In this situation, we can:

1. Build a list of known _device paths_ (shares, virtual machines etc.)
1. Build a list of directories on the system being investigated, from a golden image system etc. (refer [here](#enumerating-directories) for guidance)

In short, we need some _device paths_ and some _file directories_ so we can build possible _kernel paths_ with out _filename_.

# Thinking Outside the Box

## Enumerating Directories

Keeping a list of _device paths_, directories and _original paths_ -or- knowing how to quickly generate them can be a handy thing to have in a pinch situation.

While some _original paths_ are more constant, you should ensure your list contains any third party or system/environment specific directories/_original paths_ not traditionally known (e.g. - special applications installed or mapped shares means additional directories/_original paths_ need to be acounted for)

### Disk

One universal option we can use in this situation is leveraging TSK's `fls` to recusivlely list the full paths to each directory of a given file system.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				<li>fls -o 2048 -Drp /mnt/vmdk1 | awk -F'\t' '{print $2}' | sed 's/\//\\/g</li>
				<ul>
				<li>$Extend</li>
				<li>$Extend\$RmMetadata</li>
				<li>$Recycle.Bin</li>
				<li>$Recycle.Bin\S-1-5-21-3670647999-409174923-3062832813-1000</li>
				<li>Boot</li>
				<li>Boot\cs-CZ</li>
				...
				<li>Config.Msi</li>
				<li>Documents and Settings</li>
				<li>PerfLogs</li>
				<li>PerfLogs\Admin</li>
				<li>Program Files</li>
				<li>Program Files\7-Zip</li>
				...
				<li>\Users\foo\Application Data</li>
				...
				</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}


### Standalone Artifact

For this post, I'm just going to leverage the $MFT but there are certainly a number of other artifacts one could enumerate directories/_original paths_ from as well.

We can use the default settings of [`list_mft.py`](#tooling-around) and create a bodyfile which will contain the data we're looking for.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				<li>python INDXParse/list_mft.py \$MFT</li>
				<ul>
				<li>0|\\\$MFT|0|0|256|0|196870144|1318062771|1318062771|1318062771|1318062771</li>
				<li>0|\\\$MFT (filename)|0|0|256|0|196870144|1318062771|1318062771|1318062771|1318062771</li>
				</ul>
				<li>python INDXParse/list_mft.py \$MFT | sort -u | wc -l</li>
				421049
				<li>python INDXParse/list_mft.py \$MFT | awk -F '|' '{print $2}' | grep -v "(filename)" | sort -u | wc -l</li>
				231010
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

...but, as indicated above, this will also include stuff we're not interested in.

Have no fear, we still don't need to rewrite anything because we can leverage [_jinja2_](http://jinja.pocoo.org) templating. You can see an example of how to provide a format, and in this instance, what variable to use [here](https://github.com/williballenthin/INDXParse/blob/master/list_mft.py#L210).

One option is to leverage _jinja2_ templating and only print the filepaths from the $MFT.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				{% raw %}
				<li>python INDXParse/list_mft.py  --format "{{ record.path }}" \$MFT</li>
				{% endraw %}
				<ul>
				<li>\$MFT</li>
				<li>\$MFTMirr</li>
				<li>\$LogFile</li>
				...
				<li>\$Extend</li>
				<li>\$Extend\$Quota</li>
				...
				<li>\dell</li>
				...
				</ul>
			</div>
		</div>
	</div>
</div>		
{% assign counter=counter | plus:1 %}

...but that still means we have to sline-n-dice the output later since we just need unique directories. Did you know you could rock some more complex statements?

By looking into the code a bit more, we can provide an if test in the format so we only get directories (saves us slicing and dicing later); _this will add some more processing time initially_.
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				{% raw %}
				<li>python INDXParse/list_mft.py --format "{% if record.is_directory == 2 %} {{ record.path }} {% endif %}" \$MFT</li>
				{% endraw %}
				<ul>
				<li>\$Extend</li>
				<li>\$Extend\$RmMetadata</li>
				<li>\$Extend\$RmMetadata\$TxfLog</li>
				<li>\$Extend\$RmMetadata\$Txf</li>
				<li>\dell</li>
				<li>\Users\user\AppData\LocalLow\Microsoft</li>
				<li>\Users\user\AppData\LocalLow\Microsoft\CryptnetUrlCache</li>
				...
				</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

sa-weet. In my testing this took a bit longer to parse the $MFT and provide those filtered results, but it's geek-tastic.

### Memory

Contained within the [community plugins repository](https://github.com/volatilityfoundation/community/blob/master/DaveLasalle/prefetch.py) is a copy of the [`prefetch`](https://github.com/superponible/volatility-plugins/blob/master/prefetch.py) plugin for volatility. This plugin leverages volatility's built in [scanning](https://github.com/volatilityfoundation/volatility/blob/master/volatility/scan.py#L45) to look for the prefetch signature **SCCA** across [pages](https://github.com/volatilityfoundation/volatility/blob/c84e42a82525b57cd8ed7c940f03f1dca065d097/volatility/plugins/kdbgscan.py#L31) of memory.

When a potential prefetch file is found, based on the profile assigned to the memory dump (currently supports [XP -> 7](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#411-format-version)), the plugin attempts to validate it's truly a prefetch file by looking at some of the [`PF_HEADER`](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc#41-file-header) information. Based on the [Windows Prefetch File format](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20%28PF%29%20format.asciidoc), parsing this initial information, which this plugin does, is simple. Unfortunately, however, this plugin doesn't provide the full path of the file.

This may be due to:

1. a limitation of the data resident in memory
2. a result of it being much easier just to present this initial information
	(_jumping around offsets and parsing the various sections data to get all the details is a PITA_). 

Regardless, we can overcome both by leveraging volatility's [`filescan`](https://github.com/volatilityfoundation/volatility/wiki/Command%20Reference#filescan).

While having the basic prefetch details are useful, having the _original path_ is also important (if this is news to you, re-read everything). I didn't see my [issue](https://github.com/superponible/volatility-plugins/issues/3) getting any love so I created a [PR](https://github.com/superponible/volatility-plugins/pull/4) instead. 
<a class="collapse-toggle tooltip" data-collapse="#show-details{{ counter }}" href="#" style="text-decoration:none;">
    <span class="collapse-text-show" data-title="Click to expand">
		(show details)
	</span>
    <span class="collapse-text-hide">
		Hide
	</span>
</a>
<div class="container">
	<div class="collapse" id="show-details{{ counter }}">
		<div class="terminal-wrap">
			<p class="terminal-top-bar">~/Desktop/</p>
			<div class="terminal-body">
				<li>vol.py -f ENG-USTXHOU-148/memdump.bin prefetchparser --full_paths --output=json --output-file=prefetch.json</li>
				<ul>
				<li>Volatility Foundation Volatility Framework 2.5</li>
				<li>Outputting to: prefetch.json</li>
				</ul>
				<li>cat prefetch.json | jq .</li>
				<ul>
					<li>{</li>
					  <li>"columns": [</li>
					    <li>"Prefetch File",</li>
					    <li>"Execution Time",</li>
					    <li>"Times",</li>
					    <li>"Size",</li>
					    <li>"File Path"</li>
					  <li>],</li>
					  <li>"rows": [</li>
					    <li>[</li>
					      <li>"IPCONFIG.EXE-2395F30B.pf",</li>
					      <li>"2012-11-26 23:07:31 UTC+0000",</li>
					      <li>"2",</li>
					      <li>"26602",</li>
					      <li>"\\DEVICE\\HARDDISKVOLUME1\\WINDOWS\\SYSTEM32\\IPCONFIG.EXE"</li>
					    <li>],</li>
					    ...
		    	</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

While there wasn't a large addition to processing time with the modified [`prefetch`](#tooling-around) plugin, remember that the possibility exists that we won't be able to determine the _original path_ that maps to a _prefetch file_.  This could be due to a few things but most obvious is that it wasn't contained within one of the file paths enumerated (resident) via `FileScan`.

Happy forensicating.

# Additional Reading

- http://www.swiftforensics.com/2010/04/the-windows-prefetchfile.html
- https://www.magnetforensics.com/computer-forensics/forensic-analysis-of-prefetch-files-in-windows/
- http://blog.airbuscybersecurity.com/post/2014/02/Prefetch-file-parser-in-pure-Python
- https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20(PF)%20format.asciidoc
- http://www.crowdstrike.com/blog/crowdresponse-application-execution-modules-released/
- http://www.hexacorn.com/blog/2012/06/13/prefetch-hash-calculator-a-hash-lookup-table-xpvistaw7w2k3w2k8/
- http://www.hexacorn.com/blog/2012/10/29/prefetch-file-names-and-unc-paths/
- http://www.invoke-ir.com/2013/09/whats-new-in-prefetch-for-windows-8.html
- http://www.forensicswiki.org/wiki/Prefetch
