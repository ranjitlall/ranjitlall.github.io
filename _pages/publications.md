---
layout: page
permalink: /research/
title: research
description: 
years: [2025, 2023, 2022, 2021, 2020, 2017, 2016, 2015, 2012, 2011]
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

<h1>book</h1>

{% bibliography -f books %}

<h1> articles and book chapters </h1>

{% for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f papers -q @*[year={{y}}]* %}
{% endfor %}



<h1>policy reports</h1>

{% bibliography -f policy_reports %}

</div>
