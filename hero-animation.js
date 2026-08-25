(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, dpr, time = 0;
  let mouse = { x: -9999, y: -9999, smoothX: -9999, smoothY: -9999, active: false };

  const colors = ['#f0a0b0', '#c0a0e8', '#f0b898', '#a0c8e8'];

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
      { rBase: dim * 0.38, home: { x: 0.65, y: 0.35 }, freq: 0.0008, amp: 0.06, phase: 0 },
      { rBase: dim * 0.30, home: { x: 0.30, y: 0.55 }, freq: 0.0011, amp: 0.07, phase: 1.8 },
      { rBase: dim * 0.22, home: { x: 0.75, y: 0.70 }, freq: 0.0014, amp: 0.08, phase: 3.6 },
      { rBase: dim * 0.15, home: { x: 0.45, y: 0.25 }, freq: 0.0018, amp: 0.09, phase: 5.2 }
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
        color: colors[i],
        freq: cfg.freq,
        amp: cfg.amp,
        phase: cfg.phase,
        breathPhase: i * 1.5,
        offsetX: 0,
        offsetY: 0
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
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.06;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.06;
    } else {
      mouse.smoothX += (-9999 - mouse.smoothX) * 0.03;
      mouse.smoothY += (-9999 - mouse.smoothY) * 0.03;
    }

    for (const c of circles) {
      const driftX = Math.sin(time * c.freq + c.phase) * w * c.amp;
      const driftY = Math.cos(time * c.freq * 0.7 + c.phase + 1) * h * c.amp;

      let targetX = c.homeX + driftX;
      let targetY = c.homeY + driftY;

      if (mouse.smoothX > -1000) {
        const dx = mouse.smoothX - c.homeX;
        const dy = mouse.smoothY - c.homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist / (Math.max(w, h) * 0.8));
        const strength = pull * pull * 0.35;
        targetX += dx * strength;
        targetY += dy * strength;
      }

      c.x += (targetX - c.x) * 0.02;
      c.y += (targetY - c.y) * 0.02;

      const breath = 1 + Math.sin(time * 0.015 + c.breathPhase) * 0.03;
      c.r = c.rBase * breath;
    }
  }

  function draw() {
    drawBackground();

    ctx.globalCompositeOperation = 'source-over';

    const sorted = [...circles].sort((a, b) => b.r - a.r);
    for (const c of sorted) {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
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
