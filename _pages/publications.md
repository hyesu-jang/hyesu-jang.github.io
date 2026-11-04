---
layout: page
permalink: /publications/
title: publications
description: Filter by type, research area, domain or year, or search by title, author and venue. * equal contribution, † corresponding author.
nav: true
nav_order: 1

# Filter options. Keys must match the classification in _layouts/bib.liquid:
# - type: workshop (workshop=true or "Workshop"/"Poster" in booktitle), domestic-journal /
#   domestic-conference (domestic=true), journal (@article), conference (@inproceedings)
# - areas / domains: flags set to {true} in _bibliography/papers.bib
pub_types:
  - key: journal
    label: Journals
    chip: Journal
  - key: conference
    label: Conferences
    chip: Conference
  - key: domestic-journal
    label: Domestic Journals
    chip: Domestic Journal
  - key: domestic-conference
    label: Domestic Conferences
    chip: Domestic Conference
  - key: workshop
    label: Workshops & Posters
    chip: Workshop / Poster

pub_areas:
  - key: radar
    label: Radar
  - key: sonar
    label: Sonar
  - key: lidar
    label: LiDAR
  - key: slam
    label: SLAM
  - key: learning
    label: Learning

pub_domains:
  - key: surface
    label: Maritime Surface
  - key: under
    label: Underwater
  - key: ground
    label: Ground
---

<div class="pub-filter" id="pub-filter">
  <div class="pub-filter-search">
    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
    <input type="search" class="pub-filter-input" data-filter="q" placeholder="Search by title, author or venue" aria-label="Search publications" autocomplete="off" spellcheck="false">
  </div>
  <div class="pub-filter-rows">
    <div class="pub-filter-row">
      <span class="pub-filter-label" id="pub-filter-label-type">Type</span>
      <div class="pub-filter-options" data-filter="type" role="group" aria-labelledby="pub-filter-label-type">
        <button type="button" class="pub-filter-chip pub-filter-chip-all" data-value="">All</button>
        {% for t in page.pub_types %}<button type="button" class="pub-filter-chip" data-value="{{ t.key }}" data-chip="{{ t.chip }}">{{ t.label }}</button>{% endfor %}
      </div>
    </div>
    <div class="pub-filter-row">
      <span class="pub-filter-label" id="pub-filter-label-area">Area</span>
      <div class="pub-filter-options" data-filter="area" role="group" aria-labelledby="pub-filter-label-area">
        <button type="button" class="pub-filter-chip pub-filter-chip-all" data-value="">All</button>
        {% for a in page.pub_areas %}<button type="button" class="pub-filter-chip" data-value="{{ a.key }}">{{ a.label }}</button>{% endfor %}
      </div>
    </div>
    <div class="pub-filter-row">
      <span class="pub-filter-label" id="pub-filter-label-domain">Domain</span>
      <div class="pub-filter-options" data-filter="domain" role="group" aria-labelledby="pub-filter-label-domain">
        <button type="button" class="pub-filter-chip pub-filter-chip-all" data-value="">All</button>
        {% for d in page.pub_domains %}<button type="button" class="pub-filter-chip" data-value="{{ d.key }}">{{ d.label }}</button>{% endfor %}
      </div>
    </div>
    <div class="pub-filter-row">
      <span class="pub-filter-label" id="pub-filter-label-year">Year</span>
      <div class="pub-filter-options" data-filter="year" role="group" aria-labelledby="pub-filter-label-year">
        <button type="button" class="pub-filter-chip pub-filter-chip-all" data-value="">All</button>
      </div>
    </div>
  </div>
  <div class="pub-filter-status">
    <span class="pub-filter-count" aria-live="polite"></span>
    <button type="button" class="pub-filter-reset" hidden>Clear filters</button>
  </div>
</div>

<div class="publications" id="pub-list">
  {% bibliography --group_by none %}
</div>

<p class="pub-filter-empty" hidden>No publications match these filters.</p>

<script src="{{ '/assets/js/publications-filter.js' | relative_url | bust_file_cache }}" defer></script>
