---
layout: post
title: Rewriting/Anonymizing Artifacts
date: '2014-04-18T10:46:00.003-04:00'
author: hiddenillusion
image_folder: '2014-04-18'
tags: [pcap, forensics, dfir, memory forensics, python, scapy, volatility]
modified_time: '2014-04-18T10:50:40.731-04:00'
thumbnail: http://1.bp.blogspot.com/-_2DLJprm8Ow/U1CWWjZzGyI/AAAAAAAAAcY/zTv4D9LlyM8/s72-c/connections_before.png
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-2075641346506834257
blogger_orig_url: http://hiddenillusion.blogspot.com/2014/04/rewritinganonymizing-artifacts.html
---

* toc-content
{:toc}

# Situation

Have you ever had the need to anonymize or rewrite some data in an artifact for a blog post, paper, presentation, interview etc.? What were the artifacts, what were the requirements and how did you go about tackling the situation at hand? I’ve had to do this a few times in the past but my most recent use case had both a new artifact (memory dump) as well as additional requirements for the other artifact (PCAP) that I hadn’t previously encountered.

## Memory

I already had a memory dump but some of the information within the memory dump needed to be altered in order to paint a different picture. For the purpose of this post, I’ve recreated a similar scenario but chose to use different data in hopes of better explaining and visualizing things. For this situation I ran fakenet on the same system that I infected with malware and then took a packet capture and memory dump - the goal here is to change the IP addresses within both artifacts.

### Primer

For the task of altering the data within the memory dump I’ll be leveraging the [volshell](https://code.google.com/p/volatility/wiki/CommandReference23#volshell) plugin within Volatility. If you’re unfamiliar with it then I suggest poking around with it - volshell gives you the ability to interactively explore a memory image and additionally provides the ability to rewrite data within the memory image. Once you’ve dropped into volshell you can issue the `hh()` function to get some help on what to do but besides for just utilizing some of the built-in functions you also have the ability to do some scripting on the fly - both of which are really handy and utilized in the sections to come.

Since the goal is to rewrite some IP addresses within the memory dump, some important things that we need to be aware of are:
- The initial context within volshell is the System process (kernel space). Therefore, not supplying an address space or changing into a process’ context means you’re using the default kernel address space. More on this later.
- The process function `ps` uses the process listing (e.g. – active processes)
- The change context function `cc()` _expects a virtual address_,connscan uses Physical (P) offsets by default connections uses Virtual (v) offset by default (the Physical can be obtained with the `-P` switch)

### Steps

Before making any modifications, let’s run the `connections` plugin and see what data resides within the memory dump:

![Connections before]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/connections_before.png)

Highlighted in the image above are notes that the offset displayed is virtual and the others outlining that both the local/remote IP addresses are currently set to local host. The latter is what we want to change so we can show the host was communicating with external systems rather than just itself. As touched upon already, another important thing to be aware of is which address space you’re currently in and which you need to be in in order to accomplish what you’re trying to do. To do this we can first check the current address space with `self.addrspace` and increase our layering by adding `.base` to that space. Visualize this as being different layers that you either move up or move down by adding or subtracting `.base`.

![Determining addressspace layers]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/determining_addresspsace_layers.png)

According to this, the current address space for this crash dump is `IA32PagedMemoryPae` and in order to access the Physical address space  `FileAddressSpace` (e.g. – file offsets) you’d have to go two levels (_self.addrspace.base.base_).

Most of the examples I’ve seen using volshell were for the purposes of looking at the _EPROCESS structure but since we’re more interested in the networking data we need to dig into the _ TCPT_OBJECT structure.  In the previous connections output, we see that PID 404 is at virtual offset 0x81f86e68 so if we switch to that process’ address space and review the defined structure (_TCPT_OBJECT) via `dt()`  we get:

![Volshell dt initial]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_dt_initial.png)

You can also switch context to that process `cc(pid=404)` and just do `dt(“_TCPT_OBJECT”)` but you’d need to make sure your `space` argument is correct – more on this later but for now I’m going to go about it in a different way to try and stay consistent with steps outlined later in this post.

The information presented here provides us with the offsets required to rewrite the data of interest (hex values shown on the left).  Depending on the data you’re looking to rewrite, one way of validation is to add this offset on the left to the previous offset and issue the hex dump option, e.g.:

```
db(<address from connections> + <offset from dt>, space=<whatever your space needs to be>)
          db(0x81f86e68 + 0xc, space=self.addrspace.base)
```

The above example could be used to see what resides at `RemoteIpAddress`, which is at offset 0xc. Once you’re ready to make the changes within the memory dump, supply the `-w` switch to volshell then enter the phrase _Yes, I want to enable write support_.  Also, the data you want to modify (e.g. - IP addresses in this instance) need to be converted from their decimal format to hex.

An example would be changing the LocalIp address from _127.0.0.1_ to _10.10.1.5_:

Decimal | Hex | Command
10.10.1.5 | 0x0A0A0105 | `self.addrspace.write(0x81f86e68+0x10, '\x0A\x0A\x01\x05')` 

![Volshell changing iexplore]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_changing_iexplore.png)

Let’s break down what happened above.

1. We entered volshell with write support
2. We looked at the _TCP_OBJECT_ structure at 0x81f86e68 (PID 404)
3. We wrote the new data 78.140.165.153 (dec), \x4E\x8C\xA5\x99 (hex) to where the data for the RemoteIpAddress exists which is at offset (0xc) within the memory space of PID 404 (0x81f86e68)
4. Similar to above, we wrote 10.10.1.5 (dec), \x0A\x0A\x0a\x05 (hex) to where the data for the LocalIpAddress exists which is at offset (0x10)

And here’s what it would look like from start to end:

![Volshell connections rewrite]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_connections_rewrite.png)

If we do a comparison to how the output of the `connections` plugin looks before and after the modifications we’d see:

![Connections before and after]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/connections_before_and_after.png)

Great, it worked and our data was rewritten but that’s only for the `connections` plugin…but is there any data still resident that we might not be aware by just enumerating connections the way the `connections` plugin does? (e.g. - using the `connscan` plugin we are able to scan physical memory to find _TCPT_OBJECT structures via pool tag scanning which might correspond to connections that previously closed, but whose structures have not yet been overwritten by a new connection).  Let’s run `connscan` and do a quick check:

![Connscan before]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/connscan_before.png)

Blah - yep, looks like our work isn’t over yet.  We can see that there was previously another private IP address used for the local IP address (172.21.1.206)...having that in addition to the new one (10.10.1.5) we just assigned via connections isn’t going to mix well and will certainty cause more confusion. The first red box in the image above is outlining something that was previously noted - `connscan` displays the Physical (P) offset as also indicated in a snippet of the plugins code: 

```python
@cache.CacheDecorator("scans/connscan2")
def calculate(self):
	## Just grab the AS and scan it using our scanner
	address_space = utils.load_as(self._config, astype = 'physical')
```

The other box shows data that was the `connscan` plugin found that wasn’t previously listed in the `connections` plugin. If you recall from the previous address space check image above, this is displaying the address space as `self.addrspace.base`, or `WindowsCrashDumpSpace32` in this instance.

Another thing worth noting is that **utils.py**’s `load_as()` _uses the astype `virtual` by default_ - good to know for scripting purposes:

```python
def load_as(config, astype = 'virtual', **kwargs):
	"""Loads an address space by stacking valid ASes on top of each other (priority order first)"""
```

A quick fix to help us here would be to just modify `connscan`’s astype from virtual -> physical, but what fun would that be to take an easy way out?  It’s always important to know which layer you’re in, which you need to be in and which the data you wish to access is in.  If we just took the Physical offset we got from `connscan` and tried to access the _TCPT_OBJECT structure as we previously did we’d error out as such:

![Volshell physical address for connscan]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_cant_use_physical_address_for_connscan.png)

So if we were going to take this route then we’d need to make sure the correct address space was supplied:

![Volshell connscan one layer up]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_connscan_one_layer_up.png)

Now we could have used the change context `cc()` function
e.g.:

> `cc(pid=404)`

to switch into the process of interest when we did the modifications to the data displayed from `connections` but how would that have worked for a process whose PID is no longer active? …well… let’s try:

![Volshell can't cc]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_cant_cc.png)

Let's break it down...

1. irst we get an active list of processes via `ps()` - again, active.
2. We try changing context into the PID (4032) identified via connscan so we can change its data… but we can’t
3. For troubleshooting, we can verify we can change context into a process which is listed as active
4. Verification of where we are again via the show context function, `sc()`

For this reason I decided not to go the route of `cc()`’ing into the PIDs then changing the data from there as it doesn't look like it would be feasible with the `connscan` data.  Remember when I mentioned we can do scripting within volshell?  Here’s a perfect example of when you might want to give it a go and how to go about doing so:

![Volshell connscan tests]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_connscan_tests.png)

... what just happened?

1. Import the `connscan` plugin
2. Set the address_space to whatever’s in the current config (which would be `IA32PagedMemoryPae` here - go back to the address space tests and it will be the same here as it was for `self.addrspace`).  This will help us below with regards to which layer we’re accessing.
3. Create a scanner by instantiating `connscan`’s PoolScanConnFast() class
4.      
	1. Enumerate every offset by performing `connscan`’s scanner on the address_space
	2. For any instance of a TCP Object, assign its associated data into a variable named tcp_obj - inheriting the address_space we defined in step 2 allows us to get the virtual address space instead of what would normally be the physical.
	3. For that newly created variable, print its offset, LocalIpAddress and PID

> Once you enter after your last statement and wish to actually run the code you wrote _you need to enter to a new line and make sure you’re at the beginning of it and then hit enter to execute the code_… just in case you’re banging your head about how to run the code.

Notice anything wrong with the offsets printed?  If you look at the end of them you’ll notice there’s a _L_.  This is because it's a _Long integer_ and therefore you can’t just do `hex(tcp_obj.obj_offset)` which was used in the first test.

5. Perform almost the same thing we did previously but this time print the offset in its decimal format.  This can help when debugging as you can just convert this to hex and verify it’s correct (won’t show the _L_)
6. Everything stays the same but we switch up the print statement to correct the display of the hex offset (useful to get it right if you later want to automate things)

Now that we know what we need all we have to do is follow the previous steps in order to rewrite the other data found from `connscan`:

![Volshell connscan rewrite]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/volshell_connscan_rewrite.png)

7. Check out the data within the _TCPT_OBJECT structure for PID 4032 using its virtual offset address
8. Change the data at the LocalIpAddress (0xc) to now contain the IP address 10.10.1.5
9. Validate it worked
10. Check out the data within the _TCPT_OBJECT structure for PID 4032 using its other virtual offset address (yes - if you look there are two different connections for this PID with different offsets and local ports)
11. Change the data at the LocalIpAddress (0xc) to now contain the IP address 10.10.1.5

To validate the changes worked, let’s look at a comparison for `connscan` running on the memory dump prior to modifications and then again after they’ve been made:

![Connscan before and after]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/connscan_before_and_after.png)

## PCAP

Next on the list was changing the data within the PCAP so it matched the new memory dump.  To quickly change some MAC addresses and IP addresses I’ve leveraged [tcprewrite](http://tcpreplay.synfin.net/wiki/tcprewrite) but for this particular situation, it wasn’t going to cut it.  Instead of wasting time trying to find something someone else already wrote and then more time probably having to modify it I figured it would just be easier and quicker to write something in [scapy](http://www.secdev.org/projects/scapy/).  For those unaware of scapy, it’s a packet manipulation tool which I commonly see those on the offensive side using/writing about.  Scapy has a lot of great features and allows you to really dig into the packets so besides for creating your own packets this will be an example of leveraging it for dfir use.

### Steps

Without any modifications, the initial PCAP looked like this – confusing huh?:

![PCAP before]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/pcap_before.png)

The initial tests of rewriting the SIP/DIP’s went fine, until I verified it in another instance of Wireshark.  The 2nd instance of Wireshark had the **Info column** displayed and despite the modifications to the SIP/DIP fields within the TCP layer, the old information was still showing up in this column:

![PCAP scapy rewrite]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/pcap_scapy_rewrite_but_wireshark_info_column_issue.png)

Do I just make sure that column isn’t displayed/configured?  Eh…that would be the easy way out again and I couldn’t control that in the situation I was going to be using these artifacts in.  After some back and forth I noticed `pkt[DNS].summary()`, `pkt[DNSRR].rrname` & `pkt[DNSRR].rdata` displayed the data of interest, which I was able to determine by printing all values from `pkt[DNS].fields_dec`.

Sudo code:

```python
for pkt in pkts:
	if pkt.haslayer(DNS):
	    """Testing of DNS layer attribs"""
	    if simple_debug == True:
	        print "[+] DNS fields"
	        for f in pkt[DNS].fields_desc:
	            print f
	        print ""
	        print "answers:",pkt[DNS].answers
	        print ""
	        print "qname:",pkt[DNSQR].qname #e.g. - sub.domain.org
	        print "qtype:",pkt[DNSQR].qtype 
	        print "summary:",pkt[DNS].summary() #e.g. - DNS Qry "sub.domain.org"
	        print "id:",pkt[DNS].id 

	        if pkt.haslayer(DNSRR):
	            print "rrname:",pkt[DNSRR].rrname
	            print "rdata:",pkt[DNSRR].rdata
```
(`pkt` _is what I was using to reference each packet within the PCAP in my loop_)

In order to change this I determined I needed to do some checks on the packet to:

1. determine if the packet had the DNS layer
2. if so, determine where the data resided so it could be changed.

Makes sense - I was initially only checking and changing the IP addresses on the high level but wasn’t looking deeper within the packet data to determine if they were displayed anywhere else.

So how does the final product look?

![PCAP after no total]({{ site.url }}/assets/images/blog/{{ page.image_folder }}/pcap_after_no_total_accurate_though.png)

Looks like it worked - at least for what I was set out to accomplish.  The script can be downloaded from my [Github](https://github.com/hiddenillusion/useful-scripts/blob/master/PCAPrewrite.py) but some notes on the script I created so you’re aware of what it does and what it doesn’t do:

- It was only written to address the things I needed and therefore isn’t an all-inclusive rewrite script - but it can certainly be a base for easy additions to tackle anything else you may need (e.g. - other protocols to check)
- It uses the first IPs as the values to rewrite the data with; therefore, if there are multiple conversations within the PCAP they are most likely going to become one.
- Also, this is only looking at TCP/UDP packets so something like ICMP won't have its data rewritten either.

Big thanks to [Andrew Case](https://twitter.com/attrc) for his quick and helpful troubleshooting on some things that arose during the memory modifications sections.  If I screwed up on any screenshots or anything else just drop me a line – stuff unfortunately slips by sometimes.
