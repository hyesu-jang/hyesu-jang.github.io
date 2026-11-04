// Filterable publication list for /publications/.
// Each entry carries data-pub-type / data-pub-year / data-pub-month / data-pub-tags,
// written by _layouts/bib.liquid. This script groups entries by year, adds tag chips,
// and filters by the toggle pills and search box in _pages/publications.md.
(function () {
  "use strict";

  var filterRoot = document.getElementById("pub-filter");
  var listRoot = document.getElementById("pub-list");
  if (!filterRoot || !listRoot) return;

  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var GROUP_KEYS = ["type", "area", "domain", "year"];
  var FILTER_KEYS = GROUP_KEYS.concat(["q"]);

  var groupEls = {};
  GROUP_KEYS.forEach(function (key) {
    groupEls[key] = filterRoot.querySelector('.pub-filter-options[data-filter="' + key + '"]');
  });
  var searchInput = filterRoot.querySelector('[data-filter="q"]');
  var countEl = filterRoot.querySelector(".pub-filter-count");
  var resetBtn = filterRoot.querySelector(".pub-filter-reset");
  var emptyEl = document.querySelector(".pub-filter-empty");
  var state = { type: "", area: "", domain: "", year: "", q: "" };

  function optionButtons(key) {
    return Array.prototype.slice.call(groupEls[key].querySelectorAll(".pub-filter-chip"));
  }

  // Chips under each entry use the singular data-chip label when given ("Journal" vs. "Journals").
  function optionLabels(key) {
    var labels = {};
    optionButtons(key).forEach(function (btn) {
      var value = btn.getAttribute("data-value");
      if (value) labels[value] = (btn.getAttribute("data-chip") || btn.textContent).trim();
    });
    return labels;
  }

  function parseMonth(raw) {
    var value = (raw || "").trim().toLowerCase();
    if (!value) return 0;
    var num = parseInt(value, 10);
    if (!isNaN(num)) return num;
    return MONTHS[value.slice(0, 3)] || 0;
  }

  var typeLabels = optionLabels("type");
  var areaLabels = optionLabels("area");
  var domainLabels = optionLabels("domain");

  // Collect entries.
  var entries = [];
  listRoot.querySelectorAll("li").forEach(function (li, index) {
    var row = li.querySelector(".row[data-pub-type]");
    if (!row) return;
    entries.push({
      li: li,
      row: row,
      index: index,
      type: row.getAttribute("data-pub-type"),
      year: (row.getAttribute("data-pub-year") || "").trim(),
      month: parseMonth(row.getAttribute("data-pub-month")),
      tags: (row.getAttribute("data-pub-tags") || "").split(/\s+/).filter(Boolean),
      text: "",
    });
  });
  if (!entries.length) return;

  // Newest first: year, then month; keep source order for ties.
  entries.sort(function (a, b) {
    return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0) || b.month - a.month || a.index - b.index;
  });

  // Rebuild the list as year sections.
  var groups = document.createElement("div");
  groups.className = "pub-groups";
  var sections = {};
  var years = [];
  entries.forEach(function (entry) {
    var key = entry.year || "Other";
    if (!sections[key]) {
      var section = document.createElement("section");
      section.className = "pub-year";
      var heading = document.createElement("h2");
      heading.className = "pub-year-title";
      heading.textContent = key;
      var ol = document.createElement("ol");
      ol.className = "bibliography";
      section.appendChild(heading);
      section.appendChild(ol);
      groups.appendChild(section);
      sections[key] = { el: section, ol: ol };
      if (entry.year) years.push(entry.year);
    }
    sections[key].ol.appendChild(entry.li);
  });
  listRoot.innerHTML = "";
  listRoot.appendChild(groups);

  // Tag chips under each entry's venue line; clicking a chip applies that filter.
  function makeTag(label, filterKey, value, variantClass) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pub-chip " + variantClass;
    chip.textContent = label;
    chip.setAttribute("data-chip-filter", filterKey);
    chip.setAttribute("data-chip-value", value);
    chip.title = "Show only " + label;
    return chip;
  }

  entries.forEach(function (entry) {
    var body = entry.row.querySelector(":scope > div[id]") || entry.row;
    var wrap = document.createElement("div");
    wrap.className = "pub-tags";
    if (typeLabels[entry.type]) wrap.appendChild(makeTag(typeLabels[entry.type], "type", entry.type, "pub-chip-type"));
    entry.tags.forEach(function (tag) {
      if (areaLabels[tag]) wrap.appendChild(makeTag(areaLabels[tag], "area", tag, "pub-chip-area"));
    });
    entry.tags.forEach(function (tag) {
      if (domainLabels[tag]) wrap.appendChild(makeTag(domainLabels[tag], "domain", tag, "pub-chip-domain"));
    });
    body.insertBefore(wrap, body.querySelector(".links"));
    // Search text excludes the chips and link buttons.
    var clone = body.cloneNode(true);
    clone.querySelectorAll(".pub-tags, .links, .badges, .hidden").forEach(function (n) {
      n.remove();
    });
    entry.text = clone.textContent.replace(/\s+/g, " ").toLowerCase();
  });

  // Year pills, then a count on every pill; pills that would match nothing are dropped.
  years.forEach(function (year) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-filter-chip";
    btn.setAttribute("data-value", year);
    btn.textContent = year;
    groupEls.year.appendChild(btn);
  });

  var TESTS = {
    type: function (e, v) {
      return e.type === v;
    },
    area: function (e, v) {
      return e.tags.indexOf(v) !== -1;
    },
    domain: function (e, v) {
      return e.tags.indexOf(v) !== -1;
    },
    year: function (e, v) {
      return e.year === v;
    },
  };

  GROUP_KEYS.forEach(function (key) {
    optionButtons(key).forEach(function (btn) {
      var value = btn.getAttribute("data-value");
      var n = value
        ? entries.filter(function (e) {
            return TESTS[key](e, value);
          }).length
        : entries.length;
      if (n === 0) {
        btn.remove();
        return;
      }
      var badge = document.createElement("span");
      badge.className = "pub-filter-chip-count";
      badge.textContent = n;
      btn.appendChild(badge);
    });
  });

  // Filtering.
  function matches(entry) {
    for (var i = 0; i < GROUP_KEYS.length; i++) {
      var key = GROUP_KEYS[i];
      if (state[key] && !TESTS[key](entry, state[key])) return false;
    }
    if (state.q) {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var j = 0; j < terms.length; j++) {
        if (entry.text.indexOf(terms[j]) === -1) return false;
      }
    }
    return true;
  }

  function writeUrl() {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    FILTER_KEYS.forEach(function (key) {
      if (state[key]) url.searchParams.set(key, state[key]);
      else url.searchParams.delete(key);
    });
    try {
      window.history.replaceState(null, "", url.href);
    } catch (e) {
      // URL sync is a convenience; filtering still works without it.
    }
  }

  function apply() {
    var visible = 0;
    entries.forEach(function (entry) {
      var show = matches(entry);
      entry.li.hidden = !show;
      if (show) visible++;
    });
    Object.keys(sections).forEach(function (key) {
      var section = sections[key];
      section.el.hidden = !section.ol.querySelector("li:not([hidden])");
    });

    var active = FILTER_KEYS.some(function (key) {
      return state[key];
    });
    countEl.textContent = active ? visible + " of " + entries.length + " publications" : entries.length + " publications";
    resetBtn.hidden = !active;
    if (emptyEl) emptyEl.hidden = visible !== 0;

    GROUP_KEYS.forEach(function (key) {
      optionButtons(key).forEach(function (btn) {
        var on = btn.getAttribute("data-value") === state[key];
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
    document.querySelectorAll(".pub-chip").forEach(function (chip) {
      var key = chip.getAttribute("data-chip-filter");
      chip.classList.toggle("is-active", state[key] === chip.getAttribute("data-chip-value"));
    });

    writeUrl();
  }

  function setFilter(key, value) {
    value = value || "";
    if (key === "q") {
      state.q = value.trim();
      searchInput.value = value;
      return;
    }
    var known = optionButtons(key).some(function (btn) {
      return btn.getAttribute("data-value") === value;
    });
    state[key] = known ? value : "";
  }

  // Restore state from the URL (?type=journal&area=radar...).
  var params = new URLSearchParams(window.location.search);
  FILTER_KEYS.forEach(function (key) {
    if (params.has(key)) setFilter(key, params.get(key));
  });

  // Pills: pick one per row; clicking the active pill clears that row.
  GROUP_KEYS.forEach(function (key) {
    groupEls[key].addEventListener("click", function (event) {
      var btn = event.target.closest(".pub-filter-chip");
      if (!btn) return;
      var value = btn.getAttribute("data-value");
      setFilter(key, value && state[key] === value ? "" : value);
      apply();
    });
  });

  searchInput.addEventListener("input", function () {
    state.q = searchInput.value.trim();
    apply();
  });

  resetBtn.addEventListener("click", function () {
    FILTER_KEYS.forEach(function (key) {
      setFilter(key, "");
    });
    apply();
  });

  groups.addEventListener("click", function (event) {
    var chip = event.target.closest(".pub-chip");
    if (!chip) return;
    var key = chip.getAttribute("data-chip-filter");
    var value = chip.getAttribute("data-chip-value");
    setFilter(key, state[key] === value ? "" : value);
    apply();
    // Bring the filters back into view, below the fixed navbar.
    var top = filterRoot.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: top + window.scrollY - 80, behavior: "smooth" });
  });

  apply();

  // Deep links (/publications/#entry-key, used by the research graph): the list was
  // reordered above, so scroll to the entry again and briefly highlight it.
  if (window.location.hash.length > 1) {
    var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    var targetLi = target && target.closest("li");
    if (targetLi && !targetLi.hidden) {
      window.scrollTo({ top: targetLi.getBoundingClientRect().top + window.scrollY - 90 });
      targetLi.classList.add("pub-flash");
      setTimeout(function () {
        targetLi.classList.remove("pub-flash");
      }, 2400);
    }
  }
})();
