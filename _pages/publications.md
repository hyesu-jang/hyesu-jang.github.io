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
  <div class="pub-filter-controls">
    <label class="pub-filter-field">
      <span class="pub-filter-label">Type</span>
      <select class="pub-filter-select" data-filter="type">
        <option value="">All types</option>
        {% for t in page.pub_types %}<option value="{{ t.key }}" data-chip="{{ t.chip }}">{{ t.label }}</option>{% endfor %}
      </select>
    </label>
    <label class="pub-filter-field">
      <span class="pub-filter-label">Area</span>
      <select class="pub-filter-select" data-filter="area">
        <option value="">All areas</option>
        {% for a in page.pub_areas %}<option value="{{ a.key }}">{{ a.label }}</option>{% endfor %}
      </select>
    </label>
    <label class="pub-filter-field">
      <span class="pub-filter-label">Domain</span>
      <select class="pub-filter-select" data-filter="domain">
        <option value="">All domains</option>
        {% for d in page.pub_domains %}<option value="{{ d.key }}">{{ d.label }}</option>{% endfor %}
      </select>
    </label>
    <label class="pub-filter-field pub-filter-field--year">
      <span class="pub-filter-label">Year</span>
      <select class="pub-filter-select" data-filter="year">
        <option value="">All years</option>
      </select>
    </label>
    <label class="pub-filter-field pub-filter-field--search">
      <span class="pub-filter-label">Search</span>
      <input type="search" class="pub-filter-input" data-filter="q" placeholder="Title, author, venue…" autocomplete="off" spellcheck="false">
    </label>
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
