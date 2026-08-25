(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, dpr;
  let mouse = { x: -9999, y: -9999, active: false };

  const palette = [
    { inner: '#f7a0b8', outer: '#e88bc0' },
    { inner: '#d4a0f0', outer: '#b07de8' },
    { inner: '#f5c0a0', outer: '#f09060' },
    { inner: '#a8d4f0', outer: '#80b8e8' }
  ];

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

    const sizes = [
      { r: Math.min(w, h) * 0.38 },
      { r: Math.min(w, h) * 0.30 },
      { r: Math.min(w, h) * 0.22 },
      { r: Math.min(w, h) * 0.14 }
    ];

    for (let i = 0; i < 4; i++) {
      circles.push({
        x: Math.random() * w * 0.6 + w * 0.2,
        y: Math.random() * h * 0.6 + h * 0.2,
        r: sizes[i].r,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        color: palette[i]
      });
    }
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f0c8d8');
    grad.addColorStop(0.3, '#e8b0d0');
    grad.addColorStop(0.6, '#d0b8e8');
    grad.addColorStop(1, '#f0c0a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawCircle(c) {
    const grad = ctx.createRadialGradient(
      c.x - c.r * 0.2, c.y - c.r * 0.2, c.r * 0.1,
      c.x, c.y, c.r
    );
    grad.addColorStop(0, c.color.inner);
    grad.addColorStop(1, c.color.outer);

    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function collide(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.r + b.r;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) * 0.5;
      a.x -= nx * overlap * 0.3;
      a.y -= ny * overlap * 0.3;
      b.x += nx * overlap * 0.3;
      b.y += ny * overlap * 0.3;

      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      const dot = dvx * nx + dvy * ny;

      if (dot > 0) {
        const massA = a.r * a.r;
        const massB = b.r * b.r;
        const total = massA + massB;
        a.vx -= (2 * massB / total) * dot * nx * 0.4;
        a.vy -= (2 * massB / total) * dot * ny * 0.4;
        b.vx += (2 * massA / total) * dot * nx * 0.4;
        b.vy += (2 * massA / total) * dot * ny * 0.4;
      }
    }
  }

  function update() {
    const mouseRadius = 150;
    const mouseForce = 0.8;

    for (const c of circles) {
      if (mouse.active) {
        const dx = c.x - mouse.x;
        const dy = c.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius + c.r && dist > 0) {
          const force = (1 - dist / (mouseRadius + c.r)) * mouseForce;
          c.vx += (dx / dist) * force;
          c.vy += (dy / dist) * force;
        }
      }

      c.x += c.vx;
      c.y += c.vy;

      c.vx *= 0.995;
      c.vy *= 0.995;

      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed < 0.15) {
        c.vx += (Math.random() - 0.5) * 0.08;
        c.vy += (Math.random() - 0.5) * 0.08;
      }

      const pad = c.r * 0.3;
      if (c.x - c.r < -pad) { c.x = c.r - pad; c.vx = Math.abs(c.vx) * 0.6; }
      if (c.x + c.r > w + pad) { c.x = w - c.r + pad; c.vx = -Math.abs(c.vx) * 0.6; }
      if (c.y - c.r < -pad) { c.y = c.r - pad; c.vy = Math.abs(c.vy) * 0.6; }
      if (c.y + c.r > h + pad) { c.y = h - c.r + pad; c.vy = -Math.abs(c.vy) * 0.6; }
    }

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        collide(circles[i], circles[j]);
      }
    }
  }

  function draw() {
    drawBackground();
    const sorted = [...circles].sort((a, b) => a.r - b.r);
    for (const c of sorted) drawCircle(c);
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
    for (const c of circles) {
      c.x = (c.x / prevW) * w;
      c.y = (c.y / prevH) * h;
      c.r = c.r * (Math.min(w, h) / Math.min(prevW, prevH));
    }
  });

  init();
  loop();
})();
