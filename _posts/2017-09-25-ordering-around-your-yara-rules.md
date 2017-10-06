---
layout: post
title: Ordering Around Your YARA Rules
date: '2017-09-25T17:00:00.000-05:00'
author: hiddenillusion
tags: [yara, malware]
---

{% assign counter=0 %}

# Overview

if you look at the [keywords](https://yara.readthedocs.io/en/v3.6.0/writingrules.html#id2), there's nothing obvious (e.g. - before, after etc.) for trying to state which of your string entries needs to match first.

This is a question that I've heard asked many times, but never heard a resolution for. Thankfully, there are people far smarter out there, like [Andreas](https://twitter.com/forensikblog/status/872519969526951936):

# show screenshot of Andreas tweet

In order to leverage the regex option, there'd probably be too much unknown and too loose of a rule - I don't want to have a bunch of wildcards in my rule. I have leveraged the second option to match certain strings at specific offsets, but it hadn't occurred to me that it could also be easily used for stating the order the strings must appear.

# Testing

...

The contents of the test file, which contains some of the strings I want to match:

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
			<p class="terminal-top-bar">~/</p>
			<div class="terminal-body">
				<li class="terminal-body-cli">cat /tmp/file</li>
				<ul>
				<li>malicious_mutex</li>
				<li>hxxp://evil.localhost</li>
				<li>/tmp/bad.gcc</li>
				<li>c:\work\evil\abcd.pdb</li>
				</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

## Example Rules Tested

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
	<script src="https://gist.github.com/hiddenillusion/6f319bae0e28e76ef1669e2c56af89d3.js"></script>
	</div>
</div>
{% assign counter=counter | plus:1 %}

## Result

(testing was done with [YARA](https://github.com/virustotal/yara) v3.5.0)

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
			<p class="terminal-top-bar">~/</p>
			<div class="terminal-body">
				<li class="terminal-body-cli">yara -grs order_rule.yara /tmp</li>
				<ul>
				<li class="terminal-body-separator">mutex_before_file [] /tmp/file</li>
				<li>0x2b:$sA: bad.gcc</li>
				<li>0xa:$sZ: mutex</li>
				<li></li>
				<li class="terminal-body-separator">pdb_after_c2 [] /tmp/file</li>
				<li>0x17:$sA: evil.localhost</li>
				<li>0x33:$sZ: c:\work\evil\abcd.pdb</li>
				</ul>
			</div>
		</div>
	</div>
</div>
{% assign counter=counter | plus:1 %}

As seen above, the strings matched will show up in the order which they appear in the file, but they're matched based on the order of the rule.
