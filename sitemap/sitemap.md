---
layout: page
permalink: /sitemap/
title: " :: Sitemap"
menu: $ find /
description: "A visual sitemap of all the pages on hiddenillusion.github.io"
source: https://raw.githubusercontent.com/mmistakes/made-mistakes-jekyll/master/_pages/sitemap.md
---

A hierarchical breakdown of this site can be seen below.

> An ugly [XML version]({{ site.url }}/sitemap.xml) is also available for digesting.

<div class="sitemap">
  <ul id="primaryNav" class="col4">
    <li id="home"><a href="{{ site.url }}">Home</a></li>
    <li><a href="{{ site.url }}/spotlight/">Spotlight</a></li>
    <li><a href="{{ site.url }}/resume/">Resume</a></li>
    <li><a href="{{ site.url }}/archive/">Blog Articles</a>          
      <ul>
        {% for post in site.posts %}
          <li><a href="{{ post.url | prepend: site.url }}">{{ post.title }}</a></li>
        {% endfor %}
      </ul>
    </li>
    <li><a href="{{ site.url }}/tag/">Tags</a> 
      <ul>
        {% assign tags_list = site.tags | sort %}
        {% for tag in tags_list %}
          <li><a href="{{ site.url }}/tag/index.html#{{ tag[0] }}">{{ tag[0] }}</a></li>
        {% endfor %}
      </ul>
     </li>
  </ul>
</div>
