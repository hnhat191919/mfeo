/* =====================================================================
   SQUIRREL VALENTINE (bản HTML canvas, chuyển từ file pygame 11_squirrel_valentine.py)

   Câu chuyện: sóc chạy vào, giương cung bắn 3 mũi tên: 2 phát trượt,
   phát 3 trúng con dấu -> thư mở ra, hiện YES / NO. Bấm NO thì nút NO
   chạy trốn (tối đa 5 lần rồi biến mất). Bấm YES -> thư cảm ơn + mưa tim,
   sau đó cảnh mờ dần sang vườn hoa (window.startFlowers() ở main.js).
   ===================================================================== */
(function () {
  'use strict';

  var cv = document.getElementById('squirrel-scene');
  if (!cv) return;

  try {
    boot();
  } catch (err) {
    // có lỗi thì bỏ qua cảnh sóc, vào thẳng vườn hoa
    if (window.console) console.error(err);
    if (cv.parentNode) cv.parentNode.removeChild(cv);
    if (window.startFlowers) window.startFlowers();
  }

  function boot() {
    var g0 = cv.getContext('2d');
    var g = g0;                       // ngữ cảnh vẽ hiện tại (đổi khi vẽ vào canvas phụ)
    var TAU = Math.PI * 2;

    // ============================== CẤU HÌNH ==============================
    var H = 700;
    var GROUND = H - 60;              // mép cỏ trên mặt đất
    var LY = 292;                     // tâm bức thư theo chiều dọc
    var ENV_W = 210, ENV_H = 132;     // kích thước phong bì
    var STOP_X = 150;                 // sóc dừng ở đây
    var BOW_ORIGIN = [STOP_X + 46, GROUND - 118];
    var G_FORCE = 420.0;
    var ARROW_LEN = 110.0;
    var PULL_TRAVEL = 56.0;
    var MAX_NO_DODGES = 5;

    // chiều rộng thế giới tuỳ theo tỉ lệ màn hình (điện thoại dọc thì hẹp hơn)
    var W = Math.round(clamp(H * (window.innerWidth || 1000) / (window.innerHeight || 700), 760, 1000));
    var LX = W / 2;                   // tâm bức thư theo chiều ngang

    var TH = {
      sky_top: [44, 26, 60], sky_mid: [140, 66, 114], sky_lo: [252, 176, 186],
      ground: [100, 54, 104], ground_hi: [184, 112, 156], ground_dark: [52, 28, 62],
      glow: [255, 178, 206], heart: [255, 120, 156], text: [255, 236, 242]
    };

    // ============================== TIỆN ÍCH ==============================
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function easeInOut(t) { return t * t * (3 - 2 * t); }
    function easeOutBack(t) {
      var c1 = 1.70158, c3 = 2.70158;
      t -= 1.0;
      return 1.0 + c3 * t * t * t + c1 * t * t;
    }
    function mix(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    function css(c) {
      if (typeof c === 'string') return c;
      return 'rgb(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
        Math.round(clamp(c[2], 0, 255)) + ')';
    }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function irand(a, b) { return Math.floor(rand(a, b + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    // ---- hàm vẽ cơ bản ----
    function circle(c, x, y, r) {
      if (r <= 0) return;
      g.fillStyle = css(c); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    function circleLine(c, x, y, r, w) {
      g.strokeStyle = css(c); g.lineWidth = Math.max(1, w);
      g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.stroke();
    }
    function ellipseR(c, x, y, w, h) {          // elip nội tiếp hình chữ nhật (x, y, w, h)
      g.fillStyle = css(c); g.beginPath();
      g.ellipse(x + w / 2, y + h / 2, Math.max(0, w / 2), Math.max(0, h / 2), 0, 0, TAU); g.fill();
    }
    function line(c, x1, y1, x2, y2, w) {
      g.strokeStyle = css(c); g.lineWidth = w; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    function polyPath(pts, close) {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      if (close) g.closePath();
    }
    function poly(c, pts, w) {
      polyPath(pts, true);
      if (w) { g.strokeStyle = css(c); g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); }
      else { g.fillStyle = css(c); g.fill(); }
    }
    function polyline(c, pts, w) {
      polyPath(pts, false);
      g.strokeStyle = css(c); g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'butt'; g.stroke();
    }
    function rrPath(x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      g.beginPath();
      g.moveTo(x + r, y);
      g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
      g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
      g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
      g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r);
      g.closePath();
    }
    function fillRR(c, x, y, w, h, r) { rrPath(x, y, w, h, r); g.fillStyle = css(c); g.fill(); }
    function strokeRR(c, x, y, w, h, lw, r) {
      rrPath(x + lw / 2, y + lw / 2, w - lw, h - lw, r - lw / 2);
      g.strokeStyle = css(c); g.lineWidth = lw; g.stroke();
    }
    function heart(x, y, size, color, thickness, rot, pts) {
      pts = pts || 40; thickness = thickness || 0; rot = rot || 0;
      var k = size / 17.0, co = Math.cos(rot), si = Math.sin(rot);
      g.beginPath();
      for (var i = 0; i < pts; i++) {
        var t = TAU * i / pts;
        var px = 16.0 * Math.pow(Math.sin(t), 3);
        var py = -(13.0 * Math.cos(t) - 5.0 * Math.cos(2 * t) - 2.0 * Math.cos(3 * t) - Math.cos(4 * t));
        if (rot) { var qx = px * co - py * si, qy = px * si + py * co; px = qx; py = qy; }
        if (i === 0) g.moveTo(x + px * k, y + py * k); else g.lineTo(x + px * k, y + py * k);
      }
      g.closePath();
      if (thickness <= 0) { g.fillStyle = css(color); g.fill(); }
      else { g.strokeStyle = css(color); g.lineWidth = thickness; g.stroke(); }
    }
    function font(size) { return 'bold ' + Math.round(size) + 'px Arial, Helvetica, sans-serif'; }
    function text(str, x, y, size, color) {
      g.font = font(size); g.fillStyle = css(color);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, x, y);
    }

    // ============================== MÀN HÌNH ==============================
    var dpr = 1, vw = 0, vh = 0, sc = 1, ox = 0, oy = 0;
    var bg = document.createElement('canvas');

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth; vh = window.innerHeight;
      cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
      sc = Math.min(vw / W, vh / H);
      ox = (vw - W * sc) / 2; oy = (vh - H * sc) / 2;
      buildBackground();
    }
    function toLogical(e) {
      var r = cv.getBoundingClientRect();
      return [(e.clientX - r.left - ox) / sc, (e.clientY - r.top - oy) / sc];
    }

    // ============================== NỀN: TRỜI + ĐỒI ==============================
    function buildBackground() {
      bg.width = cv.width; bg.height = cv.height;
      var b = bg.getContext('2d');
      var saved = g; g = b;
      g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);

      // vùng thế giới nhìn thấy (mở rộng ra ngoài khung 1000x700 để phủ kín màn hình)
      var x0 = -ox / sc - 4, x1 = W + ox / sc + 4, y0 = -oy / sc - 4, y1 = H + oy / sc + 4;
      var th = TH;

      // trời gradient 3 lớp
      var grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, css(th.sky_top));
      grad.addColorStop(0.55, css(th.sky_mid));
      grad.addColorStop(1, css(th.sky_lo));
      g.fillStyle = grad;
      g.fillRect(x0, y0, x1 - x0, y1 - y0);

      // vầng sáng chân trời
      for (var i = 0; i < 4; i++) {
        var rad = 90 + i * 70;
        circle('rgba(' + th.glow[0] + ',' + th.glow[1] + ',' + th.glow[2] + ',' + ((34 - 8 * i) / 255) + ')',
          W / 2, GROUND + 8, rad);
      }
      var areaK = ((x1 - x0) * (GROUND - 200 - y0)) / (W * (GROUND - 200));
      var rng = mulberry32(11);
      var n = Math.ceil(16 * areaK);
      for (i = 0; i < n; i++) {
        var px = x0 + rng() * (x1 - x0), py = y0 + rng() * (GROUND - 200 - y0);
        var rr = 14 + rng() * 26, kk = 0.05 + rng() * 0.07;
        circle('rgba(' + th.glow[0] + ',' + th.glow[1] + ',' + th.glow[2] + ',' + kk + ')', px, py, rr);
      }
      // sao thưa
      rng = mulberry32(13);
      n = Math.ceil(70 * ((x1 - x0) * (GROUND - 150 - y0)) / (W * (GROUND - 150)));
      for (i = 0; i < n; i++) {
        px = x0 + rng() * (x1 - x0); py = y0 + rng() * (GROUND - 150 - y0);
        var k = 0.45 + rng() * 0.55;
        circle([250 * k, 248 * k, 255 * k], px, py, 1);
      }

      // đồi: 3 gò lồng nhau
      var base = th.ground, hi = th.ground_hi, dark = th.ground_dark;
      function crest(x, top, amp, ph) {
        return top + amp * Math.sin(x * 0.009 + ph) + amp * 0.4 * Math.sin(x * 0.019 + ph * 2.1);
      }
      function mound(top, amp, ph, col) {
        var pts = [[x0, y1]];
        for (var x = Math.floor(x0 / 7) * 7; x <= x1 + 7; x += 7) pts.push([x, crest(x, top, amp, ph)]);
        pts.push([x1 + 7, y1]);
        poly(col, pts);
      }
      mound(GROUND + 14, 8, 1.2, base);
      mound(GROUND + 42, 12, 3.5, mix(base, hi, 0.20));
      mound(GROUND + 78, 10, 5.6, dark);
      // viền sáng
      var rim = mix(hi, [255, 255, 255], 0.45);
      for (var x = Math.floor(x0 / 3) * 3; x < x1; x += 3) circle(rim, x, crest(x, GROUND + 14, 8, 1.2), 2);
      // cỏ + hoa nhỏ
      rng = mulberry32(7);
      n = Math.ceil(70 * (x1 - x0) / W);
      for (i = 0; i < n; i++) {
        px = x0 + rng() * (x1 - x0);
        py = crest(px, GROUND + 42, 12, 3.5) + 2 + rng() * 28;
        var hh = 4 + rng() * 4;
        line(mix(hi, dark, 0.6), px, py, px, py - hh, 1);
      }
      n = Math.ceil(14 * (x1 - x0) / W);
      for (i = 0; i < n; i++) {
        px = x0 + rng() * (x1 - x0);
        py = crest(px, GROUND + 42, 12, 3.5) + 6 + rng() * 28;
        circle(mix(th.heart, dark, 0.3), px, py, 2);
      }
      g = saved;
    }

    // ============================== CUNG VÀ MŨI TÊN ==============================
    function bowGeometry(gx, gy, ang, pull) {
      var ux = Math.cos(ang), uy = Math.sin(ang);
      var px = -Math.sin(ang), py = Math.cos(ang);
      var flex = PULL_TRAVEL * pull * 0.6, LEN = 84.0;
      return {
        tip1: [gx + px * LEN - ux * flex, gy + py * LEN - uy * flex],
        tip2: [gx - px * LEN - ux * flex, gy - py * LEN - uy * flex],
        nock: [gx - ux * (14.0 + PULL_TRAVEL * pull), gy - uy * (14.0 + PULL_TRAVEL * pull)],
        u: [ux, uy], p: [px, py], grip: [gx, gy]
      };
    }
    function drawBow(geom) {
      var tip1 = geom.tip1, tip2 = geom.tip2, nock = geom.nock;
      var ux = geom.u[0], uy = geom.u[1], gx = geom.grip[0], gy = geom.grip[1];
      var mid = [(tip1[0] + tip2[0]) / 2, (tip1[1] + tip2[1]) / 2];
      var flex = (mid[0] - gx) * ux + (mid[1] - gy) * uy;
      var bulge = -flex + 10.0;
      var pts = [], bs = [-1.0, -0.5, 0.0, 0.5, 1.0];
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i];
        var qx = tip1[0] + (tip2[0] - tip1[0]) * (b + 1) / 2;
        var qy = tip1[1] + (tip2[1] - tip1[1]) * (b + 1) / 2;
        var bb = bulge * (1 - b * b);
        pts.push([qx + ux * bb, qy + uy * bb]);
      }
      polyline([92, 48, 22], pts, 7);
      polyline([126, 74, 40], pts, 4);
      var sc2 = [205, 210, 226];
      line(sc2, tip1[0], tip1[1], nock[0], nock[1], 3);
      line(sc2, nock[0], nock[1], tip2[0], tip2[1], 3);
    }
    function drawArrow(tipx, tipy, ang, len) {
      len = len || ARROW_LEN;
      var ux = Math.cos(ang), uy = Math.sin(ang);
      var tailx = tipx - ux * len, taily = tipy - uy * len;
      line([190, 170, 150], tailx, taily, tipx, tipy, 4);
      var sides = [-1, 1], i, side;
      for (i = 0; i < 2; i++) {
        side = sides[i];
        var bx = tailx + ux * 8, by = taily + uy * 8;
        poly([235, 120, 70], [
          [bx, by],
          [bx - ux * 20 + side * uy * 12, by - uy * 20 - side * ux * 12],
          [bx - ux * 4 + side * uy * 4, by - uy * 4 - side * ux * 4]]);
      }
      var head = [[tipx, tipy]];
      for (i = 0; i < 2; i++) {
        side = i === 0 ? 1 : -1;
        head.push([tipx - ux * 16 + side * uy * 8, tipy - uy * 16 - side * ux * 8]);
      }
      poly([225, 215, 205], head);
      // quầng sáng mềm quanh mũi tim
      var pg = 14.0;
      g.save();
      g.globalCompositeOperation = 'lighter';
      var rg = g.createRadialGradient(tipx, tipy, 0, tipx, tipy, pg * 1.9);
      rg.addColorStop(0, 'rgba(255,120,160,0.6)');
      rg.addColorStop(1, 'rgba(255,120,160,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(tipx, tipy, pg * 1.9, 0, TAU); g.fill();
      g.restore();
      heart(tipx, tipy, pg, [255, 90, 130]);
      heart(tipx - 2, tipy - 2, pg * 0.55, [255, 60, 100]);
    }

    // ============================== CON SÓC ==============================
    var SKIN = [224, 150, 76], SKIN_D = [164, 104, 48], BELLY = [255, 234, 214],
      TIP = [255, 249, 234], TW = [74, 44, 22], PINK = [255, 150, 178];
    var WHITE = [255, 255, 255], BLACK = [0, 0, 0];

    function Squirrel() {
      this.x = -70.0; this.walk_ph = 0.0;
      this.pose = 'walk';              // walk | idle | aim | sad
      this.expr = 'happy';             // happy | concentrate | sad | giggle
      this.ear_droop = 0.0; this.blink = 0.0; this.bob = 0.0; this.pull = 0.0;
      this.aim = null;                 // [grip, nock, ux, uy]
    }
    Squirrel.prototype._tail = function (fx, t, sway) {
      var bx = fx - 11, by = GROUND - 48;
      var c = Math.cos(sway), s = Math.sin(sway);
      function pt(ang, r) {
        var ox_ = r * Math.cos(ang), oy_ = r * Math.sin(ang) * 0.92;
        return [bx + ox_ * c - oy_ * s, by + ox_ * s + oy_ * c];
      }
      var blobs = [[-2.15, 20, 18], [-2.70, 14, 16], [-3.10, 7, 15]], i, p;
      for (i = 0; i < blobs.length; i++) {
        p = pt(blobs[i][0], blobs[i][1]); circle(SKIN_D, p[0] + 3, p[1] + 3, blobs[i][2]);
      }
      for (i = 0; i < blobs.length; i++) {
        var col = i < 2 ? SKIN : mix(SKIN, TIP, (i - 1) * 0.6);
        p = pt(blobs[i][0], blobs[i][1]); circle(col, p[0], p[1], blobs[i][2]);
      }
      var tp = pt(-3.25, 5);
      circle(TIP, tp[0], tp[1], 13);
      circle(mix(TIP, WHITE, 0.5), tp[0], tp[1], 5);
      var das = [-0.5, 0.0, 0.5];
      for (i = 0; i < 3; i++) { p = pt(-3.25 + das[i], 7); circle(TIP, p[0], p[1], 4); }
    };
    Squirrel.prototype._legs = function (fx) {
      var step = this.pose === 'walk' ? 1.0 : 0.0;
      var ph = this.pose === 'walk' ? this.walk_ph : Math.PI / 2;
      var combos = [[false, 1], [true, -1]];
      for (var i = 0; i < 2; i++) {
        var back = combos[i][0], kf = combos[i][1];
        var lx = fx - 2 + kf * 3;
        var s1 = Math.sin(ph + (back ? 0 : Math.PI)) * 7 * step;
        line(SKIN_D, lx, GROUND - 20, lx + s1, GROUND - 6, 6);
        ellipseR(TW, lx + s1 - 6, GROUND - 7, 12, 6);
        ellipseR(mix(TW, [150, 96, 56], 0.45), lx + s1 - 6, GROUND - 8, 10, 3);
      }
    };
    Squirrel.prototype.draw = function (t) {
      var fx = this.x, bob = this.bob;
      var sway = Math.sin(t * 2.1) * 0.14;
      if (this.pose === 'walk') sway += 0.25 * Math.sin(this.walk_ph * 1.3);
      this._tail(fx, t, sway);
      this._legs(fx);
      ellipseR(mix(SKIN_D, [20, 8, 20], 0.5), fx - 21, GROUND - 4, 42, 5);   // bóng dưới chân

      // thân
      ellipseR(SKIN_D, fx - 19, GROUND - 69 + bob, 36, 48);
      ellipseR(SKIN, fx - 18, GROUND - 67 + bob, 34, 45);
      ellipseR(BELLY, fx - 5, GROUND - 63 + bob, 22, 36);
      ellipseR(mix(BELLY, WHITE, 0.55), fx + 3, GROUND - 58 + bob, 8, 17);

      // tay trước
      var sf = [fx + 2, GROUND - 66 + bob], sb = [fx - 4, GROUND - 65 + bob];
      var aiming = this.aim && (this.pose === 'aim' || this.pose === 'walk');
      if (aiming) {
        var gX = this.aim[0][0], gY = this.aim[0][1];
        line(SKIN_D, sf[0] + 1, sf[1] + 1, gX + 1, gY + 1, 6);
        line(SKIN, sf[0], sf[1], gX, gY, 5);
        circle(PINK, gX, gY, 5);
        circle(mix(PINK, WHITE, 0.35), gX, gY, 2);
      } else {
        line(SKIN_D, sf[0] + 1, sf[1] + 1, fx + 15, GROUND - 55 + bob, 6);
        line(SKIN, sf[0], sf[1], fx + 14, GROUND - 56 + bob, 5);
        circle(PINK, fx + 15, GROUND - 57 + bob, 5);
      }

      // đầu
      var hx = fx - 1, hy = GROUND - 84 + bob;
      circle(SKIN_D, hx + 2, hy + 2, 18);
      circle(SKIN, hx, hy, 18);
      var tufts = [[-7, -14, 4], [-3, -17, 4], [2, -15, 4]], i;
      for (i = 0; i < 3; i++) circle(mix(SKIN, TIP, 0.3), hx + tufts[i][0], hy + tufts[i][1], tufts[i][2]);
      // tai
      var droop = 8 * this.ear_droop, sides = [1, -1];
      for (i = 0; i < 2; i++) {
        var side = sides[i];
        var ex = hx - 2 + side * 6, ey = hy - 11;
        var dx_ = ex - 4 + side * 2, dy_ = ey - 11 + droop;
        poly(SKIN_D, [[ex - 1, ey + 1], [dx_ + 1, dy_ + 1], [ex + 3, ey + 5]]);
        poly(SKIN, [[ex, ey], [dx_, dy_], [ex + 4, ey + 6]]);
        poly(PINK, [[ex + 2, ey + 1], [dx_ + 2, dy_ + 1], [ex + 3, ey + 5]]);
        var tx_ = dx_ - side * 2, ty_ = dy_ + 4;
        line(TW, tx_, ty_, tx_ - side * 3, ty_ - 4, 2);
      }
      // mõm, mũi, râu
      ellipseR(BELLY, hx + 5, hy - 2, 15, 12);
      circle(TW, hx + 19, hy + 3, 3);
      circle(WHITE, hx + 21, hy + 2, 1);
      var whisk = mix(TW, WHITE, 0.4);
      line(whisk, hx + 20, hy + 4, hx + 30, hy + 1, 1);
      line(whisk, hx + 20, hy + 6, hx + 30, hy + 8, 1);
      // má hồng
      circle(PINK, hx + 8, hy + 9, 4);
      circle(mix(PINK, WHITE, 0.35), hx + 7, hy + 8, 2);
      // mắt
      // hai mắt cùng độ cao, cùng kích cỡ, cách đều nhau, không chạm nhau
      var eyes = [[hx + 1, hy - 5, 4.4], [hx + 13, hy - 5, 4.4]];
      for (i = 0; i < 2; i++) {
        if (this.expr === 'giggle') break;                 // cười thì chỉ vẽ mắt ^ ^ bên dưới
        var exi = eyes[i][0], eyi = eyes[i][1], r = eyes[i][2] * (1.0 - 0.8 * this.blink);
        var rw = r + 1.8;                                  // bán kính tròng trắng
        circle([66, 40, 30], exi + 0.8, eyi + 0.8, rw + 0.8);
        circle(WHITE, exi, eyi, rw);
        circle([36, 22, 18], exi + r * 0.3, eyi + r * 0.12, r * 0.86);
        circle(WHITE, exi + r * 0.55, eyi - r * 0.4, Math.max(1.6, r * 0.34));
        circle(WHITE, exi - r * 0.25, eyi + r * 0.4, Math.max(0.9, r * 0.17));
      }
      // lông mày / miệng
      if (this.expr === 'sad') {
        line(TW, hx - 2, hy - 11, hx + 4, hy - 13, 2);          // buồn: đầu mày trong nhướng lên
        line(TW, hx + 10, hy - 13, hx + 16, hy - 11, 2);
        polyline(TW, [[hx + 8, hy + 11], [hx + 11, hy + 13], [hx + 14, hy + 11]], 2);
      } else if (this.expr === 'concentrate') {
        line(TW, hx - 2, hy - 12, hx + 4, hy - 10, 2);          // tập trung: nhíu nhẹ
        line(TW, hx + 10, hy - 10, hx + 16, hy - 12, 2);
        line(TW, hx + 9, hy + 10, hx + 10, hy + 9, 2);
      } else if (this.expr === 'giggle') {
        var ge = [[hx + 1, hy - 5], [hx + 13, hy - 5]];
        for (i = 0; i < 2; i++) {
          g.strokeStyle = css(TW); g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath();
          g.ellipse(ge[i][0], ge[i][1] + 1.5, 4.2, 3.4, 0, Math.PI, TAU); g.stroke();   // mắt cười ^ ^
          g.lineCap = 'butt';
        }
        circle(PINK, hx + 10, hy + 11, 3);
      } else {
        polyline(TW, [[hx + 7, hy + 9], [hx + 10, hy + 8], [hx + 13, hy + 9]], 2);
      }
      // tay sau kéo dây
      if (aiming) {
        var nX = this.aim[1][0], nY = this.aim[1][1];
        line(SKIN_D, sb[0] + 1, sb[1] + 1, nX + 1, nY + 1, 6);
        line(SKIN, sb[0], sb[1], nX, nY, 5);
        circle(PINK, nX, nY, 5);
        circle(mix(PINK, WHITE, 0.35), nX, nY, 2);
      }
    };

    // ============================== BỨC THƯ ==============================
    var ENV = [246, 228, 210], ENV_D = [198, 162, 144];
    var SS = 2;                                    // độ phân giải canvas giấy thư (nét hơn)

    function makeSheet(w, h, draw) {
      var c = document.createElement('canvas');
      c.width = w * SS; c.height = h * SS;
      var saved = g; g = c.getContext('2d'); g.scale(SS, SS);
      draw(w, h);
      g = saved;
      return c;
    }
    function buildPaper() {
      return makeSheet(200, 124, function (w, h) {
        fillRR([255, 250, 241], 0, 0, w, h, 10);
        strokeRR([226, 206, 187], 0, 0, w, h, 2, 10);
        text('Thíc chơi game', w / 2, 31, 24, [154, 56, 92]);
        heart(w / 2, 60, 7, [242, 92, 128]);
        text('với anh không =))', w / 2, 82, 20, [186, 96, 126]);
      });
    }
    function buildThanks() {
      return makeSheet(224, 104, function (w, h) {
        fillRR([255, 252, 246], 0, 0, w, h, 10);
        strokeRR([232, 198, 166], 0, 0, w, h, 2, 10);
        text('Anh biết mà', w / 2, 24, 22, [130, 40, 70]);
        heart(w / 2, 54, 8, [250, 80, 120]);
        text('hihi=))))', w / 2, 84, 19, [160, 70, 100]);
      });
    }

    function Letter(x, y) {
      this.x = x; this.y = y;
      this.hit = false; this.wob = 0.0; this.wob_amp = 0.0;
      this.open_t = 0.0; this.reveal = 0.0; this.sheet = null; this.timer = 0.0;
      this.closing = false; this.closed = false; this.pop = 1.0;
    }
    Letter.prototype.hitLetter = function () { this.hit = true; this.wob = 0.9; this.wob_amp = 9.0; };
    Letter.prototype.beginClose = function () { this.closing = true; this.closed = false; };
    Letter.prototype.beginOpen = function () { this.hit = true; this.closed = false; };
    Letter.prototype.beginPop = function () { this.pop = 0.0; };
    Object.defineProperty(Letter.prototype, 'isOpen', {
      get: function () { return this.open_t >= 1.0 && this.reveal >= 1.0; }
    });
    Letter.prototype.update = function (dt) {
      this.timer += dt;
      if (this.pop < 1.0) this.pop = Math.min(1.0, this.pop + dt / 0.5);
      if (!this.hit || this.closed) return;
      if (this.wob > 0) { this.wob -= dt; return; }
      if (this.closing) {
        if (this.open_t > 0.0) this.open_t = Math.max(0.0, this.open_t - dt / 1.1);
        this.reveal = Math.max(0.0, Math.min(this.reveal, (this.open_t - 0.55) / 0.45));
        if (this.open_t <= 0.0 && this.reveal <= 0.0) { this.closing = false; this.closed = true; }
      } else {
        if (this.open_t < 1.0) this.open_t = Math.min(1.0, this.open_t + dt / 2.2);
        var target = (this.open_t - 0.55) / 0.45;
        this.reveal = Math.min(1.0, Math.max(this.reveal, target));
        if (target >= 1.0 - 1e-9) this.reveal = 1.0;
      }
    };
    Letter.prototype.draw = function () {
      var wx = this.x, wy = this.y, rot = 0.0;
      if (this.wob > 0) {
        var wk = this.wob / 0.9;
        rot = Math.sin(this.timer * 26) * this.wob_amp * wk * Math.PI / 180;   // độ -> radian
        wx += Math.sin(this.timer * 30) * this.wob_amp * 0.35 * wk;
      }
      var scale = 1.25 * easeOutBack(Math.min(1.0, this.pop));
      var hw = ENV_W / 2.0, hh = ENV_H / 2.0, top = -hh, left = -hw;
      var phi = Math.PI * easeInOut(Math.min(1.0, this.open_t * 1.4));
      var flapUp = phi > Math.PI / 2;

      g.save();
      g.translate(wx, wy); g.rotate(rot); g.scale(scale, scale);

      if (flapUp) this._flap(0, top, hw, hh, phi, !this.closed);

      // bóng + thân phong bì
      ellipseR(mix([40, 16, 42], BLACK, 0.5), -hw * 0.7, top + 2 * hh + 13 - 6, hw * 1.4, 12);
      var body = [[left, top], [left + 2 * hw, top], [left + 2 * hw, top + 2 * hh], [left, top + 2 * hh]];
      poly(ENV, body);
      poly([248, 232, 206], body, 4);
      poly([198, 162, 144], body, 2);
      var corners = [[left, top], [left + 2 * hw, top], [left, top + 2 * hh], [left + 2 * hw, top + 2 * hh]], i;
      for (i = 0; i < 4; i++) line(ENV_D, corners[i][0], corners[i][1], 0, 0, 1);
      // khe cài
      var slotTop = top + hh * 0.08;
      fillRR([224, 190, 150], left + 4, slotTop, 2 * hw - 8, 8, 2);
      strokeRR([182, 138, 104], left + 4, slotTop, 2 * hw - 8, 8, 1, 2);
      heart(0, slotTop + 2, 5, [242, 92, 128]);
      // trái tim lớn trên phong bì
      if (!flapUp || this.closed) {
        heart(0, 0, 22, [255, 20, 70]);
        heart(0, 0, 15, [255, 160, 190]);
        heart(0, 0, 9, WHITE);
      }

      // giấy thư trượt ra
      if (this.sheet && this.open_t > 0.35) {
        var sw = this.sheet.width / SS, sh = this.sheet.height / SS;
        var vis = Math.floor(sh * clamp(this.reveal, 0.0, 1.0));
        if (vis > 0) {
          var px = -sw / 2 - 4, py = (top + hh - vis) - 4, pw = sw + 8, ph = vis + 8;
          var self = this;
          var paper = function (dx, dy) {
            fillRR([255, 252, 245], px + dx, py + dy, pw, ph, 8);
            strokeRR([222, 188, 156], px + dx, py + dy, pw, ph, 3, 8);
            strokeRR([190, 146, 110], px + dx, py + dy, pw, ph, 1, 8);
            g.drawImage(self.sheet, 0, 0, self.sheet.width, vis * SS, px + dx + 4, py + dy + 4, sw, vis);
          };
          fillRR('rgba(0,0,0,0.27)', px + 3, py + 3, pw, ph, 8);   // bóng
          g.globalAlpha = 0.12; paper(-2, -2); g.globalAlpha = 1.0;  // quầng nhẹ
          paper(0, 0);
        }
      }
      if (!flapUp) this._flap(0, top, hw, hh, phi, !this.closed);
      g.restore();
    };
    Letter.prototype._flap = function (x, top, hw, hh, phi, seal) {
      var n = hh * Math.cos(phi);        // >0: nắp úp xuống thư; <0: nắp lật lên trên
      if (Math.abs(n) < 2) return;
      var tri = [[x - hw, top], [x, top + n], [x + hw, top]];
      poly(ENV, tri);
      poly(ENV_D, tri, 2);
      line(mix(ENV, WHITE, 0.4), x - hw * 0.5, top + n * 0.2, x, top + n * 0.75, 2);
      if (seal && !this.closed) {
        var sx = x, sy = top + n * 0.8, ss = 11 + 2.5 * Math.sin(this.timer * 3);
        heart(sx, sy, ss + 3, mix(TH.glow, [70, 0, 26], 0.45));
        heart(sx, sy, ss, TH.glow);
        circle(WHITE, sx - ss * 0.25, sy - ss * 0.3, Math.max(2, Math.floor(ss * 0.15)));
      }
    };

    // ============================== NÚT BẤM ==============================
    function Button(cx, cy, label, bw, bh) {
      this.cx = cx; this.cy = cy; this.label = label; this.bw = bw; this.bh = bh;
      this.scale = 1.0; this.target = null; this.hover = false;
      this.visible = true; this.fade = 1.0; this.pop = 0.0;
    }
    Button.prototype.rect = function () {
      var w = this.bw * this.scale, h = this.bh * this.scale;
      return { x: this.cx - w / 2, y: this.cy - h / 2, w: w, h: h };
    };
    Button.prototype.contains = function (p) {
      var r = this.rect();
      return p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
    };
    Button.prototype.update = function (dt) {
      if (this.target && this.visible) {
        var a = Math.min(1.0, dt * 7.0);
        if (Math.abs(this.cx - this.target[0]) > 1 || Math.abs(this.cy - this.target[1]) > 1) {
          this.cx += (this.target[0] - this.cx) * a;
          this.cy += (this.target[1] - this.cy) * a;
        } else this.target = null;
      }
      this.pop = Math.max(0.0, this.pop - dt * 4.0);
    };
    Button.prototype.draw = function (fill, edge, glowCol) {
      if (!this.visible || this.fade <= 0.0) return;
      var r = this.rect(), k = 1.0 + 0.06 * (this.hover ? 1 : 0) + this.pop;
      var w = r.w * k, h = r.h * k, x = this.cx - w / 2, y = this.cy - h / 2;
      g.save();
      g.globalAlpha = Math.min(1.0, this.fade);
      var i;
      if (this.hover || this.pop > 0.01) {
        for (i = 4; i > 0; i--) {
          strokeRR(mix(glowCol, BLACK, 0.45), x - i * 4.5, y - i * 4.5, w + i * 9, h + i * 9, 2, (h + i * 9) / 2);
        }
      }
      fillRR(mix(edge, [20, 8, 16], 0.35), x - 4, y - 4, w + 8, h + 8, h / 2 + 4);
      fillRR(fill, x, y, w, h, h / 2);
      fillRR(mix(fill, WHITE, 0.5), x + 4, y + 4, w - 8, h / 2 - 4, h / 2);
      fillRR(mix(fill, WHITE, 0.12), x + 4, y + h / 2, w - 8, h / 2 - 4, h / 2);
      var fs = Math.max(22, Math.floor(28 * h / 56));
      text(this.label, this.cx, this.cy + 2, fs, mix(edge, [40, 10, 30], 0.6));
      text(this.label, this.cx, this.cy, fs, WHITE);
      g.restore();
    };

    // ============================== GAME ==============================
    var WALK = 0, AIM = 1, SAD = 2, HIT = 3, OPEN = 4, ASK = 5, THANKS = 7, END = 8;

    function Game() {
      this.t = 0.0;
      this.phase = WALK;
      this.squirrel = new Squirrel();
      this.letter = new Letter(LX, LY);
      this.letter.sheet = buildPaper();
      this.shot = null; this.shot_num = 0; this.aim_stage = 0; this.aim_t = 0.0;
      this.arrow = null; this.stuck = []; this.sad_t = 0.0;
      this.sparks = []; this.rings = []; this.burst = []; this.petals = [];
      this.yes = new Button(LX + 160, 540, 'Cóoooo', 132, 58);
      this.no = new Button(LX - 160, 540, 'không', 118, 58);
      this.no_presses = 0; this.no_gone = false; this.ask_t = 0.0;
      this.blink_t = 2.0; this.giggle_t = 0.0;
      this.thanks_t = 0.0; this.thanks_letter = null;
      this.heart_rain_t = 0.0; this.firework_t = 0.0;
      this.mouse = [W / 2, H / 2]; this.mouseType = '';
      this.stopped = false;
    }

    // ---- vật lý cú bắn ----
    Game.prototype.makeShot = function (win) {
      var gx = BOW_ORIGIN[0], gy = BOW_ORIGIN[1], T = 1.05, tx, ty;
      if (win) { tx = LX; ty = LY; }
      else if (this.shot_num === 0) { tx = W + 10; ty = GROUND - 6; T = 3.10; }  // vọt qua thư
      else { tx = 300; ty = GROUND - 6; T = 0.9; }                               // cắm cỏ trước thư
      var vx = (tx - gx) / T, vy = (ty - gy - 0.5 * G_FORCE * T * T) / T;
      var ang = Math.atan2(vy, vx);
      var ux = Math.cos(ang), uy = Math.sin(ang);
      for (var i = 0; i < 3; i++) {
        vx = (tx - gx - ux * 40.0) / T;
        vy = (ty - gy - uy * 40.0 - 0.5 * G_FORCE * T * T) / T;
        ang = Math.atan2(vy, vx); ux = Math.cos(ang); uy = Math.sin(ang);
      }
      return { tx: tx, ty: ty, T: T, vx: vx, vy: vy, ang: ang, win: win, ox: ux * 40.0, oy: uy * 40.0 };
    };
    Game.prototype.bowGeom = function (pull) {
      var geom = bowGeometry(BOW_ORIGIN[0], BOW_ORIGIN[1], this.shot.ang, pull);
      this.squirrel.aim = [geom.grip, geom.nock, geom.u[0], geom.u[1]];
      return geom;
    };
    Game.prototype.beginShot = function (win) {
      this.shot = this.makeShot(win);
      this.shot_num += 1; this.aim_stage = 0; this.aim_t = 0.0; this.arrow = null;
      this.phase = AIM;
      this.squirrel.pose = 'aim'; this.squirrel.expr = 'concentrate'; this.squirrel.ear_droop = 0.0;
    };
    Game.prototype.fire = function () {
      var s = this.shot;
      if (s.win) this.squirrel.expr = 'happy';
      this.arrow = { tt: 0.0, T: s.T, vx: s.vx, vy: s.vy, win: s.win, ang: s.ang, ox: s.ox, oy: s.oy };
      this.squirrel.pull = 0.0;
    };
    Game.prototype.puff = function (x, y) {
      for (var i = 0; i < 9; i++) {
        this.sparks.push({ x: x, y: y, vx: rand(-60, 60), vy: rand(-150, -20), tt: 0.0,
          life: rand(0.5, 0.9), col: [214, 182, 150], sz: 3 });
      }
    };
    Game.prototype.sadFace = function () {
      this.phase = SAD; this.sad_t = 1.15;
      this.squirrel.pose = 'sad'; this.squirrel.expr = 'sad'; this.squirrel.ear_droop = 1.0;
    };
    Game.prototype.resolveArrow = function () {
      var a = this.arrow;
      if (!a) return;
      var tt = a.tt;
      var bx = BOW_ORIGIN[0] + a.ox, by = BOW_ORIGIN[1] + a.oy;
      var tipx = bx + a.vx * tt, tipy = by + a.vy * tt + 0.5 * G_FORCE * tt * tt;
      var vy = a.vy + G_FORCE * tt;
      if (a.win && tt >= a.T) {
        this.arrow = null;
        this.letter.hitLetter();
        this.stuck.push([tipx, tipy, Math.atan2(vy, a.vx), true]);
        for (var i = 0; i < 10; i++) {
          this.sparks.push({ x: tipx, y: tipy, vx: rand(-160, 160), vy: rand(-260, 40), tt: 0.0,
            life: rand(0.4, 0.8), col: TH.glow, sz: 3 });
        }
        this.phase = HIT; this.squirrel.expr = 'happy';
        return;
      }
      if (!a.win && tt >= a.T) {
        var hw = ENV_W / 2.0 + 6, hh = ENV_H / 2.0 + 6;
        if (this.letter.x - hw <= tipx && tipx <= this.letter.x + hw &&
            this.letter.y - hh <= tipy && tipy <= this.letter.y + hh) {
          this.arrow = null;
          this.letter.hitLetter();
          this.stuck.push([tipx, tipy, Math.atan2(vy, a.vx), true]);
          this.puff(tipx, tipy);
          this.sadFace();
          return;
        }
      }
      if (!a.win && tipy >= GROUND - 12) {
        this.arrow = null;
        this.stuck.push([tipx, GROUND - 8, Math.atan2(vy, a.vx), false]);
        this.puff(tipx, GROUND - 10);
        this.sadFace();
      }
    };

    // ---- cập nhật ----
    Game.prototype.update = function (dt) {
      this.t += dt;
      var sq = this.squirrel;
      sq.blink = 0.0;
      this.updateParticles(dt);
      this.letter.update(dt);

      if (this.phase === WALK) {
        if (sq.x < STOP_X - 6) {
          sq.x += 98.0 * dt; sq.pose = 'walk';
          sq.walk_ph += dt * 11.0; sq.bob = Math.sin(sq.walk_ph) * 2.2;
        } else {
          sq.x = STOP_X - 6; sq.pose = 'idle'; sq.bob = 0.0; sq.walk_ph = 0.0;
          this.beginShot(false);
        }
      } else if (this.phase === AIM) {
        this.advanceAim(dt);
        if (this.arrow) {
          var a = this.arrow;
          a.tt += dt;
          if (a.win && a.tt >= a.T) this.resolveArrow();
          else if (!a.win) {
            var by = BOW_ORIGIN[1] + a.oy;
            var tipy = by + a.vy * a.tt + 0.5 * G_FORCE * a.tt * a.tt;
            var vy = a.vy + G_FORCE * a.tt;
            if (a.tt >= a.T || (tipy >= GROUND - 12 && vy > 0) || a.tt > a.T + 1.0) this.resolveArrow();
          }
        }
      } else if (this.phase === SAD) {
        this.sad_t -= dt;
        sq.ear_droop = Math.min(1.0, sq.ear_droop + dt * 8);
        if (this.sad_t <= 0) this.beginShot(this.shot_num >= 2);
      } else if (this.phase === HIT) {
        if (this.letter.wob <= 0) { this.phase = OPEN; sq.pose = 'idle'; sq.expr = 'happy'; }
      } else if (this.phase === OPEN) {
        if (this.letter.isOpen) {
          this.phase = ASK; this.ask_t = 0.0; sq.expr = 'giggle'; this.giggle_t = 1.2;
        }
      } else if (this.phase === ASK) {
        this.ask_t = Math.min(1.0, this.ask_t + dt * 2.0);
        this.yes.update(dt);
        if (!this.no_gone) this.no.update(dt);
        sq.pose = 'idle';
      } else if (this.phase === THANKS || this.phase === END) {
        this.updateThanks(dt);
      }

      this.blink_t -= dt;
      if (this.blink_t <= 0) { sq.blink = 0.55; this.blink_t = rand(2.0, 4.2); }
      if (this.giggle_t > 0) this.giggle_t -= dt; else sq.expr = 'happy';

      var canHover = this.phase === ASK && this.ask_t >= 0.30 && this.mouseType === 'mouse';
      this.yes.hover = canHover && this.yes.contains(this.mouse);
      this.no.hover = canHover && !this.no_gone && this.no.contains(this.mouse);
    };
    Game.prototype.advanceAim = function (dt) {
      this.aim_t += dt;
      var pull = 0.0, st = this.aim_stage;
      if (st === 0) {
        if (this.aim_t >= 0.35) { this.aim_stage = 1; this.aim_t = 0.0; }
      } else if (st === 1) {
        pull = easeInOut(Math.min(1.0, this.aim_t / 0.95));
        if (this.aim_t >= 0.95) { pull = 1.0; this.aim_stage = 2; this.aim_t = 0.0; }
      } else if (st === 2) {
        pull = 1.0;
        if (this.aim_t >= 0.22) { this.fire(); this.aim_stage = 3; this.aim_t = 0.0; }
      }
      this.squirrel.pull = pull;
      if (this.shot) this.bowGeom(pull);
    };

    // ---- YES / NO ----
    Game.prototype.click = function (p) {
      if (this.phase !== ASK || this.ask_t < 0.30) return;
      if (this.yes.contains(p)) this.yesClick();
      else if (!this.no_gone && this.no.contains(p)) this.noClick();
    };
    Game.prototype.noClick = function () {
      this.no_presses += 1;
      if (this.no_presses >= MAX_NO_DODGES) {
        this.no_gone = true; this.no.visible = false;
        for (var i = 0; i < 14; i++) {
          this.burst.push({ x: this.no.cx, y: this.no.cy, vx: rand(-180, 180), vy: rand(-260, -40),
            tt: 0.0, life: 0.9, rot: rand(0, 6.28), vrot: rand(-8, 8), sz: rand(4, 8),
            col: mix(TH.heart, WHITE, 0.15) });
        }
      } else {
        // đổi kích cỡ trước, rồi mới chọn chỗ mới (để tính đúng kích cỡ hiện tại của 2 nút)
        this.yes.scale *= 1.22; this.no.scale *= 0.86;
        this.no.target = this.pickNoSpot(); this.no.pop = 0.25;
      }
      this.giggle_t = 0.9; this.squirrel.expr = 'giggle';
    };
    // Chọn chỗ mới cho nút NO: luôn nằm trong màn hình, KHÔNG chạm nút YES
    // (có chừa khoảng hở), đường bay cũng không cắt qua nút YES.
    Game.prototype.pickNoSpot = function () {
      var yr = this.yes.rect(), gap = 30;
      var nr = this.no.rect(), nw = nr.w / 2, nh = nr.h / 2;       // nửa kích thước nút NO
      // vùng cấm quanh YES (đã nới thêm gap)
      var fx0 = yr.x - gap, fx1 = yr.x + yr.w + gap, fy0 = yr.y - gap, fy1 = yr.y + yr.h + gap;
      var xmin = nw + 16, xmax = W - nw - 16, ymin = 430 + nh, ymax = H - 24 - nh;
      var curx = this.no.cx, cury = this.no.cy, mouse = this.mouse;

      function hitsYes(x, y) {                                      // nút NO đặt tại (x,y) có chạm vùng cấm?
        return !(x + nw < fx0 || x - nw > fx1 || y + nh < fy0 || y - nh > fy1);
      }
      function pathHitsYes(x, y) {                                  // đường bay từ chỗ cũ tới (x,y) có cắt YES?
        for (var s = 0; s <= 12; s++) {
          var k = s / 12;
          if (hitsYes(curx + (x - curx) * k, cury + (y - cury) * k)) return true;
        }
        return false;
      }
      function ok(x, y, level) {
        if (hitsYes(x, y)) return false;
        if (level <= 1 && pathHitsYes(x, y)) return false;
        if (level <= 2 && Math.hypot(x - curx, y - cury) < 110) return false;   // phải nhảy đủ xa
        if (level <= 0 && Math.hypot(x - mouse[0], y - mouse[1]) < 110) return false; // không nằm dưới con trỏ
        if (level <= 0 && x > 70 && x < 360 && y > 520) return false;           // tránh chỗ con sóc / mũi tên cắm đất
        return true;
      }
      for (var level = 0; level <= 3; level++) {
        for (var tries = 0; tries < 120; tries++) {
          var x = rand(xmin, xmax), y = rand(ymin, ymax);
          if (ok(x, y, level)) return [x, y];
        }
      }
      // phương án cuối: đặt sát bên trái nút YES (luôn không đè)
      return [clamp(fx0 - nw - 4, xmin, xmax), clamp(yr.y + yr.h / 2, ymin, ymax)];
    };
    Game.prototype.yesClick = function () {
      this.phase = THANKS; this.thanks_t = 0.0; this.heart_rain_t = 0.0; this.firework_t = 0.0;
      var sq = this.squirrel;
      sq.pose = 'idle'; sq.expr = 'happy'; sq.ear_droop = 0.0;
      this.letter.beginClose();
      var tl = new Letter(LX, LY);
      tl.sheet = buildThanks(); tl.beginOpen(); tl.beginPop(); tl.pop = 0.0;
      this.thanks_letter = tl;
      var i;
      for (i = 0; i < 6; i++) this.burstHearts(rand(140, W - 140), rand(80, 320), irand(22, 40));
      for (i = 0; i < 14; i++) this.spawnHeartRain();
    };
    Game.prototype.updateThanks = function (dt) {
      this.thanks_t += dt;
      if (this.thanks_t >= 1.15 && this.thanks_letter) this.thanks_letter.update(dt);
      if (this.phase === END) return;
      this.heart_rain_t -= dt;
      if (this.heart_rain_t <= 0) { this.heart_rain_t = 0.07; this.spawnHeartRain(); }
      this.firework_t -= dt;
      if (this.firework_t <= 0) {
        this.firework_t = rand(0.22, 0.6);
        this.burstHearts(rand(70, W - 70), rand(50, 250), irand(18, 34));
      }
      if (this.thanks_t > 6.5) this.finish();
    };
    Game.prototype.finish = function () {
      this.phase = END;
      cv.style.pointerEvents = 'none';
      var self = this;
      if (window.startFlowers) window.startFlowers();      // bắt đầu cảnh hoa phía sau
      cv.classList.add('fade-out');                        // cảnh sóc mờ dần
      setTimeout(function () {
        self.stopped = true;
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      }, 2300);
    };
    Game.prototype.skipToAsk = function () { /* dùng khi debug */ };

    // ---- hạt / hiệu ứng ----
    Game.prototype.spawnHeartRain = function () {
      var h = TH.heart, picks = [h, mix(h, WHITE, 0.2), mix(h, BLACK, 0.25)];
      for (var i = 0; i < 3; i++) {
        this.petals.push({ x: rand(0, W), y: -26, vy: rand(130, 280), sway: rand(0, 6.28), tt: 0.0,
          life: rand(3.0, 6.0), rot: rand(0, 6.28), vrot: rand(-3.5, 3.5), sz: rand(7, 14), col: pick(picks) });
      }
    };
    Game.prototype.burstHearts = function (x, y, n) {
      var h = TH.heart, picks = [h, mix(h, WHITE, 0.18), mix(h, BLACK, 0.22), TH.glow];
      for (var i = 0; i < n; i++) {
        var a = rand(0, TAU), sp = rand(90, 380);
        this.burst.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, tt: 0.0,
          life: rand(1.1, 1.8), rot: rand(0, 6.28), vrot: rand(-6, 6), sz: rand(5, 12), col: pick(picks) });
      }
      this.rings.push({ x: x, y: y, tt: 0.0, life: 0.7, col: TH.glow });
    };
    Game.prototype.updateParticles = function (dt) {
      var i, p;
      for (i = 0; i < this.sparks.length; i++) {
        p = this.sparks[i]; p.tt += dt; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      this.sparks = this.sparks.filter(function (q) { return q.tt < q.life; });
      for (i = 0; i < this.burst.length; i++) {
        p = this.burst[i]; p.tt += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
      }
      this.burst = this.burst.filter(function (q) { return q.tt < q.life; });
      for (i = 0; i < this.rings.length; i++) this.rings[i].tt += dt;
      this.rings = this.rings.filter(function (q) { return q.tt < q.life; });
      for (i = 0; i < this.petals.length; i++) {
        p = this.petals[i]; p.tt += dt;
        p.x += 24 * Math.sin(p.tt * 2 + p.sway) * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
      }
      this.petals = this.petals.filter(function (q) { return q.tt < q.life; });
    };
    Game.prototype.drawParticles = function () {
      var i, p, k, col;
      for (i = 0; i < this.sparks.length; i++) {
        p = this.sparks[i]; k = 1 - p.tt / p.life;
        col = mix(p.col, BLACK, 1 - k);
        var r = Math.max(1, Math.floor(p.sz * k));
        circle(mix(col, BLACK, 0.6), p.x + 1, p.y + 1, r + 2);
        circle(col, p.x, p.y, r);
      }
      for (i = 0; i < this.burst.length; i++) {
        p = this.burst[i]; k = 1 - p.tt / p.life;
        var c = mix(p.col, BLACK, 1 - k), s = p.sz * (0.5 + 0.5 * k);
        heart(p.x, p.y, s + 2, mix(c, BLACK, 0.55), 0, p.rot, 12);
        heart(p.x, p.y, s, c, 0, p.rot, 12);
      }
      for (i = 0; i < this.rings.length; i++) {
        p = this.rings[i]; k = p.tt / p.life;
        var rad = Math.floor(20 + 130 * k), c1 = mix(p.col, BLACK, 1 - k), c2 = mix(c1, WHITE, 0.3);
        circleLine(c1, p.x, p.y, rad, Math.max(2, Math.floor(5 * (1 - k))));
        circleLine(c2, p.x, p.y, rad * 0.66, Math.max(1, Math.floor(3 * (1 - k))));
      }
      for (i = 0; i < this.petals.length; i++) {
        p = this.petals[i]; k = 1 - p.tt / p.life;
        heart(p.x, p.y, p.sz, mix(p.col, BLACK, 0.6 * (1 - k)), 0, p.rot, 12);
      }
    };

    // ---- vẽ ----
    Game.prototype.draw = function () {
      g = g0;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(bg, 0, 0);
      g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
      var i, st;

      for (i = 0; i < this.stuck.length; i++) {          // tên cắm đất
        st = this.stuck[i];
        if (!st[3]) drawArrow(st[0] + 20, st[1], st[2], 70);
      }
      this.letter.draw();
      if ((this.phase === THANKS || this.phase === END) && this.thanks_t >= 1.15 && this.thanks_letter) {
        this.thanks_letter.draw();
      }
      for (i = 0; i < this.stuck.length; i++) {          // tên cắm vào thư
        st = this.stuck[i];
        if (st[3]) drawArrow(st[0], st[1], st[2], 70);
      }

      this.squirrel.draw(this.t);

      if (this.phase === AIM && this.shot) {
        var geom = this.bowGeom(this.squirrel.pull);
        drawBow(geom);
        circle(SKIN, geom.grip[0], geom.grip[1], 6);
        circle(mix(SKIN, WHITE, 0.35), geom.grip[0], geom.grip[1], 3);
        if (!this.arrow && this.aim_stage < 3) {
          drawArrow(geom.nock[0] + geom.u[0] * ARROW_LEN, geom.nock[1] + geom.u[1] * ARROW_LEN, this.shot.ang);
        }
      }
      if (this.arrow) {
        var a = this.arrow, tt = a.tt;
        var tipx = BOW_ORIGIN[0] + a.ox + a.vx * tt;
        var tipy = BOW_ORIGIN[1] + a.oy + a.vy * tt + 0.5 * G_FORCE * tt * tt;
        drawArrow(tipx, tipy, Math.atan2(a.vy + G_FORCE * tt, a.vx));
      }

      this.drawParticles();

      if (this.phase === ASK) {
        var app = clamp((this.ask_t - 0.30) / 0.3, 0.0, 1.0);
        this.yes.fade = app;
        if (!this.no_gone) this.no.fade = app;
        if (app > 0.0) {
          this.yes.draw(mix(TH.heart, WHITE, 0.15), mix(TH.heart, [40, 8, 28], 0.45), TH.glow);
          if (!this.no_gone) this.no.draw([216, 128, 148], [132, 74, 92], TH.glow);
        }
      }

      if (this.mouseType === 'mouse' && this.phase !== END) {     // con trỏ trái tim
        heart(this.mouse[0], this.mouse[1], 10 + Math.sin(this.t * 6) * 1.2, TH.heart);
      }
    };

    // ============================== KHỞI ĐỘNG ==============================
    layout();
    var game = new Game();
    window.__squirrelGame = game;                       // chỉ để kiểm thử
    game.toClient = function (lx, ly) { return [ox + lx * sc, oy + ly * sc]; };

    window.addEventListener('resize', layout);
    cv.addEventListener('pointermove', function (e) {
      game.mouse = toLogical(e); game.mouseType = e.pointerType;
    });
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      game.mouse = toLogical(e); game.mouseType = e.pointerType;
      game.click(game.mouse);
    });

    var last = performance.now();
    function loop(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      game.update(dt);
      game.draw();
      if (!game.stopped) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
