(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  let w, h, dpr, time = 0;
  let mouse = { x: -9999, y: -9999, smoothX: -9999, smoothY: -9999, active: false, vx: 0, vy: 0, prevX: -9999, prevY: -9999, speed: 0 };

  const circles = [];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    resize();
    circles.length = 0;

    const dim = Math.min(w, h);
    const configs = [
      { rBase: dim * 0.38, home: { x: 0.55, y: 0.40 }, freq: 0.0005, amp: 0.08, phase: 0, strokeAlpha: 0.55, lineWidth: 1.8, colors: ['#F9B298', '#E163E6'] },
      { rBase: dim * 0.24, home: { x: 0.30, y: 0.60 }, freq: 0.0008, amp: 0.10, phase: 2.1, strokeAlpha: 0.45, lineWidth: 1.4, colors: ['#BDA4FE', '#99CFF3'] },
      { rBase: dim * 0.14, home: { x: 0.75, y: 0.65 }, freq: 0.0012, amp: 0.12, phase: 4.0, strokeAlpha: 0.40, lineWidth: 1.2, colors: ['#FFB2D7', '#F9B298'] },
      { rBase: dim * 0.08, home: { x: 0.40, y: 0.25 }, freq: 0.0018, amp: 0.15, phase: 5.8, strokeAlpha: 0.65, lineWidth: 1.8, colors: ['#99CFF3', '#BDA4FE'] }
    ];

    for (let i = 0; i < 4; i++) {
      const cfg = configs[i];
      circles.push({
        homeX: cfg.home.x * w,
        homeY: cfg.home.y * h,
        x: cfg.home.x * w,
        y: cfg.home.y * h,
        rBase: cfg.rBase,
        r: cfg.rBase,
        freq: cfg.freq,
        amp: cfg.amp,
        phase: cfg.phase,
        breathPhase: i * 1.5,
        strokeAlpha: cfg.strokeAlpha,
        baseAlpha: cfg.strokeAlpha,
        lineWidth: cfg.lineWidth,
        orbitAngle: i * Math.PI * 0.5,
        sizeBoost: 0,
        colors: cfg.colors
      });
    }
  }

  var blobs = [
    { x: 0.2, y: 0.3, r: 0.6, color: [240, 200, 216], freq: 0.0003, phase: 0 },
    { x: 0.8, y: 0.2, r: 0.5, color: [208, 184, 232], freq: 0.0004, phase: 1.5 },
    { x: 0.5, y: 0.7, r: 0.55, color: [232, 176, 208], freq: 0.00035, phase: 3.0 },
    { x: 0.9, y: 0.8, r: 0.45, color: [240, 192, 160], freq: 0.00045, phase: 4.5 }
  ];

  function drawBackground() {
    ctx.fillStyle = '#fffaf3';
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var bx = (b.x + Math.sin(time * b.freq + b.phase) * 0.12 + Math.sin(time * b.freq * 1.6 + b.phase * 0.7) * 0.06) * w;
      var by = (b.y + Math.cos(time * b.freq * 0.8 + b.phase + 1) * 0.1 + Math.cos(time * b.freq * 1.4 + b.phase * 1.3) * 0.05) * h;
      var br = b.r * Math.max(w, h);
      var grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',0.6)');
      grad.addColorStop(0.5, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',0.25)');
      grad.addColorStop(1, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function update() {
    time++;

    if (mouse.active) {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.12;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.12;
      mouse.vx = mouse.x - mouse.prevX;
      mouse.vy = mouse.y - mouse.prevY;
      mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    } else {
      mouse.smoothX += (-9999 - mouse.smoothX) * 0.03;
      mouse.smoothY += (-9999 - mouse.smoothY) * 0.03;
      mouse.speed *= 0.95;
    }

    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];

      const driftX = Math.sin(time * c.freq + c.phase) * w * c.amp
                   + Math.sin(time * c.freq * 1.7 + c.phase * 0.5) * w * c.amp * 0.3;
      const driftY = Math.cos(time * c.freq * 0.8 + c.phase + 1) * h * c.amp
                   + Math.cos(time * c.freq * 1.3 + c.phase * 1.2) * h * c.amp * 0.25;

      let targetX = c.homeX + driftX;
      let targetY = c.homeY + driftY;

      if (mouse.smoothX > -1000) {
        const dx = mouse.smoothX - c.x;
        const dy = mouse.smoothY - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDim = Math.max(w, h);
        const range = maxDim * 0.6;

        if (dist < range) {
          const proximity = 1 - dist / range;
          const speedFactor = Math.min(mouse.speed / 15, 1);

          c.orbitAngle += 0.02 + proximity * 0.04;
          const orbitRadius = dist * 0.3 * (1 - proximity * 0.5);
          const orbitX = Math.cos(c.orbitAngle) * orbitRadius * proximity;
          const orbitY = Math.sin(c.orbitAngle) * orbitRadius * proximity;

          const pullStrength = proximity * proximity * 0.6;
          targetX += dx * pullStrength + orbitX;
          targetY += dy * pullStrength + orbitY;

          if (speedFactor > 0.2) {
            const pushAngle = Math.atan2(dy, dx);
            const pushDist = speedFactor * proximity * maxDim * 0.08;
            targetX += Math.cos(pushAngle + Math.PI * 0.5 * (i % 2 === 0 ? 1 : -1)) * pushDist;
            targetY += Math.sin(pushAngle + Math.PI * 0.5 * (i % 2 === 0 ? 1 : -1)) * pushDist;
          }

          const targetBoost = proximity * 0.15 + speedFactor * proximity * 0.1;
          c.sizeBoost += (targetBoost - c.sizeBoost) * 0.08;

          c.strokeAlpha += ((c.baseAlpha + proximity * 0.25) - c.strokeAlpha) * 0.1;
        } else {
          c.sizeBoost *= 0.95;
          c.strokeAlpha += (c.baseAlpha - c.strokeAlpha) * 0.05;
        }
      } else {
        c.sizeBoost *= 0.95;
        c.strokeAlpha += (c.baseAlpha - c.strokeAlpha) * 0.05;
      }

      c.x += (targetX - c.x) * 0.04;
      c.y += (targetY - c.y) * 0.04;

      const breath = 1 + Math.sin(time * 0.012 + c.breathPhase) * 0.04;
      c.r = c.rBase * breath * (1 + c.sizeBoost);
    }

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const totalR = a.r + b.r;
          const ratioA = b.r / totalR;
          const ratioB = a.r / totalR;
          a.x -= nx * overlap * ratioA;
          a.y -= ny * overlap * ratioA;
          b.x += nx * overlap * ratioB;
          b.y += ny * overlap * ratioB;
        }
      }
    }
  }

  function draw() {
    drawBackground();

    ctx.globalCompositeOperation = 'color-burn';

    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      const fillAlpha = c.strokeAlpha * 0.45;
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

    for (const c of circles) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + c.strokeAlpha + ')';
      ctx.lineWidth = c.lineWidth;
      ctx.stroke();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.active = true;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', () => {
    const prevW = w;
    const prevH = h;
    resize();
    const scale = Math.min(w, h) / Math.min(prevW, prevH);
    for (const c of circles) {
      c.homeX = (c.homeX / prevW) * w;
      c.homeY = (c.homeY / prevH) * h;
      c.x = (c.x / prevW) * w;
      c.y = (c.y / prevH) * h;
      c.rBase *= scale;
      c.r = c.rBase;
    }
  });

  init();
  loop();
})();
