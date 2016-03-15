---
layout: post
title: Bruteforcing XOR with YARA
date: '2014-03-12T14:56:00.001-04:00'
author: hiddenillusion
image_folder: '2014-03-12'
tags: [YARA, MACB, XtremeRAT, XOR]
modified_time: '2014-03-14T11:45:55.763-04:00'
thumbnail: http://3.bp.blogspot.com/-OHxpdqhKKaA/UyCP6glsSZI/AAAAAAAAAa8/5P2HXNUUPxw/s72-c/perms.png
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-541941005057925460
blogger_orig_url: http://hiddenillusion.blogspot.com/2014/03/bruteforcing-xor-with-yara.html
---

* toc-content
{:toc}

# Background

In a previous [post](http://hiddenillusion.blogspot.com/2013/01/nomorexor.html) I looked at coming up with a process for determining XOR keys that were 256 bytes.  I've received and have read some great feedback/posts regarding the tool and even though I wrote it in such a way to try and still possibly see patterns/repetitive bytes for smaller XOR keys, that wasn't its purpose.  There are plenty of other tools out there to try and assist oneself when dealing with XOR'ed files, however, recently a [co-worker](https://twitter.com/Tekdefense) and I were left unsuccessful after exhausting those resources.

I'm often asked to look at some artifact that's believed to be encoded in some fashion or hear that even if something is XOR'ed that they wouldn't know how to go about decrypting/decoding it.  I'm by no means an expert and sometimes find myself just as lost as you might feel but I thrive on learning and challenges, hence why I decided to work in the dfir space.

I believe this type of scenario is just like most others - the more time you spend doing it, the easier it becomes.  Additionally, pattern recognition is key when it comes to XOR (pun intended).  Determining the XOR key and any other skips etc. that might be used can be quite trivial, but let's look at a few ways that make this type of scenario harder:

- You don't have access to the source code of the file responsible for performing the XOR 
- You don't have access to the binary  responsible for performing the XOR 
- You don't have the knowledge/skills/resources
- The key you think should work isn't working

So you just have a file that you believe is encoded but you're not sure how (e.g. - you try to open it and you don't see any plain text). One of the easiest ways to determine if it's XOR'ed is if while scrolling through it you start to see patterns emerging.  This could be horizontal, vertically or maybe just repetitive characters constantly appearing - all depends on the key length and any other skips that might be in play.

> When I say skips I'm referring to the XOR routine skipping null bytes, line feeds, carriage returns, not XOR'ing itself (e.g. - if the key is A5 then maybe if it sees A5 it skips it instead of XOR'ing itself) or some other trick.

Again, these are easier to determine if you have either of the first two bullet points listed above...but unfortunately that's not always the case.

In a recent [blog post](http://www.fireeye.com/blog/technical/2014/02/xtremerat-nuisance-or-threat.html) there was mention of the malware named XtremeRAT and additionally a few [tools](https://github.com/fireeye/tools/blob/master/malware/Xtreme%20RAT) to help in scenarios where you're investigating incidents involving it.  One of the scripts listed there is for decrypting a keylog file created from XtremeRAT with a two byte XOR key of '3fa5'.  While it's helpful to know that two byte XOR key is used,

- what if it doesn't work on your file (bullet point number 4 mentioned above)?
- or what if there's a new variant using a different XOR key that you now need to try and figure out?

# Thought Process

To try and solve these questions I decided to leverage a combination of [YARA](http://plusvic.github.io/yara/), the script [xortools](http://code.google.com/p/malwarecookbook/source/browse/trunk/12/1/xortools.py) from Malware Analysts Cookbook (the book that keeps on giving) and use case examples from some others within the YaraExchange.  Xortools has some useful functions for creating different XOR's, permutations and then spitting them out into YARA rules... sweet, right?

The functions within **xortools** didn't quite have a solution for what I was trying to do but some quick modifications to a couple of them was easy enough to implement.  Let's break down the thought process:

1. I wanted to generate a list of all possible combinations of two byte XOR keys (e.g. - 1010, 1011, 1012 etc.).
2. Using those combinations I then wanted to XOR a string of my choosing
3. With the resulting XOR'ed string I wanted to create a YARA rule for their hex bytes.  
4. I also wanted to keep track of the two byte XOR key being used for each rule and add them to the rules name so if/when a rule triggers, the XOR key is easily identifiable - this wasn't currently included in xortools so see my modified functions
5. Wash, Rise, Repeat.... this would entail creating different strings that you wanted XOR'ed.  I have a list that I usually feed to xorsearch such as **http**, **explorer**, **kernel32** but in this particular instance I needed a list of strings that were likely to appear in a keylog file, such as:

- Backspace
- Delete
- CLIPBOARD
- Arrow Left
- Arrow Right
- Caps Lock
- Left Ctrl
- Right Ctrl

> For some additional hints on what you might see within a keylog file, check out Ian's [YARA rule](http://www.tekdefense.com/news/2013/12/23/analyzing-darkcomet-in-memory.html) for DarkComet_Keylogs_Memory.

Good thought process thus far, but what if those strings aren't contained within the keylog file?  You wouldn't necessarily know unless you've previously dealt with this malware or have come across an example online...so another approach to think about is what is likely to be recorded on the system?  Here are some examples I've found helpful:

- Company name (most likely keylogged email and/or Internet browsing)
- The persons name/user name
- Microsoft

This should help make things more flexible and tackling the unknown aspect.

# Steps

First things first... create a function to generate every combo of two byte XOR keys:

```python
def get_xor_permutations(buf):
	out = []
	for key in range(1, 255):
		out.append(two_byte_xor(buf, key))
	return out

def get_xor_permutations_multi(buf):
	""" Generates multibyte XOR keys in order """
	out = {}
	for k1 in range(1, 255):
		for k2 in range(1, 255):
			key = (hex(k1)+hex(k2)).replace ("0x","")
			out[key] = xor_multi(buf, k1, k2)
	return out
```

The top is the original and the bottom is an example of how to generate the pair by adding another loop and at the end saving the two byte key for use in the rule name.  Note: Doing it this way may produce hex characters that are only a nibble and YARA will not like that if you're trying to match on hex characters so to circumvent it, I decided to add a wild card `?` as the other nibble.

Next, we need to feed those two bytes to an XOR function and XOR the string we passed it.  Finally, leverage the `yaratize` function to create the YARA rule.  I got things working and when I went to scan the XOR'ed keylog files I received _Error 25_ from YARA (sad face).  After some troubleshooting I was told this issue was being caused by having too many strings in a single rule. Essentially, _Error 25 'ERROR_EXEC_STACK_OVERFLOW' meant I was hitting a hard limit on the stack size_. No bueno... My options were to tweak line 24 in [libyara/exec.c](https://github.com/plusvic/yara/blob/master/libyara/exec.c#L24) or create better YARA rules.  By creating so many strings and using the pre-existing `yaratize` function within **xortools** my rule looked followed this structure:

![Error 25 Rule Example]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/error_25_rule_example.png)

You'll notice it's the standard rule format most of you are probably familiar with seeing: rule name followed by the strings to match and at the bottom (not shown) would be the condition.  After some testing I determined that ~16k strings to match on seemed to be the limit that YARA would accept in a single rule (that's based on my systems config. + length of string to match etc.).

Back to my options - I could tweak that setting in YARA which I didn't want to, have a counter and only add X amount of strings to match per rule or the third option of creating one rule per string.  The third might not be familiar to some of you but that's what I opted to go with.  It creates a larger file because of all the extra characters you're adding but with the new version of YARA, performance shouldn't really be too much of a factor.  An example of this type of format is:

![Single Line YARA Rule]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/single_line_yara_rule.png)

Now that this hurdle was bypassed, I was able to use the YARA rules generated.  On a test file that I XOR'ed with the key '3fa5' the YARA rules worked ...however, they still weren't working on the keylog files from XtremeRAT - Err!  

![XOR Working]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/test_xor_work_output.png)

**Note**: the (`-s`) switch to YARA tells it to print out what matched, which is important here because our string name has the XOR key in it and the (`-f`) switch tells it to use fast matching mode, which only prints out the first match in the file instead of every time it's matched.

Alright, so let's pop open the XOR'ed test file I created and check out its hex and compare it to what I was seeing in the XtremeRAT files:

Here's what the test file looks like XOR'ed and in plain text, respectively:

![RAT added bytes]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/tests_did_not_work_because_of_extra_bytes_RAT_keylogger_added.png)

And here is an image of the first 10 lines of two keylog files from XtremeRAT.  If you scroll through this example you'll notice the first file has a second byte consistently of **00** while the second file has a second byte consistently **a5**:

![Pattern]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/pattern_both.png)

If you've read anything on XOR'ing before you may be aware that XOR keys can present themselves based on what they're XOR'ing (hence why sometimes they have skips/checks implemented).  Focusing on the bottom file, I'd say **a5** is part of the XOR key - if not the key itself (depends on the length you're dealing with). Circling back to the XtremeRAT blog post we know a common key is **3fa5** so it appears we're being presented with half the key when we browse through the XOR'ed keylog file.

Now if you recall back to previous YARA rules being created, I was producing a straight two byte XOR without any skips... if you look at the above files you'll realize, or maybe after some troubleshooting, that this conversion won't work in this instance as the keylog file doesn't have each byte sequentially (e.g - _If the word within the keylog file we're looking for is **Microsoft**, the keylog file doesn't show it as that word XOR'ed in order, but rather with **a5** in between each XOR'ed character._) Hm, what's happening?  According to the blog post,

> "XtremeRAT's key scheduling algorithm (KSA) implementation contains a bug wherein it only considers the length of the key string, not including the null bytes between each character, as found in these Unicode strings".

Now without having the binary or source code to make that determination (which I didn't), it should still become evident if you try and do a comparison:

![Horrizontal Example]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/example_horizontal.png)

On the left hand side of the above image is another look at the previously shown test file I created with some common keywords typically found in a keylogger file and on the right hand side is a sanitized copy of one created by XtremeRAT.  In each of the panes, the word **Microsoft** is highlighted in the format of the particular file it's part of.  For a visual guide of what's going on and what should be expected I put together a quick image:

![Microsoft Matrix]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/Microsoft_matrix.png)

The top section shows the string **Microsoft** in its native form, converted to other formats followed by what its representation would be if that particular character was XOR'ed by each half of the two byte XOR key **3fa5** by themselves.  The bottom section again shows the same string but separated by **a5** as shown when viewing the keylog file XOR'ed followed by what would be required in a YARA rule to match on this particular string as it's seen within the XOR'ed file (hope this makes sense).

When stuck or first starting off with something like this you can reference [online tables](http://www.asciitable.com/) or use [online systems](http://www.miniwebtool.com/bitwise-calculator/) to see binary/decimal/hex conversions but it might be worth while figuring out how to do it programmatically in something you feel comfortable with - python, perl, bash, M$ Excel etc. to try and see what's going on.

Below is another copy of the same exact table shown above, but this time with two columns highlighted.  The top column helps show each character within the string **Microsoft** as its value in hex once it's XOR'ed with the single byte key of **3f**.  The bottom column contains the same information, but has the second half of the XOR key **a5** inserted in between each of the strings characters.

![Microsoft Matrix Highlighted]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/Microsoft_matrix_highlighted.png)

In other words? - Because XtremeRAT uses a two byte XOR key and has null bytes in between each character, the second part of the two byte XOR key **a5** is always displayed.  Essentially, it becomes a one byte XOR key as each character is always XOR'ed with the first half of the XOR key **3f**.

So how do we compensate for this?  After generating the permutations for every two byte XOR key we just read each character one at a time from the string we supply it then XOR each of them with the first half of the two byte key and add the second half of the two byte key right after it as itself (represented in the bottom blue column above).

Once we do that, bingo! :

![New YARA Rule Working]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/new_yara_rule_worked_on_xrat.png)

We first see what the new YARA rule for **3fa5** looks like (which as the second byte as itself **a5**) and first see that it doesn't match on a file that's XOR'ed normally with the two byte key **3fa5** and lastly that it now matches on a keylog file XOR'ed from XtremeRAT with the added null byte routine.

# Code It

So how easy is it to code?  Pretty easy since the majority of it existed, just some slight modifications and you're good to go.  You just need to modify the permutations function to generate combos of two byte XOR keys:

```python
def get_xor_permutations_xrat(buf):
	"""
	Similar to get_xor_permutations_multi()
	but calls a different function at the end
	"""
	out = {}
	# can skip 0x1-0xf if you only
	#	want to focus on 2 chars (16, 255)
	for k1 in range(16, 255):
		for k2 in range(16, 255):
			key = (kex(k1)+hex(k2)).replace("0x","")
			out[key] = xor_rat(buf, k1, k2)
	return out
```

and push them over to the xor routine of need:

```python
def xor_xrat(buf, k1, k2):
	key1 = hex(k1).replace("0x","")
	key2 = hex(k2).replace("0x","")
	key = (hex(k1) + hex(k2).replace("0x",""))
	out = ''

	for i in range(0, len(buf)):
		c = buf[i:i+1]
		newbie = ''
		try:
			# reverse this if needed
			# you can usually tell by commonly
			#	repeated chrs in hex view of
			#	XOR'ed files
			newbie = orc(c) ^ k1
			hx = hex(newbie).replace("0x","")
			# YARA throws errors on nibbles so
			#	currently _blindly_ adding wildcards
			#	so you can add a skip if len != 2 bytes
			if len(hx) != 2:
				hx = "?" + hx
			out += "{0} {1}".format(hx, key2)
		except ValueError:
			pass
	return out
```

and finally to a function to create the YARA rules:

```python
def yaratize_xrat(ofile, rule, vals):
	# Since we don't want to crash YARA by creating
	#	one large rule file (Error 25, Overflow),
	#	we'll split them into separate rule files
	r_cnt = 0

	for k, r in sorted(vals.items()):
		with open(ofile, 'a') as rules:
			r_name = "rule {0}_{1}".format(rule, r_cnt)
			rules.write('\n' + r_name)
			rules.write(" {")
			rules.write(" strings:")
			pairs = [r[i:i+2] for i in range(0, len(r), 2)]
			s = " $xor_{0} = {".format(k)

			for pair in pairs:
				s += "{:2.2}".format(pair)
			s += "}"

			rules.write(s)
			rules.write(" condition:")
			rules.write(" any of them")
			rules.write("}")

			r_cnt += 1  
```

Other than that, just import the required functions and supply them with the required data; so for the modified functions I created, I could just say:

```python
from xortools import get_xor_permutations_xrat as get_perms_xrat
from xortools import yaratize_xrat as yara_xrat

string = "Microsoft"
rname = "two_byte_xor_XtremeRAT_keylog_{0}".format(string)
fname = "{0}.yara".format(rname)
yara_xrat(fname, rname, get_perms_xrat(string))
```

and voila, game over.  This should hopefully have helped explain a little more on what XOR is, how to go about detecting it and another resource you can use in the future for trying to brute force what a possible XOR key is based on some common strings that might be present.  Since **xortools** is hosted on Google code I opted to put up a modified version on my [github](https://github.com/hiddenillusion/yara-goodies) instead of just a patch. I'm not the original author of all the code, just a guy modifying as needed.