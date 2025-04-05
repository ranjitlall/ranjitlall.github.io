---
layout: page
permalink: /repositories/
title: data and software
description: 
nav: true
nav_order: 3
---

### Some repositories I have contributed to

{% if site.data.repositories.github_repos %}
<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.html repository=repo %}
  {% endfor %}
</div>
{% endif %}
