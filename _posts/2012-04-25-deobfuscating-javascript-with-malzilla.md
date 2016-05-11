---
layout: post
title: Deobfuscating JavaScript with Malzilla
date: '2012-04-25T20:58:00.000-04:00'
author: hiddenillusion
image_folder: '2012-04-25'
tags: [dfir, Malzilla, malware, JavaScript]
modified_time: '2012-04-25T21:54:36.549-04:00'
thumbnail: http://2.bp.blogspot.com/-vMu7VPCQ20g/T5iRdvH5ZHI/AAAAAAAAACw/JBS_1uEh7zQ/s72-c/decoder.jpg
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-5847374836475198466
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/04/deobfuscating-javascript-with-malzilla.html
---

I was asked a question a little while ago from a fellow forensicator about deobfuscating some JS that he came across.  The JS didn't take long to reverse but I suspect there are others out there that would benefit from a quick post regarding another way to go about this task.  While there's **jsunpack**, **js-beautify** etc. I chose to run it through **Malzilla** for this example.

The structure of the JS was noticeably familiar and turns out to be related to an exploit pack; which is a common source of where a lot of the JS you might come across in the DFIR field results from these days.  These types of kits make it point-and-click easy to not only distribute malware but also make it uber-easy to obfuscate the code on their pages.

# Gettin' scripty with it

1. The first thing to do is copy out what’s in between the `<script>` tags and place it in the top box of the `Decoder` Tab within **Malzilla** - we don't need the other `<html>` tags etc., we only need the goods.
2. Next step is to get rid of what we don’t necessarily need at this point (shown commented out with ‘//’).  This will vary depending on what you're analyzing and may take a bit more knowledge to realize but just remember what your goals are - there will be junk thrown into the mix and since all I care about at this point is to see what gets produced (URL etc.) the top part didn't look relevant for helping me get my question answered :

![Decoder]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/decoder.jpg)

At this point you have a few options:

1. replace the `eval()`
2. run it through debugging to verify it's working
3. run the script.

Everything looks good enough to work so let's just go ahead and choose to run the script:

![Script Executed]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/run_script.jpg)

# Results

*Note* that even though the bottom text displays _“Script can’t be compiled”_ (seen above) … the eval results were still produced.  To see the results:

- click on `Show eval() results`
- double click on each of the results (one in this instance) and the results will be displayed in the lower pane – this time showing the produced iframe:

![Results]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/results.jpg)

There's generally always more than one way to get the results you require so hopefully this will help some of you next time.