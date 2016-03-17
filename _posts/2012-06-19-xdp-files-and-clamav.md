---
layout: post
title: XDP files and ClamAV
date: '2012-06-19T15:36:00.000-04:00'
author: hiddenillusion
tags: [dfir, malware, PDF, classification, ClamAV, TrIDScan, TrID, XDP, YARA]
modified_time: '2012-08-20T19:50:03.866-04:00'
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-2802269545929440091
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/06/xdp-files-and-clamav.html
---

* toc-content
{:toc}

**updated 2012-08-20** - added two new signatures

# Background

There were some [recent discussions](http://blog.9bplus.com/av-bypass-for-malicious-pdfs-using-xdp) going on regarding the use, or possible use of bypassing security products or even the end user by having a XML Data Package (XDP) file with a PDF file.  If you aren't familiar with XDP files, don't feel bad... neither was I.

According to the [information](http://partners.adobe.com/public/developer/en/xml/xdp_2.0.pdf)<i class="fa fa-file-pdf-o fa-fw"></i> Adobe provides, **this is essentially a wrapper for PDF files so they can be treated as XML files**.  If you want to know more about this file then take a look at the link above as I'm not going to go heavily into detail but note that the documentation is a bit on the light side as it is.  There're other things that can be included in the XDP file but for this post we're looking at the ability to have a PDF within it.

Adobe states that:

> <i class="fa fa-quote-left fa-fw"></i>The PDF packet encloses the remainder of the PDF document that resulted from extracting any subassemblies into the XDP.  XML is a text format, and is not designed to host binary content. PDF files are binary and therefore must be encoded into a text format before they can be enclosed within an XML format such as XDP. The most common method for encoding binary resources into a text format, and the method used by the PDF packet, is base64 encoding [RFC2045].<i class="fa fa-quote-right fa-fw"></i>

Based on my limited testing, when you open a XDP file, Adobe Reader recognizes it and is the default handler.  When the file is opened, Adobe Reader decodes the base64 stream (the PDF within it), saves it to the %temp% directory and then opens it.

[Brandon](http://twitter.com/9bplus)'s post included a SNORT signature for this type of file but I wanted to get some identification/classification for more of a host based analysis.  Since I couldn't get a hold of a big data set I grabbed a few samples (Google dork = `ext:xdp`) and thought I'd first try [`TrID`](http://mark0.net/soft-trid-e.html) - but that generally just classified them as XML files (with a few exceptions) and the same thing with `file`.  I can't blame them, I mean they are XML files but I wanted to show them as XDP files with PDF's if that was the case - that way I could do post-processing and extract the Base64 encoded PDF from within the XDP file and then process it as a standard PDF file in an automated fashion.  

I then looked to `TrIDScan` but unfortunately that didn't work as hoped.  I tried creating my own XML signature for it as well but kept receiving seg. faults .. so... no bueno. My next thought was to put it into a YARA rule but I thought I'd try something else that was on my mind.  I've been told in the past to mess around with ClamAV's sectional MD5 hashing but that's generally done by extracting the PE files sections then hashing those.  Since this is XML that wasn't going to work.  I remembered some [slides](http://www.clamav.net/doc/webinars/Webinar-Alain-2009-03-04.ppt)<i class="fa fa-file-powerpoint-o fa-fw"></i> I looked at a bit ago regarding writing ClamAv signatures so when I revisited them the lightbulb about the ability to create [Logical Signatures](http://vrt-blog.snort.org/2008/09/logical-signatures-in-clamav-094.html) came back to me.

# ClamAV's Logical Signatures

Logical Signatures in ClamAV are very similar to the thought/flow of YARA signatures in that they allow you to create detection based on..well.. logic.  The following is the structure, 

> the **Subsig*** are HEX values... so you can either use an online/local resource to convert your ASCII to HEX

...or you can leverage ClamAV's `sigtool` (remember to delete trailing 0a though):

`sigtool --hex-dump`

Looking back to Adobe's information they also mention that the PDF packet has the following format: 

```xml
<pdf xmlns="http://ns.adobe.com/xdp/pdf/"> 
     <document>
          <chunk>
               ...base64 encoded PDF content... 
          </chunk> 
     </document> 
</pdf>
```

## Logical Signature Structure

```
SignatureName;TargetDescriptionBlock;LogicalExpression;Subsig0;Subsig1;Subsig2;...
```

# Signatures

## ClamAV

The beauty is that you can create your own custom Logical Database (.ldb) and pop it into your default ClamAV directory (e.g. /var/lib/clamav) with the other databases and it'll automatically be included in your scan. While just detecting this may not indicate it's malicious, at least it's a way to detect the presence of the file for further analysis/post-processing.  So based on everything I now know I can create the following ClamAV signature:

```
XDP_embedded_PDF;Target:0;(0&1&2);3c70646620786d6c6e733d;3c6368756e6b3e4a564245526930;3c2f7064663e
```

The above signature can be explained as such:

XDP_embedded_PDF | Signature Name 
Target:0 | Any file 
(0&1&2) | Match all of the following
0 | (_ASCII_) <pdf xmlns= , (_HEX_) 3c70646620786d6c6e733d
1 | (_ASCII_) <chunk>JVBERi0 , (_HEX_) 3c6368756e6b3e4a564245526930
2 | (_ASCII_) </pdf> , (_HEX_) 3c2f7064663e

> **Note:** _JVBERi0_ is the Base64 encoded ASCII text " %PDF- ", which signifies the PDF header.  It was converted into HEX and added to the end of the 'chunk' to help catch the PDF

### Update 2012-08-20

The initial ClamAV signature listed above first created ClamAV signatures works but I started to think that the **<chunk>JVBERi0** may not be next to each other in all cases... not sure if they have to nor not by specification but this is Adobe so I'd rather separate them and match on both anyway..

```
XDP_embedded_PDF_v2;Target:0;(0&1&2&3);3c70646620786d6c6e733d;3c6368756e6b3e;4a564245526930;3c2f7064663e 
```

## YARA

```
rule XDP_embedded_PDF
{
 meta:
  author = "Glenn Edwards (@hiddenillusion)"
  version = "0.1"
  ref = "http://blog.9bplus.com/av-bypass-for-malicious-pdfs-using-xdp"

 strings:
  $s1 = "<pdf xmlns="
  $s2 = "<chunk>"
  $s3 = "</pdf>"
  $header0 = "%PDF"
  $header1 = "JVBERi0"

 condition:
  all of ($s*) and 1 of ($header*)
}
```

# Questions to Answer

Actors are always trying to find new ways to exploit/take advantage of users/applications so it's good that this was brought to attention as we can now be aware and look for it.  While the above signature will trigger on an XDP file with a PDF (from what I had to test on), there're still questions to be answered and without having more samples or information they stand unanswered at this point:

1. Could these values within the XDP file be encoded and still recognized like other PDF [specs](http://blog.didierstevens.com/2008/04/29/pdf-let-me-count-the-ways/)?
2. Can it be encoded with something other than base64 and still work?
3. Will any other PDF readers like FoxIT treat them/work the same as Adobe Reader?

Comments and questions are always welcome... never know if someone else has a better way or something I said doesn't work.