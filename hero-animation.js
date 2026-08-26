(function() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var w, h, dpr;
  var frameCount = 0;
  var startTime = 0;
  var introProgress = 0;
  var introDone = false;
  var scrollOpacity = 1;

  var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, active: false };

  var focal = { x: 0.48, y: 0.50 };
  var beamIntensity = 0;
  var beamTargetIntensity = 0;
  var lightSpill = 0;

  var circles = [];

  var blobs = [
    { x: 0.2, y: 0.3, r: 0.6, color: [240, 170, 200], freq: 0.0003, phase: 0 },
    { x: 0.8, y: 0.2, r: 0.5, color: [192, 160, 232], freq: 0.0004, phase: 1.5 },
    { x: 0.5, y: 0.7, r: 0.55, color: [232, 150, 200], freq: 0.00035, phase: 3.0 },
    { x: 0.9, y: 0.8, r: 0.45, color: [240, 180, 140], freq: 0.00045, phase: 4.5 }
  ];

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    isMobile = window.innerWidth < 768;
  }

  function init() {
    resize();
    circles.length = 0;
    var dim = Math.min(w, h);

    var configs = [
      { rBase: dim * 0.38, home: { x: 0.55, y: 0.40 }, strokeAlpha: 0.55, lineWidth: 1.8, disperseAngle: -0.8, disperseDist: 0.18, cogDir: 1 },
      { rBase: dim * 0.24, home: { x: 0.30, y: 0.60 }, strokeAlpha: 0.45, lineWidth: 1.4, disperseAngle: 2.5, disperseDist: 0.22, cogDir: -1 },
      { rBase: dim * 0.14, home: { x: 0.75, y: 0.65 }, strokeAlpha: 0.40, lineWidth: 1.2, disperseAngle: 1.2, disperseDist: 0.20, cogDir: 1 },
      { rBase: dim * 0.08, home: { x: 0.40, y: 0.25 }, strokeAlpha: 0.65, lineWidth: 1.8, disperseAngle: -2.0, disperseDist: 0.15, cogDir: -1 }
    ];

    for (var i = 0; i < 4; i++) {
      var cfg = configs[i];
      var maxDim = Math.max(w, h);
      var dx = Math.cos(cfg.disperseAngle) * cfg.disperseDist * maxDim;
      var dy = Math.sin(cfg.disperseAngle) * cfg.disperseDist * maxDim;

      circles.push({
        homeX: cfg.home.x * w,
        homeY: cfg.home.y * h,
        x: prefersReduced ? cfg.home.x * w : cfg.home.x * w + dx,
        y: prefersReduced ? cfg.home.y * h : cfg.home.y * h + dy,
        vx: 0, vy: 0,
        rBase: cfg.rBase,
        r: cfg.rBase,
        strokeAlpha: prefersReduced ? cfg.strokeAlpha : cfg.strokeAlpha * 0.15,
        baseAlpha: cfg.strokeAlpha,
        lineWidth: cfg.lineWidth,
        cogDir: cfg.cogDir,
        // Cog rotation angle — used to orbit around contact points
        cogAngle: i * Math.PI * 0.5,
        cogSpeed: 0
      });
    }

    introProgress = prefersReduced ? 1 : 0;
    introDone = prefersReduced;
    startTime = 0;
  }

  function drawBackground() {
    ctx.fillStyle = '#fffaf3';
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var breathScale = introDone ? 1 : introProgress;
      var t = frameCount;
      var bx = (b.x + Math.sin(t * b.freq * 0.3 + b.phase) * 0.005 * breathScale) * w;
      var by = (b.y + Math.cos(t * b.freq * 0.25 + b.phase + 1) * 0.004 * breathScale) * h;
      var br = b.r * Math.max(w, h);
      var grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      var alpha = 0.85 * scrollOpacity;
      grad.addColorStop(0, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',' + alpha + ')');
      grad.addColorStop(0.4, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',' + (alpha * 0.53) + ')');
      grad.addColorStop(1, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function update(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) / 1000;
    frameCount++;

    // --- Intro ---
    if (!introDone) {
      introProgress = clamp(elapsed / 2.5, 0, 1);
      var eased = 1 - Math.pow(1 - introProgress, 3);

      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        c.x = lerp(c.x, c.homeX, eased * 0.06 + 0.015);
        c.y = lerp(c.y, c.homeY, eased * 0.06 + 0.015);
        c.strokeAlpha = lerp(c.strokeAlpha, c.baseAlpha, eased * 0.05);
      }

      beamTargetIntensity = eased * 0.5;

      if (introProgress >= 1) {
        introDone = true;
        for (var j = 0; j < circles.length; j++) {
          circles[j].x = circles[j].homeX;
          circles[j].y = circles[j].homeY;
          circles[j].strokeAlpha = circles[j].baseAlpha;
        }
      }
    }

    // --- Mouse interaction (desktop, post-intro) ---
    if (!isMobile && introDone) {
      if (mouse.active) {
        mouse.sx += (mouse.x - mouse.sx) * 0.035;
        mouse.sy += (mouse.y - mouse.sy) * 0.035;
      } else {
        mouse.sx += (-9999 - mouse.sx) * 0.015;
        mouse.sy += (-9999 - mouse.sy) * 0.015;
      }

      var focalX = focal.x * w;
      var focalY = focal.y * h;
      var influenceRadius = 320;

      var cfx = mouse.sx - focalX;
      var cfy = mouse.sy - focalY;
      var cursorToFocal = Math.sqrt(cfx * cfx + cfy * cfy);
      var focalProximity = clamp(1 - cursorToFocal / (influenceRadius * 1.5), 0, 1);

      beamTargetIntensity = 0.25 + focalProximity * 0.75;

      // Apply mouse force to each circle
      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        var dx = mouse.sx - c.homeX;
        var dy = mouse.sy - c.homeY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < influenceRadius && mouse.sx > -1000) {
          var proximity = 1 - dist / influenceRadius;
          var strength = proximity * proximity * proximity;
          var pushDist = strength * 12;
          var angle = Math.atan2(dy, dx);

          // Push circle away from cursor
          c.vx += -Math.cos(angle) * pushDist * 0.008;
          c.vy += -Math.sin(angle) * pushDist * 0.008;

          c.strokeAlpha += ((c.baseAlpha + focalProximity * 0.3) - c.strokeAlpha) * 0.03;
        } else {
          c.strokeAlpha += (c.baseAlpha - c.strokeAlpha) * 0.02;
        }
      }
    } else if (introDone) {
      beamTargetIntensity = 0.25;
    }

    // --- Cog collision: circles push each other like interlocking gears ---
    if (introDone) {
      for (var i = 0; i < circles.length; i++) {
        for (var j = i + 1; j < circles.length; j++) {
          var a = circles[i];
          var b = circles[j];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = a.r + b.r;

          if (dist < minDist && dist > 0.1) {
            var overlap = minDist - dist;
            var nx = dx / dist;
            var ny = dy / dist;

            // Mass-proportional separation
            var totalR = a.r + b.r;
            var ratioA = b.r / totalR;
            var ratioB = a.r / totalR;

            a.vx -= nx * overlap * ratioA * 0.06;
            a.vy -= ny * overlap * ratioA * 0.06;
            b.vx += nx * overlap * ratioB * 0.06;
            b.vy += ny * overlap * ratioB * 0.06;

            // Cog effect: tangential velocity transfer
            // When circles touch, they impart tangential force (like gears)
            var tangentX = -ny;
            var tangentY = nx;
            var aSpeed = a.vx * nx + a.vy * ny;
            var cogTransfer = aSpeed * 0.15;

            b.vx += tangentX * cogTransfer * b.cogDir * 0.5;
            b.vy += tangentY * cogTransfer * b.cogDir * 0.5;
            a.vx += -tangentX * cogTransfer * a.cogDir * 0.3;
            a.vy += -tangentY * cogTransfer * a.cogDir * 0.3;
          }
        }
      }

      // --- Apply velocities with heavy damping for smooth feel ---
      var breathT = frameCount * 0.0008;
      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];

        // Very subtle idle drift (1-2px, 10-12s cycle)
        var idleX = Math.sin(breathT * 0.5 + c.cogAngle) * 1.5;
        var idleY = Math.cos(breathT * 0.4 + c.cogAngle + 0.7) * 1.2;

        // Spring back to home
        var homeForceX = (c.homeX - c.x) * 0.012;
        var homeForceY = (c.homeY - c.y) * 0.012;
        c.vx += homeForceX;
        c.vy += homeForceY;

        // Heavy damping for buttery-smooth movement
        c.vx *= 0.92;
        c.vy *= 0.92;

        c.x += c.vx + idleX * 0.05;
        c.y += c.vy + idleY * 0.05;

        // Very subtle size pulse
        var breathSize = 1 + Math.sin(breathT * 0.35 + c.cogAngle) * 0.005;
        c.r = c.rBase * breathSize;
      }
    }

    // --- Beam & light spill ---
    beamIntensity += (beamTargetIntensity - beamIntensity) * 0.03;
    lightSpill += (beamIntensity - lightSpill) * 0.02;
  }

  function draw() {
    drawBackground();

    var focalX = focal.x * w;
    var focalY = focal.y * h;

    // --- Circle strokes only (no gradient fill) ---
    for (var i = 0; i < circles.length; i++) {
      var c = circles[i];
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (c.strokeAlpha * scrollOpacity) + ')';
      ctx.lineWidth = c.lineWidth;
      ctx.stroke();
    }

    // --- Convergence glow ---
    if (beamIntensity > 0.05) {
      var glowR = 25 + beamIntensity * 18;
      var glowGrad = ctx.createRadialGradient(focalX, focalY, 0, focalX, focalY, glowR);
      var glowAlpha = beamIntensity * 0.3 * scrollOpacity;
      glowGrad.addColorStop(0, 'rgba(255,255,255,' + glowAlpha + ')');
      glowGrad.addColorStop(0.4, 'rgba(255,245,240,' + (glowAlpha * 0.35) + ')');
      glowGrad.addColorStop(1, 'rgba(255,240,235,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(focalX - glowR, focalY - glowR, glowR * 2, glowR * 2);
    }

    // --- Beam ---
    if (beamIntensity > 0.1) {
      var beamLen = 50 + beamIntensity * 70 + (1 - scrollOpacity) * 30;
      var beamWidth = 0.8 + beamIntensity * 2;
      var beamAlpha = beamIntensity * 0.4 * scrollOpacity;

      ctx.save();
      ctx.translate(focalX, focalY);

      var beamGrad = ctx.createLinearGradient(0, 0, beamLen, 0);
      beamGrad.addColorStop(0, 'rgba(255,255,255,' + beamAlpha + ')');
      beamGrad.addColorStop(0.3, 'rgba(255,255,255,' + (beamAlpha * 0.6) + ')');
      beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, -beamWidth / 2, beamLen, beamWidth);

      var beamGrad2 = ctx.createLinearGradient(0, 0, -beamLen * 0.5, 0);
      beamGrad2.addColorStop(0, 'rgba(255,255,255,' + (beamAlpha * 0.5) + ')');
      beamGrad2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beamGrad2;
      ctx.fillRect(-beamLen * 0.5, -beamWidth / 2, beamLen * 0.5, beamWidth);
      ctx.restore();

      if (lightSpill > 0.15) {
        var spillR = 40 + lightSpill * 35;
        var spillGrad = ctx.createRadialGradient(focalX, focalY, 0, focalX, focalY, spillR);
        var spillAlpha = (lightSpill - 0.15) * 0.1 * scrollOpacity;
        spillGrad.addColorStop(0, 'rgba(255,250,245,' + spillAlpha + ')');
        spillGrad.addColorStop(1, 'rgba(255,245,240,0)');
        ctx.fillStyle = spillGrad;
        ctx.fillRect(focalX - spillR, focalY - spillR, spillR * 2, spillR * 2);
      }
    }
  }

  function loop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  if (!isMobile) {
    document.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    document.addEventListener('mouseleave', function() {
      mouse.active = false;
    });
  }

  if (!prefersReduced) {
    var heroSection = canvas.closest('.hero');
    if (heroSection && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        var entry = entries[0];
        if (entry.isIntersecting) {
          scrollOpacity = clamp(entry.intersectionRatio * 1.5, 0, 1);
        } else {
          scrollOpacity = 0;
        }
      }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
      observer.observe(heroSection);
    }
  }

  window.addEventListener('resize', function() {
    var prevW = w;
    var prevH = h;
    resize();
    if (prevW && prevH) {
      var scale = Math.min(w, h) / Math.min(prevW, prevH);
      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        c.homeX = (c.homeX / prevW) * w;
        c.homeY = (c.homeY / prevH) * h;
        c.x = (c.x / prevW) * w;
        c.y = (c.y / prevH) * h;
        c.rBase *= scale;
        c.r = c.rBase;
      }
    }
  });

  init();
  requestAnimationFrame(loop);
})();
