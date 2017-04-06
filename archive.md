---
layout: page
title: " :: Blog Archive"
menu: $ gzip -l *
permalink: /archive/
---

### <i class="fa fa-file-archive-o fa-1x"></i> My Scratchpad

> You can also browse by <a href="{{ site.url }}/tag/">tags</a>

<div>
  <ul>
  {% for post in site.posts %}
    {% capture currentyear %}{{post.date | date: "%Y"}}{% endcapture %}
    {% if currentyear != year %}
      {% unless forloop.first %}
      {% endunless %}
      <h5>{{ currentyear }}</h5>
      {% capture year %}{{currentyear}}{% endcapture %}
    {% endif %}
    <ul>
      <div>
        <small>
          {{ post.date | date: "%b %-d, %Y" }} &raquo;
        </small>
        <a href="{{ post.url | prepend: site.url }}">{{ post.title }}</a>          
        {% if post.tags.size > 0 %}
          <p>
          <small>
            {% assign sorted_tags = post.tags | sort %}
            {% for tag in sorted_tags %}
             <span class="tag-mark tooltip">
                <i class="fa fa-tag"></i>
                  <a class="link" href="{{ site.url }}/tag/index.html#{{ tag | cgi_escape }}" data-title="Pages tagged {{ tag }}">{{ tag }}</a>
              </span>
              {% unless forloop.last %}&nbsp;{% endunless %}
            {% endfor %}
          {% endif %}
        </small>
        </p>
      </div>
    </ul>
    {% endfor %}
  </ul>
</div>
