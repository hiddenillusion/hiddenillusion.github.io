---
layout: page
title: "Hiddenillusion :: Publications, Presentations & Contributions"
menu: Spotlight
permalink: /spotlight/

presentations:
    - preso1:
      title: What's going on out there?
      year: 2013
      slides_url: https://speakerdeck.com/hiddenillusion/whats-going-on-out-there
      outlet: SANS DFIR Summit
      outlet_url: https://www.sans.org/event/dfir-summit-2013
    - preso2:
      title: Analyzing Malware with REMnux
      year: 2013
      slides_url: https://speakerdeck.com/u/hiddenillusion/p/analyzing-malware-with-remnux
      outlet: NYC4SEC
      outlet_url: http://www.nyc4sec.info/events/54791592/?eventId=54791592&action=detail
    - preso3:
      title: Mo' Memory No' Problem
      year: 2014
      slides_url: https://speakerdeck.com/hiddenillusion/mo-memory-no-problem
      outlet: BSidesNOLA
      outlet_url: http://www.securitybsides.com/w/page/71231585/BsidesNola2014

publications:
    - pub1:
      title: Let Me In - An outline of how incident responders can get into a locked system
      year: 2012
      outlet: Digital Forensics Magazine
      issue_notes: Issue 11
      url: https://www.digitalforensicsmagazine.com/index.php?option=com_content&view=article&id=794
      outlet_url: https://www.digitalforensicsmagazine.com/index.php?option=com_content&view=article&id=292&Itemid=72
      abstract:
        - part1:
          content: In the field of Incident Response (IR), time is of the essence and a locked system may cause an investigation to become delayed, or even worse, over. For the purpose of this paper, a locked system should be considered either a live or a dead system that requires authentication on the Operating System (OS) level. Over the years there have been a few tricks to get around this type of restraint, however, some methods are not maintained by the community, do not work because of system updates, or the responder is simply not aware of them.
        - part2:
          content: The intent of this article is to inform the IR community of current techniques available to overcome these types of situations while also providing a brief technical overview of what each technique involves. Although this paper includes techniques that will also work on Macintosh and Linux platforms, the primary focus of this paper will be unlocking a Windows system. Windows is still the most dominant platform on the market and is what an incident responder is most likely to encounter.
    - pub2:
      title: Using REMnux to analyze PE Files
      year: 2012
      outlet: Hakin9 Magazine
      issue_notes: Vol. 7 No. 6 | ISSN 1733-7186
      url: http://hakin9.org/hakin9-062012-biometrics
      outlet_url: https://hakin9.org/download/hakin9-062012-biometrics/
      abstract:
        - part1:
          content: One of the key things to realize is that you can perform your analysis more efficiently and effectively if you know what tools and features are available to you and how to properly leverage them when doing your analysis. To help illustrate why REMnux should be something in your toolkit let’s take a look at how we can use it to analyze a Portable Executable (PE) file and try to determine if it is malicious or benign.
---

### <i class="fa fa-newspaper-o"></i> Articles

{% assign counter=0 %}
<div class="container">
    <div class="row">
        <ul>
            {% assign sorted = (page.publications | sort: 'year') | reverse %}
            {% for publication in sorted %}
              <li>
            		<h3><a href="{{ publication.url }}" target="_blank">{{ publication.title }}</a></h3>
            			<p>
	                	<small>
  								    {{ publication.year }} | {{ publication.outlet }} | 
  								    {% if publication.outlet_url %}
  								    	 (<a href="{{ publication.outlet_url }}" target="_blank">{{ publication.issue_notes}}</a>)
  								    {% else %}
  								    	{{ publication.issue_notes}}
  								    {% endif %}
  								    <p>
    									    <a class="collapse-toggle tooltip" data-collapse="#read-more{{ counter }}" href="#" style="text-decoration:none;">
    										    <span class="collapse-text-show link" data-title="Click to expand">
                              Read Abstract
                            </span>
    										    <span class="collapse-text-hide">
                              Hide Abstract
                            </span>
    										  </a>
    										  <div class="collapse" id="read-more{{ counter }}">
    											{% for part in publication.abstract %}
    												<p>
    													{{ part.content }}
    												</p>
    											{% endfor %}
    										  </div>
  									   </p>
								    </small>
							   </p>
					   </li>
					{% assign counter=counter | plus:1 %} 
          {% endfor %}
        </ul>
    </div>
</div>

### <i class="fa fa-file-text-o"></i> Presentations
> ...sometimes I come out of the shadows

{% assign counter=0 %}
<div class="container">
    <div class="row">
        <ul>
            {% assign sorted = (page.presentations | sort: 'year') | reverse %}
            {% for presentation in sorted %}
              <li>
                {{ presentation.title }}
                  <p>
                    <small>
                      {{ presentation.year }} | 
                      {% if presentation.outlet_url %}
                        <a href="{{ presentation.outlet_url }}" target="_blank">{{ presentation.outlet}}</a>
                      {% else %}
                        {{ presentation.outlet }}
                      {% endif %}
                       | (<a href="{{ presentation.slides_url }}" target="_blank">slides</a>)
                    </small>
                 </p>
             </li>
          {% assign counter=counter | plus:1 %} 
          {% endfor %}
        </ul>
    </div>
</div>

### <i class="fa fa-files-o"></i> Spotlight and <i class="fa fa-code"></i> Contributions

> <i class="fa fa-quote-left"></i>
    Sharing is caring and knowledge is power
  <i class="fa fa-quote-right"></i>

- [Volatility](https://github.com/volatilityfoundation/volatility/graphs/contributors)
- [Volatility Community](https://github.com/volatilityfoundation/community/graphs/contributors)
- [python-registry](https://github.com/williballenthin/python-registry/graphs/contributors)
- [INDXParse](https://github.com/williballenthin/INDXParse/graphs/contributors)

### <i class="fa fa-pencil"></i> Guest Posts
- [Windows Timestamp Tampering](http://blog.opensecurityresearch.com/2012/01/windows-timestamp-tampering.html)