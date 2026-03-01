(function initializeSiteShell() {
  var root = document.querySelector('[data-site]');
  var asciiLayer = document.querySelector('[data-ascii-layer]');
  var siteWordmark = document.querySelector(".site-wordmark");
  var projectsRoot = document.querySelector('[data-projects-root]');
  var footerYear = document.querySelector('[data-footer-year]');
  var projectsLogoContainer = document.querySelector(".projects-logo-shell");
  var projectsLogoShell = document.querySelector('[data-projects-logo-shell]');
  var projectsLogoHelix = document.querySelector('[data-projects-logo-helix]');
  var projectsLogoFallback = document.querySelector('[data-projects-logo]');
  if (!root || !asciiLayer) {
    return;
  }

  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }
  var wordmarkBaseText = siteWordmark ? siteWordmark.textContent : "";
  var wordmarkPulseTimer = 0;
  var wordmarkRestoreTimer = 0;
  var wordmarkGlyphPool = "!@#$%^&*+-=/\\|[]{}<>?:;~_";

  var projectsManifestPath = "projects.md";
  var projectEntriesSeed = [
    {
      title: "ASCII Terrain Playground",
      githubUrl: "https://github.com/maxcasper/ascii-terrain-playground",
      websiteUrl: "",
      slug: "ascii-terrain-playground",
      summary: "Procedural ASCII terrain experiments with motion-safe rendering.",
      command: "exec open --repo"
    },
    {
      title: "Signal Notes",
      githubUrl: "https://github.com/maxcasper/signal-notes",
      websiteUrl: "",
      slug: "signal-notes",
      summary: "Minimal markdown publishing flow for technical notes.",
      command: "exec open --repo"
    },
    {
      title: "Canvas Drift",
      githubUrl: "https://github.com/maxcasper/canvas-drift",
      websiteUrl: "",
      command: "exec open --repo"
    }
  ];

  function isValidProjectEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    if (typeof entry.title !== "string" || entry.title.trim() === "") {
      return false;
    }
    if (typeof entry.githubUrl !== "string" || entry.githubUrl.trim() === "") {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "slug") && typeof entry.slug !== "string") {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "summary") && typeof entry.summary !== "string") {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "command") && typeof entry.command !== "string") {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "websiteUrl") && typeof entry.websiteUrl !== "string") {
      return false;
    }
    return true;
  }

  function normalizeProjectEntries(entries) {
    var normalized = [];
    var i;

    for (i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      if (!isValidProjectEntry(entry)) {
        // Keep runtime resilient if content data drifts from expected shape.
        console.warn("Skipping invalid project entry at index", i);
        continue;
      }
      normalized.push({
        title: entry.title.trim(),
        githubUrl: entry.githubUrl.trim(),
        websiteUrl: typeof entry.websiteUrl === "string" ? entry.websiteUrl.trim() : "",
        slug: typeof entry.slug === "string" ? entry.slug.trim() : "",
        summary: typeof entry.summary === "string" ? entry.summary.trim() : "",
        command: typeof entry.command === "string" ? entry.command.trim() : ""
      });
    }

    return normalized;
  }

  function resolveProjectEntriesModel() {
    return {
      manifestPath: projectsManifestPath,
      entries: normalizeProjectEntries(projectEntriesSeed)
    };
  }

  function parseProjectsMarkdown(markdown) {
    var lines = markdown.split(/\r?\n/);
    var entries = [];
    var current = null;
    var i;

    function pushCurrent() {
      if (!current) {
        return;
      }
      entries.push(current);
      current = null;
    }

    for (i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      var headingMatch = /^##\s+(.+)$/.exec(line);
      if (headingMatch) {
        pushCurrent();
        current = {
          title: headingMatch[1].trim(),
          githubUrl: "",
          websiteUrl: "",
          slug: "",
          summary: "",
          command: ""
        };
        continue;
      }
      if (!current) {
        continue;
      }

      var githubMatch = /^-\s*(github|git|repo|url)\s*:\s*(.+)$/i.exec(line);
      if (githubMatch) {
        current.githubUrl = githubMatch[2].trim();
        continue;
      }

      var summaryMatch = /^-\s*summary\s*:\s*(.+)$/i.exec(line);
      if (summaryMatch) {
        current.summary = summaryMatch[1].trim();
        continue;
      }

      var slugMatch = /^-\s*slug\s*:\s*(.+)$/i.exec(line);
      if (slugMatch) {
        current.slug = slugMatch[1].trim();
        continue;
      }

      var commandMatch = /^-\s*command\s*:\s*(.+)$/i.exec(line);
      if (commandMatch) {
        current.command = commandMatch[1].trim();
        continue;
      }

      var websiteMatch = /^-\s*(website|site|live|demo)\s*:\s*(.+)$/i.exec(line);
      if (websiteMatch) {
        current.websiteUrl = websiteMatch[2].trim();
      }
    }

    pushCurrent();
    return normalizeProjectEntries(entries);
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderProjectEntries(model) {
    if (!projectsRoot) {
      return;
    }

    var projects = model && Array.isArray(model.entries) ? model.entries : normalizeProjectEntries(projectEntriesSeed);
    if (projects.length === 0) {
      projectsRoot.innerHTML = "<p>No projects yet.</p>";
      return;
    }

    var html = '<ul class="projects-list" data-projects-list>';
    var i;

    function getProjectCardVariantClass(index, total) {
      if (total <= 1) {
        return "project-item--featured";
      }
      if (index === 0) {
        return "project-item--featured";
      }
      return index % 3 === 0 ? "project-item--compact" : "project-item--standard";
    }

    for (i = 0; i < projects.length; i += 1) {
      var project = projects[i];
      var variantClass = getProjectCardVariantClass(i, projects.length);
      var safeTitle = escapeHtml(project.title);
      var safeGitHubUrl = escapeHtml(project.githubUrl);
      var hasWebsiteUrl = /^https?:\/\//i.test(project.websiteUrl || "");
      var safeWebsiteUrl = hasWebsiteUrl ? escapeHtml(project.websiteUrl) : "";
      var safeSummary = escapeHtml(project.summary);
      var hasCommand = typeof project.command === "string" && project.command.trim() !== "";
      var safeCommand = hasCommand ? escapeHtml(project.command) : "";
      var summaryText = project.summary ? safeSummary : "No description available.";
      var summaryMarkup = '<p class="project-summary">' + summaryText + "</p>";
      var linksMarkup =
        '<div class="project-links">' +
        '<a class="project-link-icon" href="' +
        safeGitHubUrl +
        '" target="_blank" rel="noreferrer" aria-label="Open GitHub repository">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.2c-3.4.7-4.1-1.5-4.1-1.5-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.2 2.5 3.7 1.8.1-.7.4-1.1.7-1.4-2.7-.3-5.5-1.3-5.5-5.8 0-1.3.5-2.3 1.1-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2A11.2 11.2 0 0 1 12 5.7c1 0 2 .1 3 .4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.9 1.1 1.9 1.1 3.2 0 4.6-2.8 5.5-5.5 5.8.4.3.8 1 .8 2v3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>' +
        "</a>";
      if (hasWebsiteUrl) {
        linksMarkup +=
          '<a class="project-link-icon" href="' +
          safeWebsiteUrl +
          '" target="_blank" rel="noreferrer" aria-label="Open project website">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm7.9 9h-3.1a15.5 15.5 0 0 0-1.2-5 8 8 0 0 1 4.3 5ZM12 4.2c.9 1 1.9 3.4 2.4 6.8H9.6c.5-3.4 1.5-5.8 2.4-6.8ZM4.1 13h3.1a15.5 15.5 0 0 0 1.2 5 8 8 0 0 1-4.3-5Zm0-2a8 8 0 0 1 4.3-5 15.5 15.5 0 0 0-1.2 5Zm5.5 2h4.8c-.5 3.4-1.5 5.8-2.4 6.8-.9-1-1.9-3.4-2.4-6.8Zm0-2c.5-3.4 1.5-5.8 2.4-6.8.9 1 1.9 3.4 2.4 6.8Zm6 7a15.5 15.5 0 0 0 1.2-5h3.1a8 8 0 0 1-4.3 5Z"/></svg>' +
          "</a>";
      }
      linksMarkup += "</div>";
      var commandMarkup = "";
      if (hasCommand) {
        commandMarkup =
          '<div class="project-actions"><span class="project-command" aria-hidden="true">$</span><span class="project-launch">' +
          safeCommand +
          "</span></div>";
      }
      html +=
        '<li class="project-item ' +
        variantClass +
        '">' +
        '<article class="project-card">' +
        '<div class="project-meta">' +
        '<h3 class="project-title"><a href="' +
        safeGitHubUrl +
        '" target="_blank" rel="noreferrer">' +
        safeTitle +
        "</a></h3>" +
        summaryMarkup +
        commandMarkup +
        linksMarkup +
        "</div>" +
        "</article>" +
        "</li>";
    }

    html += "</ul>";
    projectsRoot.innerHTML = html;
  }

  function loadProjectEntriesModel() {
    var fallbackModel = resolveProjectEntriesModel();
    if (!window.fetch) {
      return Promise.resolve(fallbackModel);
    }

    return window
      .fetch(fallbackModel.manifestPath, {
        headers: {
          Accept: "application/json"
        }
      })
      .then(function onProjectsLoaded(response) {
        if (!response.ok) {
          throw new Error("Projects markdown request failed with status " + response.status);
        }
        return response.text();
      })
      .then(function onProjectsParsed(markdown) {
        return {
          manifestPath: fallbackModel.manifestPath,
          entries: parseProjectsMarkdown(markdown)
        };
      })
      .catch(function onProjectsFailed(error) {
        console.warn("Using fallback projects model:", error.message);
        return fallbackModel;
      });
  }

  var ramp = " .,:;irsXA253hMHGS#9B&@";
  var cellWidth = 8;
  var cellHeight = 12;
  var measuredCellWidth = cellWidth;
  var measuredCellHeight = cellHeight;
  var gridOverscanColumns = 2;
  var gridOverscanRows = 2;
  var bubbleCount = 5;
  var bubbles = [];
  var bubbleDriftRate = 0.12;
  var shiftFieldCount = 4;
  var shiftFields = [];
  var shiftDriftRate = 0.08;
  var macroWavePrimaryAmplitude = 0.16;
  var macroWaveSecondaryAmplitude = 0.1;
  var macroWaveTertiaryAmplitude = 0.05;
  var macroWavePrimaryFrequency = 0.42;
  var macroWaveSecondaryFrequency = 0.36;
  var macroWaveTertiaryFrequency = 0.21;
  var macroWavePrimarySpeed = 0.22;
  var macroWaveSecondarySpeed = 0.17;
  var macroWaveTertiarySpeed = 0.11;
  var pulseEnvelope = 0;
  var pulseAmplitude = 0;
  var pulseStartAt = -1;
  var pulseDuration = 0;
  var nextPulseAt = 2.8;
  var asciiBaseColor = { r: 116, g: 199, b: 236 };
  var asciiBaseAlpha = 0.19;
  var bloomPalette = [
    { r: 116, g: 199, b: 236 },
    { r: 137, g: 180, b: 250 },
    { r: 180, g: 190, b: 254 }
  ];
  var bloomEnvelope = 0;
  var bloomAmplitude = 0;
  var bloomStartAt = -1;
  var bloomDuration = 0;
  var bloomDurationMinSeconds = 3.1;
  var bloomDurationMaxSeconds = 5;
  var bloomAmplitudeMin = 0.16;
  var bloomAmplitudeMax = 0.28;
  var bloomDelayMinSeconds = 8.4;
  var bloomDelayMaxSeconds = 14.4;
  var bloomAlphaBoost = 0.08;
  var bloomAlphaMax = 0.31;
  var nextBloomAt = 3.6;
  var activeBloomColorIndex = 0;

  function hash2D(x, y) {
    var value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function valueNoise(x, y) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var x1 = x0 + 1;
    var y1 = y0 + 1;

    var sx = smoothstep(x - x0);
    var sy = smoothstep(y - y0);

    var n00 = hash2D(x0, y0);
    var n10 = hash2D(x1, y0);
    var n01 = hash2D(x0, y1);
    var n11 = hash2D(x1, y1);

    var ix0 = n00 + (n10 - n00) * sx;
    var ix1 = n01 + (n11 - n01) * sx;
    return ix0 + (ix1 - ix0) * sy;
  }

  function fractalNoise(x, y) {
    var amplitude = 1;
    var frequency = 1;
    var total = 0;
    var norm = 0;
    var octaves = 4;
    var i;

    for (i = 0; i < octaves; i += 1) {
      total += valueNoise(x * frequency, y * frequency) * amplitude;
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return total / norm;
  }

  function mapToAscii(v) {
    var clamped = Math.max(0, Math.min(1, v));
    var index = Math.floor(clamped * (ramp.length - 1));
    return ramp.charAt(index);
  }

  function seedBubbles() {
    var i;
    for (i = 0; i < bubbleCount; i += 1) {
      bubbles.push({
        baseX: hash2D(13.2 + i * 3.7, 57.8) * 10,
        baseY: hash2D(71.3, 22.9 + i * 2.8) * 10,
        orbitX: 0.8 + hash2D(12.4 + i, 99.2) * 1.8,
        orbitY: 0.8 + hash2D(48.9, 42.6 + i) * 1.8,
        speed: 0.18 + hash2D(90.1 + i * 0.2, 7.3) * 0.32,
        phase: hash2D(55.5 + i, 12.1) * Math.PI * 2,
        strength: 0.07 + hash2D(6.7 + i * 0.1, 91.5) * 0.11,
        radius: 1.3 + hash2D(32.5, 8.2 + i * 1.1) * 1.8
      });
    }
  }

  function seedShiftFields() {
    var i;
    for (i = 0; i < shiftFieldCount; i += 1) {
      shiftFields.push({
        baseX: hash2D(104.2 + i * 1.6, 31.7) * 10,
        baseY: hash2D(42.3, 73.1 + i * 2.1) * 10,
        orbitX: 0.45 + hash2D(8.2 + i * 0.4, 12.7) * 1.2,
        orbitY: 0.45 + hash2D(28.3, 55.2 + i * 0.3) * 1.2,
        speed: 0.07 + hash2D(61.8 + i * 0.2, 29.6) * 0.12,
        phase: hash2D(86.6 + i * 0.1, 91.3) * Math.PI * 2,
        radius: 1.2 + hash2D(15.1, 38.9 + i * 1.5) * 2.4,
        strength: 0.04 + hash2D(77.2 + i * 0.2, 5.4) * 0.08,
        twist: 0.02 + hash2D(63.6, 10.9 + i * 0.7) * 0.05
      });
    }
  }

  function bubbleInfluence(nx, ny, timeSeconds) {
    var drift = timeSeconds * bubbleDriftRate;
    var influence = 0;
    var i;

    for (i = 0; i < bubbles.length; i += 1) {
      var bubble = bubbles[i];
      var phase = bubble.phase + timeSeconds * bubble.speed;
      var centerX = bubble.baseX + drift + Math.cos(phase) * bubble.orbitX;
      var centerY = bubble.baseY + drift * 0.7 + Math.sin(phase * 0.87) * bubble.orbitY;
      var dx = nx - centerX;
      var dy = ny - centerY;
      var radiusSq = bubble.radius * bubble.radius;
      var distanceSq = dx * dx + dy * dy;
      influence += bubble.strength * Math.exp(-distanceSq / (2 * radiusSq));
    }

    return influence;
  }

  function localShiftInfluence(nx, ny, timeSeconds) {
    var drift = timeSeconds * shiftDriftRate;
    var shiftX = 0;
    var shiftY = 0;
    var i;

    for (i = 0; i < shiftFields.length; i += 1) {
      var region = shiftFields[i];
      var phase = region.phase + timeSeconds * region.speed;
      var centerX = region.baseX + drift * 0.8 + Math.cos(phase) * region.orbitX;
      var centerY = region.baseY + drift * 0.6 + Math.sin(phase * 0.91) * region.orbitY;
      var dx = nx - centerX;
      var dy = ny - centerY;
      var radiusSq = region.radius * region.radius;
      var distanceSq = dx * dx + dy * dy;
      var envelope = Math.exp(-distanceSq / (2 * radiusSq));
      var swirlX = -dy * region.twist;
      var swirlY = dx * region.twist;
      shiftX += (Math.cos(phase) * region.strength + swirlX) * envelope;
      shiftY += (Math.sin(phase) * region.strength + swirlY) * envelope;
    }

    return { x: shiftX, y: shiftY };
  }

  function macroWaveInfluence(nx, ny, timeSeconds) {
    var primaryPhase = nx * macroWavePrimaryFrequency + ny * 0.22 + timeSeconds * macroWavePrimarySpeed;
    var secondaryPhase =
      nx * macroWaveSecondaryFrequency - ny * 0.31 - timeSeconds * macroWaveSecondarySpeed + 1.9;
    var tertiaryPhase =
      (nx + ny) * macroWaveTertiaryFrequency + timeSeconds * macroWaveTertiarySpeed + 4.1;
    var primaryBand = Math.sin(primaryPhase) * macroWavePrimaryAmplitude;
    var secondaryBand = Math.sin(secondaryPhase) * macroWaveSecondaryAmplitude;
    var tertiaryBand = Math.sin(tertiaryPhase) * macroWaveTertiaryAmplitude;
    return primaryBand + secondaryBand + tertiaryBand;
  }

  function nextPulseDelay() {
    return 5.6 + Math.random() * 5.8;
  }

  function startPulse(timeSeconds) {
    pulseStartAt = timeSeconds;
    pulseDuration = 2.4 + Math.random() * 1.4;
    pulseAmplitude = 0.014 + Math.random() * 0.022;
    nextPulseAt = timeSeconds + pulseDuration + nextPulseDelay();
  }

  function updatePulseEnvelope(timeSeconds) {
    if (prefersReducedMotion) {
      pulseEnvelope = 0;
      return pulseEnvelope;
    }

    if (timeSeconds >= nextPulseAt) {
      startPulse(timeSeconds);
    }

    if (pulseStartAt < 0) {
      pulseEnvelope = 0;
      return pulseEnvelope;
    }

    var elapsed = timeSeconds - pulseStartAt;
    if (elapsed < 0 || elapsed > pulseDuration) {
      pulseEnvelope = 0;
      return pulseEnvelope;
    }

    var progress = elapsed / pulseDuration;
    pulseEnvelope = Math.sin(progress * Math.PI) * pulseAmplitude;
    return pulseEnvelope;
  }

  function nextBloomDelay() {
    return bloomDelayMinSeconds + Math.random() * (bloomDelayMaxSeconds - bloomDelayMinSeconds);
  }

  function startBloom(timeSeconds) {
    bloomStartAt = timeSeconds;
    bloomDuration =
      bloomDurationMinSeconds + Math.random() * (bloomDurationMaxSeconds - bloomDurationMinSeconds);
    bloomAmplitude = bloomAmplitudeMin + Math.random() * (bloomAmplitudeMax - bloomAmplitudeMin);
    activeBloomColorIndex = Math.floor(Math.random() * bloomPalette.length);
    nextBloomAt = timeSeconds + bloomDuration + nextBloomDelay();
  }

  function mixChannel(baseChannel, bloomChannel, mixAmount) {
    return Math.round(baseChannel + (bloomChannel - baseChannel) * mixAmount);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function buildWordmarkGlitchText(value) {
    var chars = value.split("");
    var mutableIndexes = [];
    var i;

    for (i = 0; i < chars.length; i += 1) {
      if (chars[i] !== " ") {
        mutableIndexes.push(i);
      }
    }
    if (mutableIndexes.length === 0) {
      return value;
    }

    var index = mutableIndexes[Math.floor(Math.random() * mutableIndexes.length)];
    chars[index] = wordmarkGlyphPool.charAt(Math.floor(Math.random() * wordmarkGlyphPool.length));

    return chars.join("");
  }

  function clearWordmarkTimers() {
    if (wordmarkPulseTimer) {
      window.clearTimeout(wordmarkPulseTimer);
      wordmarkPulseTimer = 0;
    }
    if (wordmarkRestoreTimer) {
      window.clearTimeout(wordmarkRestoreTimer);
      wordmarkRestoreTimer = 0;
    }
  }

  function restoreWordmark() {
    if (!siteWordmark) {
      return;
    }
    siteWordmark.textContent = wordmarkBaseText;
    siteWordmark.setAttribute("data-wordmark-glitch", "false");
  }

  function scheduleWordmarkPulse() {
    if (!siteWordmark || isHidden || prefersReducedMotion) {
      return;
    }
    clearWordmarkTimers();
    var wordmarkDelayMs = 2800 + Math.random() * 2600;
    wordmarkPulseTimer = window.setTimeout(function onWordmarkPulse() {
      if (!siteWordmark || isHidden || prefersReducedMotion) {
        restoreWordmark();
        return;
      }
      siteWordmark.setAttribute("data-wordmark-glitch", "true");
      siteWordmark.textContent = buildWordmarkGlitchText(wordmarkBaseText);
      var pulseDuration = 260 + Math.random() * 260;
      wordmarkRestoreTimer = window.setTimeout(function onWordmarkRestore() {
        restoreWordmark();
        scheduleWordmarkPulse();
      }, pulseDuration);
    }, wordmarkDelayMs);
  }

  function updateBloomEnvelope(timeSeconds) {
    if (prefersReducedMotion) {
      bloomEnvelope = 0;
      return bloomEnvelope;
    }

    if (timeSeconds >= nextBloomAt) {
      startBloom(timeSeconds);
    }

    if (bloomStartAt < 0) {
      bloomEnvelope = 0;
      return bloomEnvelope;
    }

    var elapsed = timeSeconds - bloomStartAt;
    if (elapsed < 0 || elapsed > bloomDuration) {
      bloomEnvelope = 0;
      return bloomEnvelope;
    }

    var progress = elapsed / bloomDuration;
    bloomEnvelope = Math.sin(progress * Math.PI) * bloomAmplitude;
    return bloomEnvelope;
  }

  function applyAsciiBloom(timeSeconds) {
    var bloomMix = updateBloomEnvelope(timeSeconds);
    var bloomColor = bloomPalette[activeBloomColorIndex];
    var red = mixChannel(asciiBaseColor.r, bloomColor.r, bloomMix);
    var green = mixChannel(asciiBaseColor.g, bloomColor.g, bloomMix);
    var blue = mixChannel(asciiBaseColor.b, bloomColor.b, bloomMix);
    var alpha = clamp(asciiBaseAlpha + bloomMix * bloomAlphaBoost, asciiBaseAlpha, bloomAlphaMax);
    asciiLayer.style.color = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha.toFixed(3) + ")";
  }

  function getViewportSize() {
    if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
      return {
        width: window.visualViewport.width,
        height: window.visualViewport.height
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  function measureAsciiCell() {
    var probe = document.createElement("span");
    var computed = window.getComputedStyle(asciiLayer);
    probe.textContent = "MMMMMMMMMM";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.pointerEvents = "none";
    probe.style.fontFamily = computed.fontFamily;
    probe.style.fontSize = computed.fontSize;
    probe.style.fontWeight = computed.fontWeight;
    probe.style.fontStyle = computed.fontStyle;
    probe.style.fontVariant = computed.fontVariant;
    probe.style.letterSpacing = computed.letterSpacing;
    probe.style.lineHeight = computed.lineHeight;
    asciiLayer.appendChild(probe);

    var rect = probe.getBoundingClientRect();
    asciiLayer.removeChild(probe);

    var width = rect.width / 10;
    var height = rect.height;
    if (width > 0) {
      measuredCellWidth = width;
    }
    if (height > 0) {
      measuredCellHeight = height;
    }
  }

  function renderAsciiField(timeSeconds) {
    var viewport = getViewportSize();
    var width = Math.max(
      24,
      Math.ceil(viewport.width / measuredCellWidth) + gridOverscanColumns
    );
    var height = Math.max(
      12,
      Math.ceil(viewport.height / measuredCellHeight) + gridOverscanRows
    );
    var scale = 0.08;
    var driftX = timeSeconds * 0.03;
    var driftY = timeSeconds * 0.02;
    var pulse = updatePulseEnvelope(timeSeconds);
    var lines = [];
    var y;
    var x;

    for (y = 0; y < height; y += 1) {
      var line = "";
      for (x = 0; x < width; x += 1) {
        var nx = x * scale + driftX;
        var ny = y * scale + driftY;
        var localShift = localShiftInfluence(nx, ny, timeSeconds);
        var shiftedX = nx + localShift.x;
        var shiftedY = ny + localShift.y;
        var baseField = fractalNoise(shiftedX, shiftedY);
        var bubbleField = bubbleInfluence(shiftedX, shiftedY, timeSeconds);
        var macroWaveField = macroWaveInfluence(shiftedX, shiftedY, timeSeconds);
        var pulseShape = 0.36 + 0.64 * fractalNoise(shiftedX * 0.52 + 12.4, shiftedY * 0.52 + 4.7);
        var field =
          baseField +
          macroWaveField +
          bubbleField * (1 + pulse * 1.5) +
          pulse * (pulseShape * 0.7 + macroWaveField * 0.25);
        line += mapToAscii(field);
      }
      lines.push(line);
    }

    applyAsciiBloom(timeSeconds);
    asciiLayer.textContent = lines.join("\n");
  }

  var resizeTimer;
  function scheduleRender() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function delayedRender() {
      measureAsciiCell();
      renderAsciiField(lastRenderTime);
    }, 120);
  }

  var lastRenderTime = 0;
  var lastFrameMs = 0;
  var frameIntervalMs = 140;
  var hiddenFrameIntervalMs = 900;
  var reducedMotionFrameIntervalMs = 420;
  var isHidden = document.hidden;
  var prefersReducedMotion = false;
  var motionQuery = null;
  var rafId = 0;
  var logoLastFrameMs = 0;
  var logoTargetFps = 36;
  var logoFrameIntervalMs = 1000 / logoTargetFps;
  var logoFrameIndex = 0;
  var logoBaseRowCount = 45;
  var logoBaseColumnCount = 120;
  var logoRowCount = 68;
  var logoColumnCount = 180;
  var logoEdgeRamp = " .,:;i1tfLCG08@";
  var logoShellCoolColor = { r: 66, g: 152, b: 214 };
  var logoShellWarmColor = { r: 180, g: 235, b: 255 };
  var logoShellCoolShiftColor = { r: 66, g: 198, b: 188 };
  var logoShellWarmShiftColor = { r: 206, g: 245, b: 255 };
  var logoHelixCoolColor = { r: 255, g: 132, b: 88 };
  var logoHelixWarmColor = { r: 255, g: 212, b: 132 };
  var logoHelixCoolShiftColor = { r: 255, g: 106, b: 122 };
  var logoHelixWarmShiftColor = { r: 255, g: 232, b: 168 };
  var logoBeatNextFrame = 0;
  var logoBeatStartFrame = -1;
  var logoBeatEndFrame = -1;
  var logoBlinkNextFrame = 0;
  var logoBlinkStartFrame = -1;
  var logoBlinkEndFrame = -1;
  var logoBlinkStrength = 0;
  var logoBeatMode = "seeded";
  var logoConcept = "tunnel";
  var logoShellTemporalBuffer = null;
  var logoHelixTemporalBuffer = null;

  function fract(value) {
    return value - Math.floor(value);
  }

  function seededUnit(seed) {
    return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453123);
  }

  function pickLogoBeatRandom(seed) {
    if (logoBeatMode === "random") {
      return Math.random();
    }
    return seededUnit(seed);
  }

  function resolveLogoBeatMode() {
    var mode = "";
    if (root) {
      mode = (root.getAttribute("data-logo-beat-mode") || "").toLowerCase();
    }
    if (!mode) {
      var queryMode = "";
      try {
        queryMode = new URLSearchParams(window.location.search).get("logoBeat") || "";
      } catch (error) {
        queryMode = "";
      }
      mode = queryMode.toLowerCase();
    }
    if (mode === "random" || mode === "seeded") {
      logoBeatMode = mode;
    }
  }

  function resolveLogoConcept() {
    var concept = "";
    if (root) {
      concept = (root.getAttribute("data-logo-concept") || "").toLowerCase();
    }
    if (!concept) {
      var queryConcept = "";
      try {
        queryConcept = new URLSearchParams(window.location.search).get("logoConcept") || "";
      } catch (error) {
        queryConcept = "";
      }
      concept = queryConcept.toLowerCase();
    }
    if (concept === "star" || concept === "wave" || concept === "tunnel" || concept === "eclipse") {
      logoConcept = concept;
    }
  }

  function syncProjectLogoVisualScale() {
    if (!projectsLogoContainer) {
      return;
    }
    var rowScale = logoBaseRowCount / Math.max(1, logoRowCount);
    var columnScale = logoBaseColumnCount / Math.max(1, logoColumnCount);
    var visualScale = clamp(Math.min(rowScale, columnScale), 0.5, 1.25);
    projectsLogoContainer.style.setProperty("--projects-logo-size-scale", visualScale.toFixed(4));
  }

  function mixColor(colorA, colorB, amount) {
    return {
      r: mixChannel(colorA.r, colorB.r, amount),
      g: mixChannel(colorA.g, colorB.g, amount),
      b: mixChannel(colorA.b, colorB.b, amount)
    };
  }

  function ensureLogoTemporalBuffers() {
    var expectedSize = logoRowCount * logoColumnCount;
    if (!logoShellTemporalBuffer || logoShellTemporalBuffer.length !== expectedSize) {
      logoShellTemporalBuffer = new Float32Array(expectedSize);
    }
    if (!logoHelixTemporalBuffer || logoHelixTemporalBuffer.length !== expectedSize) {
      logoHelixTemporalBuffer = new Float32Array(expectedSize);
    }
  }

  function scheduleNextLogoBeat(frameIndex) {
    var minGapFrames = Math.round(10000 / logoFrameIntervalMs);
    var maxGapFrames = Math.round(15000 / logoFrameIntervalMs);
    var gapSeed = frameIndex * 0.013 + logoBeatNextFrame * 0.007 + 17.1;
    var gapFrames =
      minGapFrames + Math.floor(pickLogoBeatRandom(gapSeed) * (maxGapFrames - minGapFrames + 1));
    logoBeatNextFrame = frameIndex + gapFrames;
  }

  function logoBeatEnvelope(frameIndex) {
    if (logoBeatNextFrame === 0) {
      scheduleNextLogoBeat(frameIndex);
    }

    if (logoBeatStartFrame < 0 && frameIndex >= logoBeatNextFrame) {
      var minDurationFrames = Math.round(1500 / logoFrameIntervalMs);
      var maxDurationFrames = Math.round(2600 / logoFrameIntervalMs);
      var durationSeed = frameIndex * 0.019 + logoBeatNextFrame * 0.011 + 41.7;
      var durationFrames =
        minDurationFrames +
        Math.floor(pickLogoBeatRandom(durationSeed) * (maxDurationFrames - minDurationFrames + 1));
      logoBeatStartFrame = frameIndex;
      logoBeatEndFrame = frameIndex + durationFrames;
      scheduleNextLogoBeat(logoBeatEndFrame);
    }

    if (logoBeatStartFrame < 0 || frameIndex > logoBeatEndFrame) {
      if (frameIndex > logoBeatEndFrame) {
        logoBeatStartFrame = -1;
        logoBeatEndFrame = -1;
      }
      return 0;
    }

    var progress = (frameIndex - logoBeatStartFrame) / Math.max(1, logoBeatEndFrame - logoBeatStartFrame);
    return Math.sin(progress * Math.PI);
  }

  function scheduleNextLogoBlink(frameIndex) {
    var minGapFrames = Math.round(5000 / logoFrameIntervalMs);
    var maxGapFrames = Math.round(10000 / logoFrameIntervalMs);
    var gapSeed = frameIndex * 0.017 + logoBlinkNextFrame * 0.009 + 61.4;
    var gapFrames =
      minGapFrames + Math.floor(pickLogoBeatRandom(gapSeed) * (maxGapFrames - minGapFrames + 1));
    logoBlinkNextFrame = frameIndex + gapFrames;
  }

  function logoBlinkEnvelope(frameIndex) {
    if (logoBlinkNextFrame === 0) {
      scheduleNextLogoBlink(frameIndex);
    }

    if (logoBlinkStartFrame < 0 && frameIndex >= logoBlinkNextFrame) {
      var minDurationFrames = Math.max(3, Math.round(240 / logoFrameIntervalMs));
      var maxDurationFrames = Math.max(minDurationFrames + 1, Math.round(420 / logoFrameIntervalMs));
      var durationSeed = frameIndex * 0.023 + logoBlinkNextFrame * 0.013 + 83.9;
      var durationFrames =
        minDurationFrames +
        Math.floor(pickLogoBeatRandom(durationSeed) * (maxDurationFrames - minDurationFrames + 1));
      logoBlinkStartFrame = frameIndex;
      logoBlinkEndFrame = frameIndex + durationFrames;
      scheduleNextLogoBlink(logoBlinkEndFrame);
    }

    if (logoBlinkStartFrame < 0 || frameIndex > logoBlinkEndFrame) {
      if (frameIndex > logoBlinkEndFrame) {
        logoBlinkStartFrame = -1;
        logoBlinkEndFrame = -1;
      }
      return 0;
    }

    var progress = (frameIndex - logoBlinkStartFrame) / Math.max(1, logoBlinkEndFrame - logoBlinkStartFrame);
    return Math.sin(progress * Math.PI);
  }

  function applyProjectLogoLayerTone(layer, frameIndex, nearRatio, beatStrength, coolColor, warmColor, settings) {
    if (!layer) {
      return;
    }

    var phase = frameIndex * 0.014;
    var nearMix = clamp(0.48 + nearRatio * settings.nearGain + Math.sin(phase * 0.5) * settings.wave, 0, 1);
    var red = mixChannel(coolColor.r, warmColor.r, nearMix);
    var green = mixChannel(coolColor.g, warmColor.g, nearMix);
    var blue = mixChannel(coolColor.b, warmColor.b, nearMix);
    var alpha = settings.alphaBase + nearMix * settings.alphaNear + beatStrength * settings.alphaBeat;
    var brightness = settings.brightnessBase + nearMix * settings.brightnessNear + beatStrength * settings.brightnessBeat;
    var contrast = settings.contrastBase + nearMix * settings.contrastNear + beatStrength * settings.contrastBeat;
    var saturation = settings.saturationBase + nearMix * settings.saturationNear + beatStrength * settings.saturationBeat;
    var whiteShimmerStrength = settings.whiteShimmerStrength || 0;
    var whiteShimmerRate = settings.whiteShimmerRate || 1;
    var whiteShimmerThreshold = settings.whiteShimmerThreshold || 0.96;
    var whiteShimmerPhase = (Math.sin(phase * 8.1 * whiteShimmerRate + nearRatio * 10.7) + 1) * 0.5;
    var whiteShimmerGate = clamp((whiteShimmerPhase - whiteShimmerThreshold) / Math.max(0.0001, 1 - whiteShimmerThreshold), 0, 1);
    var whiteShimmer = whiteShimmerStrength * whiteShimmerGate * (0.85 + beatStrength * 0.55);
    brightness += whiteShimmer * 0.18;
    contrast += whiteShimmer * 0.12;
    var coolShadowBlur = settings.coolShadowBase + beatStrength * settings.coolShadowBeat;
    var warmShadowBlur = settings.warmShadowBase + beatStrength * settings.warmShadowBeat;
    var whiteShadowBlur = (settings.whiteShadowBase || 0) + whiteShimmer * (settings.whiteShadowBoost || 0);
    layer.style.color = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha.toFixed(3) + ")";
    layer.style.opacity = alpha.toFixed(3);
    layer.style.filter =
      "saturate(" +
      saturation.toFixed(3) +
      ") contrast(" +
      contrast.toFixed(3) +
      ") brightness(" +
      brightness.toFixed(3) +
      ")";
    layer.style.textShadow =
      "0 0 " +
      coolShadowBlur.toFixed(1) +
      "px rgba(" +
      coolColor.r +
      ", " +
      coolColor.g +
      ", " +
      coolColor.b +
      ", " +
      settings.coolShadowAlpha +
      "), 0 0 " +
      warmShadowBlur.toFixed(1) +
      "px rgba(" +
      warmColor.r +
      ", " +
      warmColor.g +
      ", " +
      warmColor.b +
      ", " +
      settings.warmShadowAlpha +
      "), 0 0 " +
      whiteShadowBlur.toFixed(1) +
      "px rgba(255, 255, 255, " +
      whiteShimmer.toFixed(3) +
      ")";
  }

  function applyProjectLogoTone(frameIndex, shellNearRatio, helixNearRatio, beatStrength) {
    var elapsedSeconds = (frameIndex * logoFrameIntervalMs) / 1000;
    var shellPaletteShift = (Math.sin(elapsedSeconds * 0.14) + 1) * 0.5;
    var helixPaletteShift = (Math.sin(elapsedSeconds * 0.14 + Math.PI) + 1) * 0.5;
    var shellDepthShift = clamp(shellNearRatio * 0.55, 0, 1);
    var helixDepthShift = clamp(helixNearRatio * 0.62, 0, 1);
    shellPaletteShift = clamp(shellPaletteShift * 0.65 + shellDepthShift * 0.35, 0, 1);
    helixPaletteShift = clamp(helixPaletteShift * 0.6 + helixDepthShift * 0.4, 0, 1);
    var shellCoolColor = mixColor(logoShellCoolColor, logoShellCoolShiftColor, shellPaletteShift);
    var shellWarmColor = mixColor(logoShellWarmColor, logoShellWarmShiftColor, shellPaletteShift);
    var helixCoolColor = mixColor(logoHelixCoolColor, logoHelixCoolShiftColor, helixPaletteShift);
    var helixWarmColor = mixColor(logoHelixWarmColor, logoHelixWarmShiftColor, helixPaletteShift);
    var shellContrastLift = 0.05 + shellNearRatio * 0.05;
    var helixContrastLift = 0.08 + helixNearRatio * 0.06;
    var shellBrightnessLift = 0;
    var helixBrightnessLift = 0;
    var shellSettings = {
      nearGain: 0.42,
      wave: 0.06,
      alphaBase: 0.78,
      alphaNear: 0.08,
      alphaBeat: 0.05,
      brightnessBase: 1.02 + shellBrightnessLift,
      brightnessNear: 0.05,
      brightnessBeat: 0.05,
      contrastBase: 1.18 + shellContrastLift,
      contrastNear: 0.1,
      contrastBeat: 0.05,
      saturationBase: 1.12,
      saturationNear: 0.08,
      saturationBeat: 0.05,
      coolShadowBase: 5.5,
      coolShadowBeat: 3,
      warmShadowBase: 2.5,
      warmShadowBeat: 2.5,
      coolShadowAlpha: "0.18",
      warmShadowAlpha: "0.2"
    };
    var helixSettings = {
      nearGain: 0.48,
      wave: 0.08,
      alphaBase: 0.72,
      alphaNear: 0.14,
      alphaBeat: 0.08,
      brightnessBase: 1.04 + helixBrightnessLift,
      brightnessNear: 0.07,
      brightnessBeat: 0.07,
      contrastBase: 1.2 + helixContrastLift,
      contrastNear: 0.09,
      contrastBeat: 0.04,
      saturationBase: 1.34,
      saturationNear: 0.14,
      saturationBeat: 0.08,
      coolShadowBase: 3.8,
      coolShadowBeat: 2.2,
      warmShadowBase: 2.1,
      warmShadowBeat: 1.8,
      coolShadowAlpha: "0.24",
      warmShadowAlpha: "0.25"
    };
    if (logoConcept === "wave") {
      shellCoolColor = mixColor(shellCoolColor, { r: 82, g: 150, b: 255 }, 0.4);
      shellWarmColor = mixColor(shellWarmColor, { r: 176, g: 232, b: 255 }, 0.35);
      helixCoolColor = mixColor(helixCoolColor, { r: 255, g: 116, b: 80 }, 0.45);
      helixWarmColor = mixColor(helixWarmColor, { r: 255, g: 221, b: 122 }, 0.42);
      shellSettings.contrastBase += 0.08;
      shellSettings.saturationBase -= 0.05;
      shellSettings.brightnessBase -= 0.01;
      helixSettings.contrastBase += 0.13;
      helixSettings.saturationBase += 0.2;
      helixSettings.brightnessBase += 0.03;
      helixSettings.alphaBase += 0.02;
    } else if (logoConcept === "eclipse") {
      var eclipseBreath = (Math.sin(elapsedSeconds * 0.27) + 1) * 0.5;
      shellCoolColor = mixColor(shellCoolColor, { r: 120, g: 190, b: 255 }, 0.34 + eclipseBreath * 0.18);
      shellWarmColor = mixColor(shellWarmColor, { r: 232, g: 246, b: 255 }, 0.3 + eclipseBreath * 0.16);
      helixCoolColor = mixColor(helixCoolColor, { r: 255, g: 160, b: 104 }, 0.28 + eclipseBreath * 0.18);
      helixWarmColor = mixColor(helixWarmColor, { r: 255, g: 228, b: 166 }, 0.34 + eclipseBreath * 0.2);
      shellSettings.wave += 0.03;
      helixSettings.wave += 0.05;
      shellSettings.alphaBeat += 0.03;
      helixSettings.alphaBeat += 0.04;
      shellSettings.contrastBase += 0.06;
      helixSettings.contrastBase += 0.08;
      shellSettings.saturationBase += 0.03;
      helixSettings.saturationBase += 0.08;
      shellSettings.coolShadowBase += 1.8;
      helixSettings.coolShadowBase += 2.1;
      helixSettings.warmShadowBase += 1.2;
      shellSettings.whiteShimmerStrength = 0.14;
      helixSettings.whiteShimmerStrength = 0.2;
      shellSettings.whiteShimmerRate = 0.86;
      helixSettings.whiteShimmerRate = 1.02;
      shellSettings.whiteShimmerThreshold = 0.978;
      helixSettings.whiteShimmerThreshold = 0.974;
      shellSettings.whiteShadowBase = 0.5;
      helixSettings.whiteShadowBase = 0.9;
      shellSettings.whiteShadowBoost = 5.2;
      helixSettings.whiteShadowBoost = 7.1;
    } else if (logoConcept === "tunnel") {
      var tunnelShellBreath = (Math.sin(elapsedSeconds * 0.33) + 1) * 0.5;
      var tunnelHelixBreath = (Math.sin(elapsedSeconds * 0.33 + Math.PI * 0.85) + 1) * 0.5;
      var shellBreathMix = 0.14 + tunnelShellBreath * 0.2;
      var helixBreathMix = 0.13 + tunnelHelixBreath * 0.22;
      shellCoolColor = mixColor(shellCoolColor, { r: 88, g: 166, b: 244 }, shellBreathMix);
      shellWarmColor = mixColor(shellWarmColor, { r: 165, g: 223, b: 255 }, shellBreathMix * 0.94);
      helixCoolColor = mixColor(helixCoolColor, { r: 255, g: 124, b: 92 }, helixBreathMix);
      helixWarmColor = mixColor(helixWarmColor, { r: 255, g: 214, b: 142 }, helixBreathMix * 0.92);
      shellSettings.saturationBase += 0.08 + tunnelShellBreath * 0.1;
      helixSettings.saturationBase += 0.1 + tunnelHelixBreath * 0.12;
      shellSettings.brightnessBase += tunnelShellBreath * 0.026;
      helixSettings.brightnessBase += tunnelHelixBreath * 0.032;
      shellSettings.wave += 0.04;
      helixSettings.wave += 0.06;
      shellSettings.alphaBeat += 0.05;
      helixSettings.alphaBeat += 0.08;
      shellSettings.brightnessBeat += 0.07;
      helixSettings.brightnessBeat += 0.11;
      shellSettings.contrastBeat += 0.08;
      helixSettings.contrastBeat += 0.12;
      shellSettings.saturationBeat += 0.08;
      helixSettings.saturationBeat += 0.14;
      shellSettings.coolShadowBase += 2.4;
      shellSettings.coolShadowBeat += 2.2;
      helixSettings.coolShadowBase += 3.2;
      helixSettings.coolShadowBeat += 3.2;
      helixSettings.warmShadowBase += 1.8;
      helixSettings.warmShadowBeat += 2;
      shellSettings.coolShadowAlpha = "0.31";
      shellSettings.warmShadowAlpha = "0.34";
      helixSettings.coolShadowAlpha = "0.39";
      helixSettings.warmShadowAlpha = "0.41";
      shellSettings.whiteShimmerStrength = 0.22;
      helixSettings.whiteShimmerStrength = 0.3;
      shellSettings.whiteShimmerRate = 0.92;
      helixSettings.whiteShimmerRate = 1.14;
      shellSettings.whiteShimmerThreshold = 0.972;
      helixSettings.whiteShimmerThreshold = 0.968;
      shellSettings.whiteShadowBase = 0.8;
      helixSettings.whiteShadowBase = 1.2;
      shellSettings.whiteShadowBoost = 7.5;
      helixSettings.whiteShadowBoost = 9.8;
      shellSettings.alphaBase -= logoBlinkStrength * 0.2;
      helixSettings.alphaBase -= logoBlinkStrength * 0.24;
      shellSettings.brightnessBase -= logoBlinkStrength * 0.24;
      helixSettings.brightnessBase -= logoBlinkStrength * 0.28;
      shellSettings.contrastBase += logoBlinkStrength * 0.1;
      helixSettings.contrastBase += logoBlinkStrength * 0.13;
      shellSettings.whiteShimmerStrength += logoBlinkStrength * 0.15;
      helixSettings.whiteShimmerStrength += logoBlinkStrength * 0.2;
    }
    applyProjectLogoLayerTone(
      projectsLogoShell || projectsLogoFallback,
      frameIndex,
      shellNearRatio,
      beatStrength,
      shellCoolColor,
      shellWarmColor,
      shellSettings
    );
    applyProjectLogoLayerTone(
      projectsLogoHelix,
      frameIndex,
      helixNearRatio,
      beatStrength,
      helixCoolColor,
      helixWarmColor,
      helixSettings
    );
  }

  function mapLogoDensity(density) {
    var clamped = clamp(density, 0, 1);
    var index = Math.floor(clamped * (logoEdgeRamp.length - 1));
    return logoEdgeRamp.charAt(index);
  }

  function renderProjectLogoFrame(frameIndex) {
    if (!projectsLogoShell && !projectsLogoFallback && !projectsLogoHelix) {
      return;
    }
    ensureLogoTemporalBuffers();

    var shellLines = [];
    var helixLines = [];
    var fallbackLines = [];
    var t = frameIndex * 0.036;
    var elapsedSeconds = (frameIndex * logoFrameIntervalMs) / 1000;
    var triangleCycleSeconds = 120;
    var trianglePhase = (elapsedSeconds % triangleCycleSeconds) / triangleCycleSeconds;
    var triangleBlend = (1 + Math.cos(trianglePhase * Math.PI * 2)) * 0.5;
    var driftX = Math.sin(t * 0.5) * 0.042;
    var driftY = Math.cos(t * 0.37) * 0.032;
    var wobble = Math.sin(t * 0.31) * 0.11;
    var cosWobble = Math.cos(wobble);
    var sinWobble = Math.sin(wobble);
    var beat = logoBeatEnvelope(frameIndex);
    logoBlinkStrength = logoConcept === "tunnel" ? logoBlinkEnvelope(frameIndex) : 0;
    var shellNearEnergy = 0;
    var shellTotalEnergy = 0;
    var helixNearEnergy = 0;
    var helixTotalEnergy = 0;
    var row;
    var column;

    for (row = 0; row < logoRowCount; row += 1) {
      var y = ((row + 0.5) / logoRowCount) * 2 - 1;
      var shellLine = "";
      var helixLine = "";
      var fallbackLine = "";

      for (column = 0; column < logoColumnCount; column += 1) {
        var logoBufferIndex = row * logoColumnCount + column;
        var x = ((column + 0.5) / logoColumnCount) * 2 - 1;
        var px = x * 1.08 + driftX;
        var py = y * 0.92 + driftY;
        var pseudoZ = Math.sin(px * 2.1 - t * 0.42) * 0.06 + Math.cos(py * 2.6 + t * 0.31) * 0.05;
        var nx = px * cosWobble - py * sinWobble;
        var ny = px * sinWobble + py * cosWobble;
        var zoomOut = 1.28;
        nx *= zoomOut;
        ny *= zoomOut;
        var depthPerspective = 1 / (1 + Math.max(-0.32, Math.min(0.32, nx * 0.22 + ny * 0.14 + pseudoZ * 0.8)));
        nx *= depthPerspective * (1 + pseudoZ * 0.12);
        ny *= depthPerspective * (1 + pseudoZ * 0.08);
        var distance = Math.sqrt(nx * nx + ny * ny);
        var angle = Math.atan2(ny, nx);
        var spin = t * 0.16;
        var shell = 0;
        var shellDepth = 0;
        var depthA = 0;
        var depthB = 0;
        var helixSignalA = 0;
        var helixSignalB = 0;
        var helixSignalC = 0;
        var spokes = 0;
        var rungs = 0;
        if (logoConcept === "star") {
          var facetHex = Math.cos((angle + spin) * 6);
          var facetTri = Math.cos((angle + spin * 0.9) * 3 + Math.PI / 12);
          var facet = (facetHex * (1 - triangleBlend) + facetTri * triangleBlend) * (0.18 - Math.abs(ny) * 0.04);
          var outer =
            0.8 +
            facet +
            Math.sin((angle - spin * 0.58) * (3 + triangleBlend * 0.7)) * (0.042 - triangleBlend * 0.01);
          var innerHex = Math.cos((angle + spin) * 6 + Math.PI / 6) * 0.034;
          var innerTri = Math.cos((angle + spin * 0.9) * 3 + Math.PI / 10) * 0.042;
          var inner = 0.25 + innerHex * (1 - triangleBlend) + innerTri * triangleBlend;
          shell =
            clamp((outer - distance) / 0.055, 0, 1) *
            clamp((distance - inner) / 0.052, 0, 1);
          shellDepth = (Math.cos(angle * 3 - t * 0.8) + 1) * 0.5;
          var helixPhase = ny * 12.1 - t * 1.18;
          var strandRadius = 0.44 * (1 - Math.abs(ny) * 0.24);
          var strandA = Math.sin(helixPhase) * strandRadius;
          var strandB = Math.sin(helixPhase + Math.PI) * strandRadius;
          depthA = (Math.cos(helixPhase) + 1) * 0.5;
          depthB = (Math.cos(helixPhase + Math.PI) + 1) * 0.5;
          var strandWidth = 0.05 + Math.abs(ny) * 0.015;
          helixSignalA = clamp(1 - Math.abs(nx - strandA) / strandWidth, 0, 1) * (0.56 + depthA * 0.44);
          helixSignalB = clamp(1 - Math.abs(nx - strandB) / strandWidth, 0, 1) * (0.56 + depthB * 0.44);
          var rungGate = clamp(1 - Math.abs(Math.sin(ny * 32 + t * 1.9)) / 0.26, 0, 1);
          var rungSpan = Math.abs(strandA - strandB) * 0.5 + 0.03;
          rungs = rungGate * clamp(1 - Math.abs(nx) / rungSpan, 0, 1) * 0.44;
          spokes =
            clamp(1 - Math.abs(Math.sin((angle + spin) * 9 - distance * 7.8)) / 0.25, 0, 1) *
            clamp((outer - distance) / 0.13, 0, 1) *
            0.23;
        } else if (logoConcept === "wave") {
          var coreAX = Math.sin(t * 0.21) * 0.34;
          var coreAY = Math.cos(t * 0.17) * 0.22;
          var coreBX = Math.cos(t * 0.19 + 1.3) * 0.31;
          var coreBY = Math.sin(t * 0.23 + 0.7) * 0.2;
          var dxA = nx - coreAX;
          var dyA = ny - coreAY;
          var dxB = nx - coreBX;
          var dyB = ny - coreBY;
          var distA = Math.sqrt(dxA * dxA + dyA * dyA);
          var distB = Math.sqrt(dxB * dxB + dyB * dyB);
          var angleA = Math.atan2(dyA, dxA);
          var angleB = Math.atan2(dyB, dxB);
          var coreDX = coreBX - coreAX;
          var coreDY = coreBY - coreAY;
          var coreDistance = Math.sqrt(coreDX * coreDX + coreDY * coreDY);
          var coupling = clamp(1 - Math.abs(distA - distB) / (0.22 + coreDistance * 0.32), 0, 1);
          var phaseBias = Math.sin((angleA - angleB) * 2.5 + t * 0.58) * 0.04;
          var distAField = Math.max(0, distA + phaseBias * (0.6 + coupling * 0.5));
          var distBField = Math.max(0, distB - phaseBias * (0.6 + coupling * 0.5));

          var sailRingA =
            clamp((0.32 + Math.sin(t * 0.41) * 0.04 - distAField) / 0.06, 0, 1) *
            clamp((distAField - 0.15) / 0.08, 0, 1);
          var sailRingB =
            clamp((0.3 + Math.cos(t * 0.37) * 0.045 - distBField) / 0.06, 0, 1) *
            clamp((distBField - 0.14) / 0.08, 0, 1);
          var petalA =
            clamp(1 - Math.abs(Math.sin(angleA * 5 + distAField * 8 - t * 0.58)) / 0.34, 0, 1) *
            clamp((0.75 - distAField) / 0.42, 0, 1) *
            0.55;
          var petalB =
            clamp(1 - Math.abs(Math.sin(angleB * 6 + distBField * 7 + t * 0.52)) / 0.33, 0, 1) *
            clamp((0.72 - distBField) / 0.4, 0, 1) *
            0.52;

          var bridgeMidX = (coreAX + coreBX) * 0.5;
          var bridgeMidY = (coreAY + coreBY) * 0.5;
          var bridgeVX = coreBX - coreAX;
          var bridgeVY = coreBY - coreAY;
          var bridgeLen = Math.sqrt(bridgeVX * bridgeVX + bridgeVY * bridgeVY);
          var invBridgeLen = bridgeLen > 0.0001 ? 1 / bridgeLen : 1;
          var ux = bridgeVX * invBridgeLen;
          var uy = bridgeVY * invBridgeLen;
          var px = nx - bridgeMidX;
          var py = ny - bridgeMidY;
          var proj = px * ux + py * uy;
          var ortho = -px * uy + py * ux;
          var bridgeFlux = 0.5 + Math.sin(proj * 10 - t * 1.18 + coreDistance * 3.2) * 0.5;
          var bridgeBand =
            clamp(1 - Math.abs(ortho) / 0.085, 0, 1) *
            clamp(1 - Math.abs(proj) / 0.68, 0, 1) *
            (0.42 + Math.sin((proj + 0.7) * 8 - t * 0.74) * 0.14 + bridgeFlux * 0.25);

          var auraGlow = clamp((0.95 - Math.min(distA, distB)) / 0.6, 0, 1) * 0.2;
          var interactionRibbon =
            clamp(1 - Math.abs(ortho) / 0.06, 0, 1) *
            clamp((0.72 - Math.abs(proj)) / 0.72, 0, 1) *
            coupling *
            (0.35 + bridgeFlux * 0.35);
          shell = clamp(
            sailRingA * 0.76 + sailRingB * 0.74 + petalA + petalB + bridgeBand * 0.64 + interactionRibbon + auraGlow,
            0,
            1
          );
          shellDepth = clamp(
            0.34 +
              (1 - Math.min(distAField, distBField)) * 0.4 +
              Math.sin((distAField + distBField) * 7 - t * 0.5) * 0.14 +
              coupling * 0.12 +
              clamp(ortho * 0.5, -0.12, 0.12),
            0,
            1
          );

          var swarmPhase = t * 0.68;
          var orbitA =
            clamp(1 - Math.abs(distAField - (0.48 + Math.sin(swarmPhase * 1.2) * 0.04)) / 0.038, 0, 1) *
            clamp(1 - Math.abs(Math.sin(angleA - swarmPhase * 1.9)) / 0.25, 0, 1);
          var orbitB =
            clamp(1 - Math.abs(distBField - (0.46 + Math.cos(swarmPhase * 1.35) * 0.04)) / 0.037, 0, 1) *
            clamp(1 - Math.abs(Math.sin(angleB + swarmPhase * 1.6 + Math.PI / 3)) / 0.25, 0, 1);
          var midDist = Math.sqrt(px * px + py * py);
          var midAng = Math.atan2(py, px);
          var orbitMid =
            clamp(1 - Math.abs(midDist - (0.34 + Math.sin(swarmPhase * 1.5) * 0.05)) / 0.04, 0, 1) *
            clamp(1 - Math.abs(Math.sin(midAng - swarmPhase * 2.2)) / 0.27, 0, 1);

          var separationGate = clamp(1 - shell * 0.86 + coupling * 0.18, 0.16, 1);
          helixSignalA = orbitA * (0.54 + Math.cos(swarmPhase + distAField * 9) * 0.22) * separationGate;
          helixSignalB = orbitB * (0.52 + Math.sin(swarmPhase * 0.9 + distBField * 8) * 0.22) * separationGate;
          helixSignalC = orbitMid * (0.48 + Math.sin(swarmPhase * 1.1 + midDist * 10) * 0.24) * separationGate;

          rungs = 0;
          spokes =
            clamp(1 - Math.abs(Math.sin((angleA + angleB) * 4 - t * 0.36)) / 0.32, 0, 1) *
            clamp((0.9 - Math.min(distA, distB)) / 0.5, 0, 1) *
            0.14;

          depthA = clamp(0.3 + (1 - distAField) * 0.44 + Math.cos(angleA * 2 - t * 0.3) * 0.14 + coupling * 0.08, 0, 1);
          depthB = clamp(0.32 + (1 - distBField) * 0.46 + Math.sin(angleB * 2 + t * 0.28) * 0.14 + coupling * 0.08, 0, 1);
        } else if (logoConcept === "tunnel") {
          var tunnelPhase = t * 0.74;
          var blinkAperture = 0.94 - logoBlinkStrength * 0.82;
          var eyelidMask = 1 - clamp((Math.abs(ny) - blinkAperture) / Math.max(0.02, 1 - blinkAperture), 0, 1);
          var tunnelDensityBoost = 1.12;
          var wallBand = clamp((0.94 - distance) / 0.56, 0, 1) * clamp((distance - 0.12) / 0.16, 0, 1);
          var centerPortal = clamp((0.165 - distance) / 0.09, 0, 1);
          var depthTrack = tunnelPhase * 1.8 - distance * 15.2;
          var ribsField = clamp(1 - Math.abs(Math.sin(depthTrack + Math.sin(angle * 2.4) * 0.7)) / 0.26, 0, 1);
          var spiralFieldA = clamp(1 - Math.abs(Math.sin(angle * 3.6 + depthTrack * 0.92)) / 0.18, 0, 1);
          var spiralFieldB = clamp(1 - Math.abs(Math.sin(angle * 3.1 - depthTrack * 0.87 + Math.PI / 2.6)) / 0.19, 0, 1);
          var spinField = clamp(1 - Math.abs(Math.sin(angle * 11.5 + depthTrack * 0.62)) / 0.24, 0, 1);
          var flowPulse = 0.64 + (Math.sin(t * 1.18 - distance * 13.8) * 0.5 + 0.5) * 0.56;
          var perspective = clamp(1 / (0.22 + distance * 1.8), 0, 1);
          var portalLip = clamp(1 - Math.abs(distance - 0.19) / 0.055, 0, 1);
          var radialGate = clamp((distance - 0.17) / 0.22, 0, 1) * clamp((0.78 - distance) / 0.52, 0, 1);
          var sprayField =
            clamp(1 - Math.abs(Math.sin(angle * 17.2 + depthTrack * 1.4 + Math.sin(depthTrack * 0.21) * 1.1)) / 0.16, 0, 1) *
            portalLip *
            (0.68 + flowPulse * 0.46);
          var sprayNoise = fractalNoise(column * 0.31 + frameIndex * 0.15, row * 0.27 - frameIndex * 0.11);
          var sprayGate = clamp((sprayNoise - 0.53) / 0.31, 0, 1);
          var portalSpray = sprayField * sprayGate;
          var wakeDust =
            clamp(1 - Math.abs(Math.sin(angle * 6.3 - depthTrack * 1.1 + sprayNoise * 2.4)) / 0.22, 0, 1) *
            radialGate *
            0.5;
          var portalSparkle =
            clamp(1 - Math.abs(Math.sin(angle * 23.5 + depthTrack * 2.6 + sprayNoise * 4.3)) / 0.085, 0, 1) *
            portalLip *
            clamp((sprayNoise - 0.7) / 0.22, 0, 1);
          var blinkEdge =
            clamp(1 - Math.abs(Math.abs(ny) - blinkAperture) / 0.03, 0, 1) *
            clamp((0.62 - distance) / 0.46, 0, 1) *
            logoBlinkStrength;

          shell = clamp(
            (wallBand * (0.34 + ribsField * 0.42 + spinField * 0.22) + (spiralFieldA + spiralFieldB) * 0.18 + wakeDust * 0.22) *
              (1 - centerPortal * 0.94),
            0,
            1
          );
          shell = clamp(shell * tunnelDensityBoost, 0, 1);
          shellDepth = clamp(0.22 + perspective * 0.56 + ribsField * 0.15 - centerPortal * 0.2, 0, 1);

          helixSignalA = spiralFieldA * wallBand * (0.42 + flowPulse * 0.46);
          helixSignalB = spiralFieldB * wallBand * (0.4 + (1 - flowPulse * 0.7) * 0.5);
          helixSignalC =
            spinField *
            clamp((0.7 - distance) / 0.62, 0, 1) *
            clamp((distance - 0.16) / 0.16, 0, 1) *
            (0.34 + flowPulse * 0.24);
          helixSignalA += portalSpray * 0.5;
          helixSignalB += portalSpray * 0.42;
          helixSignalC += portalSpray * 0.56 + wakeDust * 0.24 + portalSparkle * 0.74;
          rungs = ribsField * wallBand * (0.22 + flowPulse * 0.18) + wakeDust * 0.2;
          spokes = spinField * wallBand * 0.22 + portalSpray * 0.18 + portalSparkle * 0.22 + blinkEdge * 0.45;
          helixSignalA *= tunnelDensityBoost * 1.02;
          helixSignalB *= tunnelDensityBoost * 1.01;
          helixSignalC *= tunnelDensityBoost * 1.03;
          rungs *= tunnelDensityBoost;
          spokes *= tunnelDensityBoost * 0.98;
          shell *= eyelidMask;
          helixSignalA *= eyelidMask;
          helixSignalB *= eyelidMask;
          helixSignalC *= eyelidMask;
          rungs *= eyelidMask;
          spokes *= 0.62 + eyelidMask * 0.38;
          depthA = clamp(0.26 + perspective * 0.54 + spiralFieldA * 0.18 - centerPortal * 0.16, 0, 1);
          depthB = clamp(0.24 + perspective * 0.56 + spiralFieldB * 0.18 - centerPortal * 0.16, 0, 1);

        } else {
          var eclipsePhase = t * 0.58;
          var coreX = Math.sin(eclipsePhase * 0.47) * 0.085;
          var coreY = Math.cos(eclipsePhase * 0.39) * 0.06;
          var ex = nx - coreX;
          var ey = ny - coreY;
          var coreR = Math.sqrt(ex * ex + ey * ey);
          var coreA = Math.atan2(ey, ex);
          var umbraX = ex - Math.cos(eclipsePhase * 0.9) * 0.125;
          var umbraY = ey - Math.sin(eclipsePhase * 0.74) * 0.072;
          var umbraR = Math.sqrt(umbraX * umbraX + umbraY * umbraY);
          var coronaRing = clamp((0.62 - coreR) / 0.11, 0, 1) * clamp((coreR - 0.22) / 0.08, 0, 1);
          var coronaRipple = clamp(1 - Math.abs(Math.sin(coreA * 9.5 + coreR * 12 - eclipsePhase * 1.7)) / 0.22, 0, 1);
          var flareJets =
            clamp(1 - Math.abs(Math.sin(coreA * 6.1 - eclipsePhase * 1.5 + coreR * 7.2)) / 0.2, 0, 1) *
            clamp((0.82 - coreR) / 0.56, 0, 1);
          var innerGlow = clamp((0.28 - coreR) / 0.14, 0, 1);
          var eclipseBite = clamp((0.3 - umbraR) / 0.09, 0, 1);
          var penumbra = clamp((0.44 - umbraR) / 0.18, 0, 1);
          var orbitDust =
            clamp(1 - Math.abs(coreR - (0.45 + Math.sin(eclipsePhase * 0.9) * 0.03)) / 0.045, 0, 1) *
            clamp(1 - Math.abs(Math.sin(coreA * 11.8 + eclipsePhase * 2.6)) / 0.24, 0, 1);
          var stellarNoise = fractalNoise(column * 0.28 + frameIndex * 0.09, row * 0.26 - frameIndex * 0.07);
          var sparkles = clamp((stellarNoise - 0.72) / 0.22, 0, 1) * clamp((0.86 - coreR) / 0.72, 0, 1);

          shell = clamp(
            coronaRing * (0.58 + coronaRipple * 0.34) +
              flareJets * 0.28 +
              orbitDust * 0.24 +
              innerGlow * 0.18 -
              eclipseBite * 0.72 +
              penumbra * 0.08,
            0,
            1
          );
          shellDepth = clamp(0.28 + (1 - coreR) * 0.46 + coronaRipple * 0.13 - eclipseBite * 0.18, 0, 1);

          helixSignalA = flareJets * (0.5 + Math.sin(eclipsePhase * 1.3 + coreR * 9) * 0.2);
          helixSignalB = coronaRipple * coronaRing * (0.44 + Math.cos(eclipsePhase * 1.2 - coreR * 8.3) * 0.22);
          helixSignalC = orbitDust * (0.42 + Math.sin(eclipsePhase * 2.1 + coreA * 2.4) * 0.2) + sparkles * 0.42;
          rungs = orbitDust * 0.2 + sparkles * 0.16;
          spokes =
            clamp(1 - Math.abs(Math.sin(coreA * 13.6 - eclipsePhase * 2.5)) / 0.22, 0, 1) *
            clamp((0.7 - coreR) / 0.45, 0, 1) *
            0.22;
          depthA = clamp(0.3 + (1 - coreR) * 0.45 + flareJets * 0.16 - eclipseBite * 0.14, 0, 1);
          depthB = clamp(0.28 + (1 - coreR) * 0.48 + coronaRipple * 0.14 - eclipseBite * 0.14, 0, 1);
        }
        var bodyMask = clamp(1 - Math.abs(ny) / 1.02, 0, 1);
        var grain = fractalNoise((column + frameIndex * 0.12) * 0.22, (row - frameIndex * 0.08) * 0.24);
        var nearDepth = Math.max(depthA, depthB, shellDepth);
        var farDepth = Math.min(depthA, depthB, shellDepth);
        var depthBoost = 0.66 + nearDepth * 0.66;
        var depthOcclusion = 0.74 + farDepth * 0.26;
        var parallaxShade = 0.86 + clamp((pseudoZ + 0.16) * 0.7, 0, 0.34);
        var beatPulse = 1 + beat * (0.05 + nearDepth * 0.06);
        var sharedShading = bodyMask * depthBoost * depthOcclusion * parallaxShade * beatPulse;
        var shellDensityRaw = clamp((shell * (0.4 + shellDepth * 0.3) + spokes + grain * 0.022) * sharedShading, 0, 1);
        var helixDensityRaw = clamp(
          (helixSignalA + helixSignalB + helixSignalC + rungs * (0.8 + nearDepth * 0.16) + grain * 0.01) *
            sharedShading,
          0,
          1
        );
        var shellDensity = shellDensityRaw * 0.8 + logoShellTemporalBuffer[logoBufferIndex] * 0.2;
        var helixDensity = helixDensityRaw * 0.76 + logoHelixTemporalBuffer[logoBufferIndex] * 0.24;
        logoShellTemporalBuffer[logoBufferIndex] = shellDensity;
        logoHelixTemporalBuffer[logoBufferIndex] = helixDensity;
        var combinedDensity = clamp(shellDensity + helixDensity, 0, 1);
        shellTotalEnergy += shellDensity;
        shellNearEnergy += shellDensity * shellDepth;
        helixTotalEnergy += helixDensity;
        helixNearEnergy += helixDensity * Math.max(depthA, depthB);
        shellLine += shellDensity > 0.016 ? mapLogoDensity(shellDensity) : " ";
        helixLine += helixDensity > 0.04 ? mapLogoDensity(helixDensity) : " ";
        fallbackLine += mapLogoDensity(combinedDensity);
      }

      shellLines.push(shellLine);
      helixLines.push(helixLine);
      fallbackLines.push(fallbackLine);
    }

    if (projectsLogoShell) {
      projectsLogoShell.textContent = shellLines.join("\n");
    }
    if (projectsLogoHelix) {
      projectsLogoHelix.textContent = helixLines.join("\n");
    }
    if (projectsLogoFallback) {
      projectsLogoFallback.textContent = fallbackLines.join("\n");
    }
    applyProjectLogoTone(
      frameIndex,
      shellNearEnergy / Math.max(shellTotalEnergy, 0.001),
      helixNearEnergy / Math.max(helixTotalEnergy, 0.001),
      beat
    );
  }

  function updateProjectLogo(nowMs) {
    if ((!projectsLogoShell && !projectsLogoFallback && !projectsLogoHelix) || isHidden || prefersReducedMotion) {
      return;
    }

    if (logoLastFrameMs === 0 || nowMs - logoLastFrameMs >= logoFrameIntervalMs) {
      logoFrameIndex = (logoFrameIndex + 1) % 6000;
      renderProjectLogoFrame(logoFrameIndex);
      logoLastFrameMs = nowMs;
    }
  }

  function updateFrameInterval() {
    if (isHidden) {
      frameIntervalMs = hiddenFrameIntervalMs;
      return;
    }
    frameIntervalMs = prefersReducedMotion ? reducedMotionFrameIntervalMs : 140;
  }

  function onVisibilityChange() {
    isHidden = document.hidden;
    updateFrameInterval();
    if (!isHidden) {
      scheduleRender();
      scheduleWordmarkPulse();
      return;
    }
    clearWordmarkTimers();
    restoreWordmark();
  }

  function onMotionPreferenceChange(event) {
    prefersReducedMotion = event.matches;
    updateFrameInterval();
    renderProjectLogoFrame(0);
    scheduleRender();
    if (prefersReducedMotion) {
      clearWordmarkTimers();
      restoreWordmark();
      return;
    }
    scheduleWordmarkPulse();
  }

  seedBubbles();
  seedShiftFields();

  function animate(nowMs) {
    if (isHidden) {
      rafId = window.requestAnimationFrame(animate);
      return;
    }
    if (lastFrameMs === 0 || nowMs - lastFrameMs >= frameIntervalMs) {
      lastRenderTime = nowMs / 1000;
      renderAsciiField(lastRenderTime);
      lastFrameMs = nowMs;
    }
    updateProjectLogo(nowMs);
    rafId = window.requestAnimationFrame(animate);
  }

  if (window.matchMedia) {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = motionQuery.matches;
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", onMotionPreferenceChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(onMotionPreferenceChange);
    }
  }
  resolveLogoBeatMode();
  resolveLogoConcept();
  syncProjectLogoVisualScale();
  updateFrameInterval();
  renderProjectLogoFrame(0);

  loadProjectEntriesModel().then(renderProjectEntries);
  measureAsciiCell();
  renderAsciiField(lastRenderTime);
  scheduleWordmarkPulse();
  rafId = window.requestAnimationFrame(animate);
  window.addEventListener("resize", scheduleRender);
  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener("resize", scheduleRender);
    window.visualViewport.addEventListener("scroll", scheduleRender);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  root.setAttribute("data-ready", "true");
})();
