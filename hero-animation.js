(function() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  function hexToRgba(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var w, h, dpr;
  var frameCount = 0;
  var startTime = 0;
  var introProgress = 0; // 0 → 1 over ~2.5s
  var introDone = false;
  var scrollOpacity = 1;

  var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, active: false };

  // Convergence point — where circles naturally overlap
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
      { rBase: dim * 0.38, home: { x: 0.55, y: 0.40 }, strokeAlpha: 0.55, lineWidth: 1.8, colors: ['#F9B298', '#E163E6'], disperseAngle: -0.8, disperseDist: 0.18 },
      { rBase: dim * 0.24, home: { x: 0.30, y: 0.60 }, strokeAlpha: 0.45, lineWidth: 1.4, colors: ['#BDA4FE', '#99CFF3'], disperseAngle: 2.5, disperseDist: 0.22 },
      { rBase: dim * 0.14, home: { x: 0.75, y: 0.65 }, strokeAlpha: 0.40, lineWidth: 1.2, colors: ['#FFB2D7', '#F9B298'], disperseAngle: 1.2, disperseDist: 0.20 },
      { rBase: dim * 0.08, home: { x: 0.40, y: 0.25 }, strokeAlpha: 0.65, lineWidth: 1.8, colors: ['#99CFF3', '#BDA4FE'], disperseAngle: -2.0, disperseDist: 0.15 }
    ];

    for (var i = 0; i < 4; i++) {
      var cfg = configs[i];
      var maxDim = Math.max(w, h);
      // Dispersed starting positions — offset from home
      var dx = Math.cos(cfg.disperseAngle) * cfg.disperseDist * maxDim;
      var dy = Math.sin(cfg.disperseAngle) * cfg.disperseDist * maxDim;

      circles.push({
        homeX: cfg.home.x * w,
        homeY: cfg.home.y * h,
        x: prefersReduced ? cfg.home.x * w : cfg.home.x * w + dx,
        y: prefersReduced ? cfg.home.y * h : cfg.home.y * h + dy,
        rBase: cfg.rBase,
        r: cfg.rBase,
        strokeAlpha: prefersReduced ? cfg.strokeAlpha : cfg.strokeAlpha * 0.15,
        baseAlpha: cfg.strokeAlpha,
        lineWidth: cfg.lineWidth,
        colors: cfg.colors,
        breathPhase: i * 2.4,
        mouseOffsetX: 0,
        mouseOffsetY: 0
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
      // Very subtle breathing in idle — 1-3px movement over 10s cycles
      var breathScale = introDone ? 1 : introProgress;
      var t = frameCount;
      var bx = (b.x + Math.sin(t * b.freq * 0.3 + b.phase) * 0.008 * breathScale) * w;
      var by = (b.y + Math.cos(t * b.freq * 0.25 + b.phase + 1) * 0.006 * breathScale) * h;
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

    // --- Intro progression ---
    if (!introDone) {
      // Smooth ease-out over 2.5s
      introProgress = clamp(elapsed / 2.5, 0, 1);
      var eased = 1 - Math.pow(1 - introProgress, 3); // cubic ease-out

      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        c.x = lerp(c.x, c.homeX, eased * 0.08 + 0.02);
        c.y = lerp(c.y, c.homeY, eased * 0.08 + 0.02);
        c.strokeAlpha = lerp(c.strokeAlpha, c.baseAlpha, eased * 0.06);
      }

      // Beam builds as circles converge
      beamTargetIntensity = eased * 0.6;

      if (introProgress >= 1) {
        introDone = true;
        for (var j = 0; j < circles.length; j++) {
          circles[j].x = circles[j].homeX;
          circles[j].y = circles[j].homeY;
          circles[j].strokeAlpha = circles[j].baseAlpha;
        }
      }
    }

    // --- Mouse interaction (desktop only, post-intro) ---
    if (!isMobile && introDone) {
      // Smooth cursor trailing
      if (mouse.active) {
        mouse.sx += (mouse.x - mouse.sx) * 0.06;
        mouse.sy += (mouse.y - mouse.sy) * 0.06;
      } else {
        mouse.sx += (-9999 - mouse.sx) * 0.02;
        mouse.sy += (-9999 - mouse.sy) * 0.02;
      }

      var focalX = focal.x * w;
      var focalY = focal.y * h;
      var influenceRadius = 300;
      var maxDisplace = 10;

      // Distance from cursor to focal point
      var cfx = mouse.sx - focalX;
      var cfy = mouse.sy - focalY;
      var cursorToFocal = Math.sqrt(cfx * cfx + cfy * cfy);
      var focalProximity = clamp(1 - cursorToFocal / (influenceRadius * 1.5), 0, 1);

      // Beam responds to cursor near focal
      beamTargetIntensity = 0.3 + focalProximity * 0.7;

      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        var dx = mouse.sx - c.x;
        var dy = mouse.sy - c.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < influenceRadius && mouse.sx > -1000) {
          var proximity = 1 - dist / influenceRadius;
          var strength = proximity * proximity; // quadratic falloff

          // Subtle refraction — bend away from cursor
          var angle = Math.atan2(dy, dx);
          var displace = strength * maxDisplace;

          // Near focal point: paths organize (pull toward home)
          var organizeStrength = focalProximity * 0.3;
          var targetOx = -Math.cos(angle) * displace * (1 - focalProximity * 0.6);
          var targetOy = -Math.sin(angle) * displace * (1 - focalProximity * 0.6);

          c.mouseOffsetX += (targetOx - c.mouseOffsetX) * 0.04;
          c.mouseOffsetY += (targetOy - c.mouseOffsetY) * 0.04;

          // Near focal: brighten strokes, shift toward white
          c.strokeAlpha += ((c.baseAlpha + focalProximity * 0.35) - c.strokeAlpha) * 0.06;
        } else {
          c.mouseOffsetX *= 0.94;
          c.mouseOffsetY *= 0.94;
          c.strokeAlpha += (c.baseAlpha - c.strokeAlpha) * 0.03;
        }
      }
    } else if (introDone) {
      // Reset mouse offsets on mobile
      for (var i = 0; i < circles.length; i++) {
        circles[i].mouseOffsetX *= 0.95;
        circles[i].mouseOffsetY *= 0.95;
      }
      beamTargetIntensity = 0.3;
    }

    // --- Idle breathing (post-intro) ---
    if (introDone) {
      for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        // 10s cycle, 1-3px movement
        var breathT = frameCount * 0.001;
        var bx = Math.sin(breathT * 0.6 + c.breathPhase) * 2
               + Math.sin(breathT * 0.37 + c.breathPhase * 1.3) * 1;
        var by = Math.cos(breathT * 0.5 + c.breathPhase + 1) * 1.5
               + Math.cos(breathT * 0.42 + c.breathPhase * 0.8) * 0.8;

        c.x = c.homeX + bx + c.mouseOffsetX;
        c.y = c.homeY + by + c.mouseOffsetY;

        // Very subtle size breathing
        var breathSize = 1 + Math.sin(breathT * 0.45 + c.breathPhase) * 0.008;
        c.r = c.rBase * breathSize;
      }
    }

    // --- Beam & light spill ---
    beamIntensity += (beamTargetIntensity - beamIntensity) * 0.04;
    // Light spill trails beam by ~100-150ms (4-5 frames at 60fps)
    lightSpill += (beamIntensity - lightSpill) * 0.025;
  }

  function draw() {
    drawBackground();

    var focalX = focal.x * w;
    var focalY = focal.y * h;

    // --- Circle fills with color-burn ---
    ctx.globalCompositeOperation = 'color-burn';
    for (var i = 0; i < circles.length; i++) {
      var c = circles[i];
      var grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      var fillAlpha = c.strokeAlpha * 0.45 * scrollOpacity;
      grad.addColorStop(0, hexToRgba(c.colors[0], fillAlpha));
      grad.addColorStop(0.5, hexToRgba(c.colors[1], fillAlpha * 0.5));
      grad.addColorStop(0.85, hexToRgba(c.colors[1], fillAlpha * 0.1));
      grad.addColorStop(1, hexToRgba(c.colors[1], 0));
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // --- Circle strokes ---
    for (var i = 0; i < circles.length; i++) {
      var c = circles[i];
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (c.strokeAlpha * scrollOpacity) + ')';
      ctx.lineWidth = c.lineWidth;
      ctx.stroke();
    }

    // --- Convergence point glow ---
    if (beamIntensity > 0.05) {
      var glowR = 30 + beamIntensity * 20;
      var glowGrad = ctx.createRadialGradient(focalX, focalY, 0, focalX, focalY, glowR);
      var glowAlpha = beamIntensity * 0.35 * scrollOpacity;
      glowGrad.addColorStop(0, 'rgba(255,255,255,' + glowAlpha + ')');
      glowGrad.addColorStop(0.4, 'rgba(255,245,240,' + (glowAlpha * 0.4) + ')');
      glowGrad.addColorStop(1, 'rgba(255,240,235,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(focalX - glowR, focalY - glowR, glowR * 2, glowR * 2);
    }

    // --- Beam ---
    if (beamIntensity > 0.1) {
      var beamLen = 60 + beamIntensity * 80 + (1 - scrollOpacity) * 40;
      var beamWidth = 1 + beamIntensity * 2.5;
      var beamAlpha = beamIntensity * 0.5 * scrollOpacity;

      ctx.save();
      ctx.translate(focalX, focalY);
      // Beam extends right (toward edge of canvas)
      var beamGrad = ctx.createLinearGradient(0, 0, beamLen, 0);
      beamGrad.addColorStop(0, 'rgba(255,255,255,' + beamAlpha + ')');
      beamGrad.addColorStop(0.3, 'rgba(255,255,255,' + (beamAlpha * 0.7) + ')');
      beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, -beamWidth / 2, beamLen, beamWidth);

      // Mirrored beam extends left
      var beamGrad2 = ctx.createLinearGradient(0, 0, -beamLen * 0.6, 0);
      beamGrad2.addColorStop(0, 'rgba(255,255,255,' + (beamAlpha * 0.6) + ')');
      beamGrad2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beamGrad2;
      ctx.fillRect(-beamLen * 0.6, -beamWidth / 2, beamLen * 0.6, beamWidth);
      ctx.restore();

      // --- Light spill (trails beam) ---
      if (lightSpill > 0.15) {
        var spillR = 50 + lightSpill * 40;
        var spillGrad = ctx.createRadialGradient(focalX, focalY, 0, focalX, focalY, spillR);
        var spillAlpha = (lightSpill - 0.15) * 0.12 * scrollOpacity;
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

  // --- Mouse events (desktop only) ---
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

  // --- Scroll fade ---
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

  // --- Resize ---
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
