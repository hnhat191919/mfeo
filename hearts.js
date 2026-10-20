/* ===== Tim bay lên (canvas) =====
   Gồm 4 loại: tim đặc, tim trong bong bóng, chấm tròn nhỏ, tim mờ ở xa.
   Chạm / click vào màn hình để bắn thêm một chùm tim. */
(function () {
  var canvas = document.getElementById('hearts');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PINKS = ['#ff7a9c', '#ff8fab', '#ff6b8f', '#f78fb3', '#ffa3b8'];
  var RING = 'rgba(255, 170, 195, 0.9)';

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  // kích thước theo cạnh nhỏ của màn hình để điện thoại cũng đẹp
  function unit() { return Math.min(W, H) / 100; }

  function makeParticle(opts) {
    opts = opts || {};
    var u = unit();
    var r = Math.random();
    var type, size, alpha, speed, blur = 0;

    if (r < 0.40) {            // tim đặc
      type = 'heart'; size = rand(1.6, 3.4) * u; alpha = rand(0.75, 1); speed = rand(4, 9);
    } else if (r < 0.62) {     // tim trong bong bóng
      type = 'bubble'; size = rand(2.6, 5.2) * u; alpha = rand(0.7, 1); speed = rand(3, 7);
    } else if (r < 0.80) {     // tim mờ ở xa
      type = 'dim'; size = rand(2.4, 4.6) * u; alpha = rand(0.18, 0.34); speed = rand(2, 5); blur = 1;
    } else if (r < 0.92) {     // bong bóng nhỏ có chấm
      type = 'ring'; size = rand(0.9, 1.8) * u; alpha = rand(0.5, 0.9); speed = rand(3, 6);
    } else {                   // chấm nhỏ
      type = 'dot'; size = rand(0.3, 0.7) * u; alpha = rand(0.4, 0.8); speed = rand(2, 5);
    }

    var life = rand(9, 16);
    var p = {
      type: type,
      size: size,
      maxAlpha: alpha,
      blur: blur,
      color: pick(PINKS),
      x: opts.x != null ? opts.x : rand(0, W),
      y: opts.y != null ? opts.y : H + size * 2,
      vy: -speed * u * 0.1 * (reduceMotion ? 0.5 : 1),   // bay lên
      vx: 0,
      ex: opts.ex || 0,                                   // vận tốc "bắn" thêm, giảm dần
      ey: opts.ey || 0,
      swayAmp: rand(0.8, 3.2) * u,
      swayFreq: rand(0.4, 1.1),
      phase: rand(0, Math.PI * 2),
      rot: rand(-0.35, 0.35),
      rotSpeed: rand(-0.15, 0.15),
      age: opts.age || 0,
      life: opts.life || life,
      baseX: 0
    };
    p.baseX = p.x;
    return p;
  }

  function heartPath(x, y, s) {
    // tim có chiều rộng khoảng 2*s, tâm tại (x, y)
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.5, y + s * 0.1, x - s * 1.15, y - s * 1.05, x, y - s * 0.42);
    ctx.bezierCurveTo(x + s * 1.15, y - s * 1.05, x + s * 1.5, y + s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  }

  function draw(p, a) {
    var x = p.x, y = p.y, s = p.size;
    ctx.save();
    ctx.globalAlpha = a;
    if (p.blur) ctx.filter = 'blur(' + Math.max(1, s * 0.12).toFixed(1) + 'px)';

    if (p.type === 'heart' || p.type === 'dim') {
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.type === 'dim' ? '#b84a68' : p.color;
      if (p.type === 'heart') {
        ctx.shadowColor = 'rgba(255, 110, 150, 0.7)';
        ctx.shadowBlur = s * 1.2;
      }
      heartPath(0, 0, s);
      ctx.fill();
    } else if (p.type === 'bubble') {
      // vòng tròn + tim bên trong
      ctx.beginPath();
      ctx.arc(x, y, s * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 150, 180, 0.10)';
      ctx.fill();
      ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.strokeStyle = RING;
      ctx.stroke();
      ctx.translate(x, y + s * 0.05);
      ctx.fillStyle = p.color;
      heartPath(0, 0, s * 0.75);
      ctx.fill();
    } else if (p.type === 'ring') {
      ctx.beginPath();
      ctx.arc(x, y, s * 1.5, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, s * 0.25);
      ctx.strokeStyle = RING;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }

  function targetCount() {
    var base = Math.round((W * H) / 22000);          // tỉ lệ theo diện tích màn hình
    base = Math.max(26, Math.min(base, 70));
    return reduceMotion ? Math.round(base * 0.5) : base;
  }

  function seed() {
    particles = [];
    var n = targetCount();
    for (var i = 0; i < n; i++) {
      // rải sẵn khắp màn hình để khi mở trang không bị trống
      var p = makeParticle({ x: rand(0, W), y: rand(0, H) });
      p.age = rand(0, p.life * 0.7);
      particles.push(p);
    }
  }

  function burst(x, y) {
    var n = reduceMotion ? 6 : 14;
    for (var i = 0; i < n; i++) {
      var ang = -Math.PI / 2 + rand(-0.9, 0.9);        // chủ yếu bắn lên trên
      var sp = rand(3, 9) * unit() * 0.35;
      var p = makeParticle({
        x: x, y: y,
        ex: Math.cos(ang) * sp,
        ey: Math.sin(ang) * sp,
        life: rand(3.5, 6.5)
      });
      if (p.type === 'dim') p.type = 'heart';
      p.blur = 0;
      p.maxAlpha = Math.max(p.maxAlpha, 0.8);
      particles.push(p);
    }
  }

  var last = 0;
  var running = true;

  function frame(t) {
    if (!running) return;
    var dt = Math.min((t - last) / 1000 || 0.016, 0.05);
    last = t;

    ctx.clearRect(0, 0, W, H);

    var ambient = 0;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.age += dt;
      if (p.age >= p.life || p.y < -p.size * 3) {
        particles.splice(i, 1);
        continue;
      }
      if (!p.isBurst && p.ex === 0 && p.ey === 0) ambient++;

      p.ex *= Math.pow(0.12, dt);                     // giảm tốc sau khi bắn
      p.ey *= Math.pow(0.12, dt);
      p.baseX += (p.ex * 60) * dt;
      p.y += (p.vy * 60 + p.ey * 60) * dt;
      p.x = p.baseX + Math.sin(p.age * p.swayFreq * 2 + p.phase) * p.swayAmp;
      p.rot += p.rotSpeed * dt;

      // mờ dần vào / ra
      var k = p.age / p.life;
      var env = k < 0.12 ? k / 0.12 : (k > 0.8 ? (1 - k) / 0.2 : 1);
      // gần mép trên thì tan dần
      var edge = Math.min(1, Math.max(0, p.y / (H * 0.12)));
      draw(p, p.maxAlpha * env * edge);
    }

    // bổ sung tim mới từ phía dưới để luôn đủ số lượng
    var need = targetCount() - particles.length;
    for (var j = 0; j < need && Math.random() < 0.35; j++) {
      particles.push(makeParticle());
    }

    requestAnimationFrame(frame);
  }

  function onPointer(e) {
    var x, y;
    if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    else { x = e.clientX; y = e.clientY; }
    burst(x, y);
  }

  function init() {
    window.addEventListener('resize', function () { resize(); });
    window.addEventListener('pointerdown', onPointer);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    });
    resize();
    seed();
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // chỉ bắt đầu khi cảnh hoa được kích hoạt (sau cảnh sóc)
  if (window.__flowersStarted) init();
  else document.addEventListener('flowers:start', init, { once: true });
})();
