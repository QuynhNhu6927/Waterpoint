/* ============================================================================
   era-globe.js — QUẢ CẦU ĐIỀU HƯỚNG + THANH ZOOM  (bản trang Thực tế Waterpoint)
   ----------------------------------------------------------------------------
   Nguồn: chép từ `06-WEB/PGBL-web/tour360/era-globe.js` (14/08/2026), Anh Tony
   bảo "mang cái quả cầu 3d về đây" ngày 15/09/2026. Đổi lại cho hợp trang này:

     1. MÀU  — bản PGBL dùng xanh lá + vàng đồng. Trang này là design system
               ERA/Waterpoint (teal #003C4B + tint #7FD3E3 + vàng #E0B14A).
               Đọc thẳng biến --wp-* của trang, có giá trị dự phòng nếu thiếu.
     2. CHỮ  — Montserrat (var(--wp-font)), không phải Inter.
     3. CHỖ ĐỨNG — `position:fixed` (bản PGBL dùng absolute). Trang này
               `html,body{height:100%;overflow:hidden}` nên fixed mới chắc.
     4. THANH ZOOM — phần MỚI, Anh Tony bảo "bổ sung thêm 1 cái thanh zoom
               in-out đặt phía trên". Nằm ngay trên quả cầu, cùng mép phải.

   ADDITIVE 100%: gỡ 1 dòng <script src="era-globe.js"> trong index.html là
   trang về y như cũ. File này KHÔNG sửa XML, KHÔNG đụng skin, KHÔNG thêm
   layer krpano.

   🔴 CÁC BẪY ĐÃ TRÁNH (giữ nguyên từ bản PGBL, vẫn đúng):
     a) krpano KHÔNG bắn sự kiện JS khi đổi tầm nhìn => phải HỎI theo nhịp.
        setInterval nhẹ (20 lần/giây) + chỉ vẽ lại khi số THỰC SỰ đổi.
        KHÔNG dùng requestAnimationFrame liên tục (tốn pin iPad).
     b) Phải stopPropagation trong pointerdown/move, không thì krpano nhận
        luôn cú kéo và panorama trôi gấp đôi.
     c) touch-action:none — thiếu dòng này iPad cuộn trang thay vì kéo.
     d) KHÔNG tự kẹp vlookat/fov — mỗi scene có giới hạn riêng khai trong XML.
        Cứ set, krpano tự kẹp.

   🔴 BẪY RIÊNG CỦA TRANG NÀY (mới, 15/09):
     e) `index.html` có một `document.addEventListener('click', ..., true)` bắt
        ở pha CAPTURE cho tool chấm điểm. Capture chạy TRƯỚC handler của đích
        nên `stopPropagation` ở đây VÔ TÁC DỤNG => phải thêm `#eraGlobe` và
        `#eraZoom` vào danh sách loại trừ bên index.html, không thì bấm nút
        zoom lúc đang mở ?tool=1 là chấm nhầm một điểm lên ảnh.
     f) Mọi scene đang để `maxpixelzoom="1.0"`. Nó KẸP mức phóng to theo độ
        phân giải ảnh gốc: kéo thanh zoom về sát đầu "to" thì `view.fov` đọc
        về vẫn đổi nhưng ẢNH CÓ THỂ KHÔNG TO THÊM. Đây đúng bẫy 50 (con số
        nói dối). Không phải lỗi thanh zoom.
   ========================================================================== */
(function () {
  'use strict';

  var TAG = '[era-globe]';

  /* ---------- CẤU HÌNH ---------- */
  var CH = {
    NHAY_NGANG : 0.55,   /* px kéo -> độ xoay ngang. Lớn hơn = nhạy hơn   */
    NHAY_DOC   : 0.40,   /* px kéo -> độ ngẩng/cúi                        */
    NHIP_MS    : 50,     /* nhịp hỏi krpano (20 lần/giây)                 */
    VE_BAC_MS  : 800,    /* thời gian bay về hướng Bắc khi chạm đúp       */
    BUOC_ZOOM  : 8,      /* mỗi lần bấm +/- đổi bao nhiêu độ fov          */
    ZOOM_MS    : 0.25    /* thời gian tween của nút +/- (giây)            */
  };

  /* Trang này đã có sẵn biến toàn cục `kp` (krpano trả về trong onready).
     Dùng nó trước; không có thì tìm theo id mặc định của krpano. */
  function K() {
    if (window.kp && typeof window.kp.get === 'function') return window.kp;
    var e = document.getElementById('krpanoSWFObject');
    return (e && typeof e.get === 'function') ? e : null;
  }

  /* ============================================================
     ĐỘ LỆCH BẮC  (16/09/2026 — Anh Tony: "sửa luôn hướng bắc của
     cái quả cầu 360")

     🔴 LỖI ĐANG SỬA: bản cũ xoay mặt số `−hlookat` trần, tức là
     COI `hlookat = 0` LÀ HƯỚNG BẮC. Điều đó chỉ đúng nếu drone
     tình cờ quay đúng hướng Bắc. Đo thật ảnh Waterpoint:
        PK The Aqua     yaw  172,3°  => kim đang lệch 172° (gần như ngược)
        PK Park Village yaw  −63,3°  => kim đang lệch  63°
     Chạm đúp "về hướng Bắc" cũng bay về `hlookat 0` = KHÔNG phải Bắc.

     Bắc thật nằm ở `ath = −yaw`, yaw = `GimbalYawDegree` trong EXIF
     ảnh gốc. Quan hệ `bearing = ath + yaw` do phiên `chat-gps-poi`
     nghiệm thu sáng 16/09 (16/20 cặp cảnh khớp đúng 0,0°).

     Trang khai số lệch của CẢNH ĐANG XEM:
         window.ERA_LECH_BAC = function () { return <số độ>; };
     Không khai => 0 => chạy Y HỆT bản cũ. Nhờ vậy Tổng quan và
     Tiện ích (ảnh đã bị nén mất sạch EXIF, không có yaw để mà
     suy) KHÔNG đổi một pixel nào.
     ============================================================ */
  function lechBac() {
    try {
      var v = window.ERA_LECH_BAC;
      if (typeof v === 'function') v = v();
      v = Number(v);
      return isFinite(v) ? v : 0;
    } catch (e) { return 0; }
  }

  var HUONG = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];
  function chuan360(d) { return (d % 360 + 360) % 360; }

  /* ---------- CSS ----------
     Dùng biến --wp-* của trang, kèm giá trị dự phòng để file vẫn chạy được
     nếu đem thả sang trang khác không có bộ biến đó. */
  var css = ''
    /* ===================== QUẢ CẦU ===================== */
    + '#eraGlobe{position:fixed;right:var(--wp-space-md,16px);'
    + 'bottom:calc(var(--wp-space-xl,32px) + var(--wp-nav-h,52px) + var(--wp-space-sm,12px));'
    /* 🔽 16/09: Anh Tony "giảm độ lớn cả thanh và quả cầu, khoảng 70% hiện tại,
       do nó đang hơi chiếm diện tích". Mọi số dưới đây = 70% bản cũ:
         cầu   92 -> 64  ·  74 -> 52  ·  64 -> 45
         zoom  48 -> 34  ·  42 -> 30   ·  nút 34 -> 24  ·  rãnh 104 -> 73
       Muốn về cỡ cũ: nhân ngược 1/0.7. */
    + 'z-index:var(--wp-z-overlay,50);width:64px;height:64px;border-radius:50%;'
    + 'background:radial-gradient(circle at 35% 30%, rgba(0,86,107,.94), rgba(0,26,33,.96));'
    + 'border:2px solid rgba(127,211,227,.55);'
    + 'box-shadow:0 8px 26px rgba(0,0,0,.55), inset 0 0 22px rgba(127,211,227,.18);'
    + 'cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;'
    + 'opacity:0;transition:opacity .4s ease;}'
    + '#eraGlobe.hien{opacity:1;}'
    + '#eraGlobe:active{cursor:grabbing;}'
    + '#eraGlobe .gb-ball{position:absolute;inset:11px;transform-style:preserve-3d;'
    + 'transform:rotateX(0deg) rotateZ(0deg);transition:transform .06s linear;}'
    + '#eraGlobe .gb-ring{position:absolute;inset:0;border-radius:50%;'
    + 'border:1px solid rgba(127,211,227,.42);}'
    /* vòng xích đạo lấy màu vàng ERA cho nổi */
    + '#eraGlobe .gb-ring.eq{border-color:var(--wp-vang,#E0B14A);border-width:1.5px;}'
    + '#eraGlobe .gb-dial{position:absolute;inset:0;pointer-events:none;}'
    + '#eraGlobe .gb-kim{position:absolute;left:50%;top:3px;width:0;height:0;margin-left:-5px;'
    + 'border-left:5px solid transparent;border-right:5px solid transparent;'
    + 'border-bottom:11px solid #E01B24;filter:drop-shadow(0 0 2px rgba(0,0,0,.8));}'
    + '#eraGlobe .gb-h{position:absolute;'
    + 'font:var(--wp-fw-bold,700) 9px/1 var(--wp-font,Montserrat,Arial,sans-serif);'
    + 'color:var(--wp-text,#fff);text-shadow:0 0 3px #000;}'
    + '#eraGlobe .gb-h.n{left:50%;top:15px;margin-left:-3px;color:#FF9AA0;}'
    + '#eraGlobe .gb-h.s{left:50%;bottom:4px;margin-left:-3px;}'
    + '#eraGlobe .gb-h.e{right:4px;top:50%;margin-top:-4px;}'
    + '#eraGlobe .gb-h.w{left:4px;top:50%;margin-top:-4px;}'
    + '#eraGlobe .gb-so{position:absolute;left:-14px;right:-14px;bottom:-17px;text-align:center;'
    + 'font:var(--wp-fw-bold,700) 10px/1 var(--wp-font,Montserrat,Arial,sans-serif);'
    + 'letter-spacing:.5px;color:var(--wp-text,#fff);text-shadow:0 1px 3px #000;'
    + 'pointer-events:none;white-space:nowrap;}'

    /* ===================== THANH ZOOM =====================
       Một cột teal đặt NGAY TRÊN quả cầu, cùng mép phải.
       Bo 2 góc đối nhau theo Group.svg (luật design system 12/09). */
    + '#eraZoom{position:fixed;right:var(--wp-space-md,16px);'
    + 'bottom:calc(var(--wp-space-xl,32px) + var(--wp-nav-h,52px) + var(--wp-space-sm,12px)'
    + ' + 64px + var(--wp-space-sm,12px));'
    + 'z-index:var(--wp-z-overlay,50);width:34px;'
    + 'display:flex;flex-direction:column;align-items:center;gap:6px;'
    + 'padding:6px 0;border-radius:0 11px 0 11px;'
    + 'background:var(--wp-primary,#003C4B);box-shadow:3px 3px 14px rgba(0,0,0,.26);'
    + 'touch-action:none;user-select:none;-webkit-user-select:none;'
    + 'opacity:0;transition:opacity .4s ease;}'
    + '#eraZoom.hien{opacity:1;}'
    /* nút + và - : 24px (70% cua 34), bo 2 goc doi nhau, net manh mau nen */
    + '#eraZoom .z-nut{position:relative;width:24px;height:24px;flex:0 0 auto;'
    + 'border:0;padding:0;'
    + 'display:flex;align-items:center;justify-content:center;cursor:pointer;'
    + 'border-radius:0 8px 0 8px;background:var(--wp-text,#fff);'
    + 'transition:background .15s, transform .08s;}'
    /* 🔴 VUNG CHAM PHAI GIU 44px du nut chi con 24px.
       Thu nho xuong 70% la nut tut duoi nguong cham cua ngon tay (iOS 44 /
       Material 48). Noi rong bang ::after TRONG SUOT — no khong chiem cho trong
       luong (absolute) nen KHONG lam khoi zoom to ra, chi de de bam.
       Tam hai nut cach nhau 109px nen hai vung 44px khong chong nhau. */
    + '#eraZoom .z-nut::after{content:"";position:absolute;left:50%;top:50%;'
    + 'width:44px;height:44px;transform:translate(-50%,-50%);}'
    + '#eraZoom .z-nut:hover{background:#E8F3F6;}'
    + '#eraZoom .z-nut:active{transform:translateY(2px);}'
    + '#eraZoom .z-nut svg{width:13px;height:13px;fill:none;'
    + 'stroke:var(--wp-primary,#003C4B);stroke-width:2.2;stroke-linecap:round;}'
    /* rãnh trượt */
    + '#eraZoom .z-ranh{position:relative;width:4px;height:73px;flex:0 0 auto;'
    + 'border-radius:2px;background:rgba(255,255,255,.22);cursor:pointer;}'
    + '#eraZoom .z-nuoc{position:absolute;left:0;right:0;bottom:0;'
    + 'border-radius:2px;background:var(--wp-primary-tint,#7FD3E3);}'
    + '#eraZoom .z-tay{position:absolute;left:50%;width:13px;height:13px;'
    + 'margin-left:-6.5px;margin-top:-6.5px;border-radius:50%;'
    + 'background:var(--wp-text,#fff);box-shadow:0 2px 6px rgba(0,0,0,.45);'
    + 'cursor:grab;transition:top .06s linear;}'
    /* tay nam 13px cung qua nho de tum — noi rong vung cham y het hai nut */
    + '#eraZoom .z-tay::after{content:"";position:absolute;left:50%;top:50%;'
    + 'width:38px;height:38px;transform:translate(-50%,-50%);}'
    + '#eraZoom .z-ranh:active .z-tay{cursor:grabbing;}'

    /* ============ CHỪA CHỖ CHO DẢI CHIP CHỌN CẢNH ============
       ✅ Nay chỉ đặt MỘT biến `--ds-chua`; công thức `max-width` + `left` nằm
       bên `index.html` và dùng chung cho cả `#ds` lẫn `#ds-dh` (lớp mũi tên).
       Trước kia file này tự viết lại cả hai thuộc tính ⇒ thêm `#ds-dh` là phải
       chép y hệt sang chỗ thứ hai, sai một li là hai lớp lệch nhau.
       Đúng luật 14/09: sửa xong một bẫy phải soi các khối CÒN LẠI dùng cùng
       kiểu code, đừng vá mỗi chỗ đang kêu.

       🔴 Lỗi đo được 15/09 trên iPad gen 9 ngang (1080×810 — MÁY CHUẨN):
       quả cầu ĐÈ LÊN chip "PK The Pearl". `#ds` nằm cùng độ cao với quả cầu
       (cùng `bottom`) và `max-width:calc(100vw - 32px)` nên nó chạy thẳng ra
       tới mép phải, chui xuống dưới quả cầu.
       🔴 BẢN ĐẦU SAI — TRỪ CẢ HAI BÊN LÀ PHÍ MẤT NỬA CHỖ.
       Quả cầu chỉ nằm BÊN PHẢI, nhưng `#ds` căn giữa nên bản đầu trừ
       `2 × (cầu + mép)` cho cân ⇒ bên TRÁI bị cắt oan đúng ngần ấy.
       Đo thật trên iPhone dọc 390px: dải chip còn **190px, thấy 1/5 nút**.
       ✅ Cách đúng: trừ MỘT lần thôi, rồi DỜI TÂM sang trái nửa khoảng đó
       (`left:calc(50% - <nửa>)`). Vẫn trông như căn giữa trong phần màn còn
       trống, mà không phí bên trái. iPhone dọc: 190px -> 274px.
       ⚠️ KHÔNG đổi sang `justify-content:center` + `left/right` — flexbox
       căn giữa cộng với khung cuộn thì phần tràn bên TRÁI cuộn không tới.
       ⚠️ Phải để khối này SAU CSS của trang — cùng độ đặc hiệu (1 id), CSS lấy
       cái đứng sau. File này chèn <style> lúc chạy nên luôn đứng sau. Đúng bài
       học 15/09 bên trang Tổng quan.
       Vẫn ADDITIVE: gỡ script là `#ds` về đủ bề ngang như cũ. */
    + ':root{--ds-chua:80px;}'           /* cầu 64 + mép phải 16 */

    /* iPad dọc & điện thoại: thu nhỏ, nhấc cao hơn thanh nav */
    + '@media (max-width:820px){'
    + ':root{--ds-chua:62px;}'           /* cầu 52 + mép phải 10 */
    + '#eraGlobe{width:52px;height:52px;right:10px;}'
    + '#eraGlobe .gb-ball{inset:6px;}#eraGlobe .gb-so{bottom:-13px;font-size:8px;}'
    + '#eraZoom{right:10px;width:30px;'
    + 'bottom:calc(var(--wp-space-xl,32px) + var(--wp-nav-h,52px) + var(--wp-space-sm,12px)'
    + ' + 52px + var(--wp-space-sm,12px));}'
    + '#eraZoom .z-nut{width:21px;height:21px;border-radius:0 7px 0 7px;}'
    + '#eraZoom .z-ranh{height:50px;}}'
    /* 🔴 Điện thoại XOAY NGANG chỉ cao ~390px (bài học 12/09): cả cột
       zoom + cầu là ~250px, đè lên thanh nav. Màn thấp thì BỎ RÃNH TRƯỢT,
       chỉ giữ 2 nút +/- - vẫn zoom được, không tràn. */
    + '@media (max-height:520px){'
    + ':root{--ds-chua:55px;}'           /* cầu 45 + mép phải 10 */
    + '#eraZoom .z-ranh{display:none;}'
    + '#eraGlobe{width:45px;height:45px;}'
    + '#eraZoom{bottom:calc(var(--wp-space-xl,32px) + var(--wp-nav-h,52px)'
    + ' + var(--wp-space-sm,12px) + 45px + var(--wp-space-sm,12px));}}';

  /* ---------- DOM ---------- */
  function dung() {
    var st = document.createElement('style');
    st.id = 'era-globe-style';
    st.textContent = css;
    document.head.appendChild(st);

    var z = document.createElement('div');
    z.id = 'eraZoom';
    z.innerHTML =
        '<button type="button" class="z-nut" id="z-to" aria-label="Phóng to" title="Phóng to">'
      +   '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
      + '</button>'
      + '<div class="z-ranh" id="z-ranh">'
      +   '<div class="z-nuoc" id="z-nuoc"></div>'
      +   '<div class="z-tay" id="z-tay"></div>'
      + '</div>'
      + '<button type="button" class="z-nut" id="z-nho" aria-label="Thu nhỏ" title="Thu nhỏ">'
      +   '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>'
      + '</button>';
    document.body.appendChild(z);

    var g = document.createElement('div');
    g.id = 'eraGlobe';
    g.title = 'Kéo ngang để xoay · kéo dọc để ngẩng/cúi · chạm đúp về hướng Bắc';
    g.innerHTML =
        '<div class="gb-ball">'
      +   '<div class="gb-ring" style="transform:rotateY(0deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(45deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(90deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(135deg)"></div>'
      +   '<div class="gb-ring eq" style="transform:rotateX(90deg)"></div>'
      + '</div>'
      + '<div class="gb-dial">'
      +   '<span class="gb-kim"></span>'
      +   '<span class="gb-h n">N</span><span class="gb-h e">E</span>'
      +   '<span class="gb-h s">S</span><span class="gb-h w">W</span>'
      + '</div>'
      + '<div class="gb-so">0° / 0°</div>';
    document.body.appendChild(g);
    return { g: g, z: z };
  }

  /* ---------- CHẠY ---------- */
  function chay() {
    var k = K();
    if (!k) return false;
    if (document.getElementById('eraGlobe')) return true;

    var d    = dung();
    var g    = d.g, z = d.z;
    var ball = g.querySelector('.gb-ball');
    var dial = g.querySelector('.gb-dial');
    var so   = g.querySelector('.gb-so');
    var ranh = z.querySelector('#z-ranh');
    var nuoc = z.querySelector('#z-nuoc');
    var tay  = z.querySelector('#z-tay');

    var hCu = null, vCu = null, fCu = null, lCu = null;

    /* fovmin/fovmax đọc lại mỗi lần vì MỖI SCENE khai riêng trong tour.xml
       (canh4 để fovmax 120, các cảnh khác 115). Đừng nhớ cứng. */
    function gioiHan(kk) {
      var mn = Number(kk.get('view.fovmin')), mx = Number(kk.get('view.fovmax'));
      if (!isFinite(mn) || mn <= 0) mn = 45;
      if (!isFinite(mx) || mx <= mn) mx = 115;
      return [mn, mx];
    }

    function ve() {
      var kk = K(); if (!kk) return;
      var h = Number(kk.get('view.hlookat'));
      var v = Number(kk.get('view.vlookat'));
      var f = Number(kk.get('view.fov'));
      if (isNaN(h) || isNaN(v)) return;
      var lech = lechBac();
      if (h === hCu && v === vCu && f === fCu && lech === lCu) return;  /* 🔴 không đổi thì không vẽ lại */
      hCu = h; vCu = v; fCu = f; lCu = lech;

      /* vlookat: âm = ngước lên, dương = cúi xuống. Quả cầu nghiêng theo.
         ⚠️ Quả cầu KHÔNG cộng `lech` — nó là hình trang trí tả cú xoay của
         người xem, không phải dụng cụ chỉ hướng. Chỉ MẶT SỐ mới chỉ hướng. */
      ball.style.transform = 'rotateX(' + (-v).toFixed(1) + 'deg) rotateZ(' + (-h).toFixed(1) + 'deg)';
      /* Đỉnh mặt số = hướng đang nhìn => Bắc lệch `−(h + lech)` so với đỉnh. */
      dial.style.transform = 'rotate(' + (-(h + lech)).toFixed(1) + 'deg)';
      /* 🔴 Số đọc PHƯƠNG VỊ THẬT, không phải `hlookat` trần. Bản cũ ghi
         "0° / 0°" lúc đang nhìn về hướng Nam — sale đọc xong tư vấn sai. */
      var pv = chuan360(h + lech);
      so.textContent = Math.round(pv) + '° ' + HUONG[Math.round(pv / 45) % 8]
                     + ' / ' + Math.round(v) + '°';

      /* thanh zoom: fov LỚN = nhìn rộng = tay trượt ở DƯỚI.
         fov NHỎ = phóng to = tay trượt ở TRÊN. */
      if (isFinite(f)) {
        var lim = gioiHan(kk), t = (lim[1] - f) / (lim[1] - lim[0]);
        t = Math.max(0, Math.min(1, t));
        tay.style.top  = ((1 - t) * 100) + '%';
        nuoc.style.height = (t * 100) + '%';
      }

      if (!g.classList.contains('hien')) { g.classList.add('hien'); z.classList.add('hien'); }
    }

    ve();
    setInterval(ve, CH.NHIP_MS);

    /* ===================== KÉO QUẢ CẦU ===================== */
    var keo = null;
    g.addEventListener('pointerdown', function (e) {
      var kk = K(); if (!kk) return;
      keo = { x: e.clientX, y: e.clientY,
              h: Number(kk.get('view.hlookat')),
              v: Number(kk.get('view.vlookat')) };
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault(); e.stopPropagation();
    });

    g.addEventListener('pointermove', function (e) {
      if (!keo) return;
      var kk = K(); if (!kk) return;
      /* 🔴 KHÔNG tự kẹp vlookat — mỗi scene có giới hạn riêng khai trong XML.
         Cứ set, krpano tự kẹp theo scene. */
      kk.set('view.hlookat', keo.h - (e.clientX - keo.x) * CH.NHAY_NGANG);
      kk.set('view.vlookat', keo.v + (e.clientY - keo.y) * CH.NHAY_DOC);
      e.preventDefault(); e.stopPropagation();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      g.addEventListener(t, function () { keo = null; });
    });

    /* ----- chạm đúp = về hướng Bắc, nhìn ngang -----
       🔴 Bắc THẬT nằm ở `hlookat = −lệch`, không phải 0. Bản cũ bay về 0 nên
          ở PK The Aqua (yaw 172,3) là quay đúng về hướng NAM. */
    function veBac() {
      var kk = K(); if (!kk) return;
      var dich = -lechBac();
      kk.call('tween(view.hlookat, ' + dich.toFixed(2) + ', ' + (CH.VE_BAC_MS / 1000) + ', easeInOutQuad);'
            + 'tween(view.vlookat, 0, ' + (CH.VE_BAC_MS / 1000) + ', easeInOutQuad);');
    }
    g.addEventListener('dblclick', function (e) {
      veBac(); e.preventDefault(); e.stopPropagation();
    });
    /* iPad không bắn dblclick ổn định -> bắt 2 lần chạm nhanh */
    var chamCuoi = 0;
    g.addEventListener('pointerup', function () {
      var t = Date.now();
      if (t - chamCuoi < 320) veBac();
      chamCuoi = t;
    });

    /* ===================== THANH ZOOM ===================== */
    function datFov(f, muot) {
      var kk = K(); if (!kk) return;
      var lim = gioiHan(kk);
      f = Math.max(lim[0], Math.min(lim[1], f));
      if (muot) kk.call('tween(view.fov, ' + f.toFixed(2) + ', ' + CH.ZOOM_MS + ', easeOutQuad);');
      else kk.set('view.fov', f);
    }
    function fovHienTai() {
      var kk = K(); if (!kk) return 100;
      var f = Number(kk.get('view.fov'));
      return isFinite(f) ? f : 100;
    }

    z.querySelector('#z-to').addEventListener('click', function (e) {
      datFov(fovHienTai() - CH.BUOC_ZOOM, true); e.stopPropagation();
    });
    z.querySelector('#z-nho').addEventListener('click', function (e) {
      datFov(fovHienTai() + CH.BUOC_ZOOM, true); e.stopPropagation();
    });

    /* kéo / bấm lên rãnh trượt */
    var keoZ = false;
    function theoRanh(e) {
      var kk = K(); if (!kk) return;
      var r = ranh.getBoundingClientRect();
      if (!r.height) return;
      var t = 1 - (e.clientY - r.top) / r.height;     /* trên = 1 = phóng to */
      t = Math.max(0, Math.min(1, t));
      var lim = gioiHan(kk);
      datFov(lim[1] - t * (lim[1] - lim[0]), false);
    }
    ranh.addEventListener('pointerdown', function (e) {
      keoZ = true; theoRanh(e);
      try { ranh.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault(); e.stopPropagation();
    });
    ranh.addEventListener('pointermove', function (e) {
      if (!keoZ) return;
      theoRanh(e); e.preventDefault(); e.stopPropagation();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      ranh.addEventListener(t, function () { keoZ = false; });
    });

    console.log(TAG, 'da gan qua cau dieu huong + thanh zoom');
    return true;
  }

  /* krpano nạp không đồng bộ -> dò cho tới khi có, tối đa 20 giây rồi bỏ ÊM */
  var lan = 0;
  var hen = setInterval(function () {
    lan++;
    if (chay() || lan > 200) {
      clearInterval(hen);
      if (lan > 200) console.warn(TAG, 'khong thay krpano sau 20s — bo qua qua cau');
    }
  }, 100);
})();
