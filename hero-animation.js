(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, dpr, time = 0;
  let mouse = { x: -9999, y: -9999, smoothX: -9999, smoothY: -9999, active: false };

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
      { rBase: dim * 0.42, home: { x: 0.58, y: 0.38 }, freq: 0.0006, amp: 0.10, phase: 0, strokeAlpha: 0.35, lineWidth: 1.8 },
      { rBase: dim * 0.33, home: { x: 0.28, y: 0.62 }, freq: 0.0009, amp: 0.12, phase: 2.1, strokeAlpha: 0.25, lineWidth: 1.4 },
      { rBase: dim * 0.24, home: { x: 0.78, y: 0.68 }, freq: 0.0013, amp: 0.14, phase: 4.0, strokeAlpha: 0.18, lineWidth: 1.1 },
      { rBase: dim * 0.16, home: { x: 0.42, y: 0.22 }, freq: 0.0017, amp: 0.16, phase: 5.8, strokeAlpha: 0.40, lineWidth: 1.6 }
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
        lineWidth: cfg.lineWidth
      });
    }
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f0c8d8');
    grad.addColorStop(0.35, '#e8b0d0');
    grad.addColorStop(0.65, '#d0b8e8');
    grad.addColorStop(1, '#f0c0a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function update() {
    time++;

    if (mouse.active) {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.04;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.04;
    } else {
      mouse.smoothX += (-9999 - mouse.smoothX) * 0.02;
      mouse.smoothY += (-9999 - mouse.smoothY) * 0.02;
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
        const dx = mouse.smoothX - targetX;
        const dy = mouse.smoothY - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const range = Math.max(w, h) * 0.7;
        const pull = Math.max(0, 1 - dist / range);
        const strength = pull * pull * 0.4;
        targetX += dx * strength;
        targetY += dy * strength;
      }

      c.x += (targetX - c.x) * 0.015;
      c.y += (targetY - c.y) * 0.015;

      const breath = 1 + Math.sin(time * 0.012 + c.breathPhase) * 0.04;
      c.r = c.rBase * breath;
    }
  }

  function draw() {
    drawBackground();

    ctx.globalCompositeOperation = 'lighter';

    for (const c of circles) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + c.strokeAlpha + ')';
      ctx.lineWidth = c.lineWidth;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
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
