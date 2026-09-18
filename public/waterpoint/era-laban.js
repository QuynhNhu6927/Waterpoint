/* ============================================================================
   era-laban.js — LA BÀN 2D, CHỈ ĐỂ CHỈ HƯỚNG  (Waterpoint)
   ----------------------------------------------------------------------------
   Anh Tony chốt 16/09/2026: *"quả cầu đó chính là cái để người dùng iPad hoặc
   đt không có chuột dùng nó để tương tác. Chúng ta cần làm cái la bàn 2d thôi,
   chỉ cần chỉ hướng là được."*

   => PHÂN VAI RÕ, ĐỪNG TRỘN:
        `era-globe.js`  = CẦN ĐIỀU KHIỂN (kéo xoay, zoom) — có chạm vào được.
        `era-laban.js`  = CHỈ ĐỂ ĐỌC. `pointer-events:none` toàn bộ.

   Đặt GÓC PHẢI TRÊN (Anh Tony chốt). Đó là góc duy nhất còn trống:
   trái trên = #brand · phải dưới = #eraGlobe + #eraZoom · giữa dưới = #ds + #nav.

   🔴 KIM ĐỎ CHỈ **BẮC THẬT**, KHÔNG PHẢI `hlookat = 0`.
   Bắc thật nằm ở `ath = −yaw`, yaw = `GimbalYawDegree` trong EXIF ảnh gốc.
   Quan hệ `bearing = ath + yaw` đã được phiên `chat-gps-poi` nghiệm thu
   sáng 16/09 (16/20 cặp cảnh khớp đúng 0,0°). Trang tự khai số lệch qua
   `window.ERA_LECH_BAC` — xem mục "MÓC NỐI" ngay dưới.

   ADDITIVE 100%: gỡ 1 dòng <script src="era-laban.js"> là trang về y như cũ.
   KHÔNG sửa XML, KHÔNG đụng skin, KHÔNG thêm layer krpano.

   ---------------------------------------------------------------------------
   MÓC NỐI — trang khai độ lệch Bắc của CẢNH ĐANG XEM:

       window.ERA_LECH_BAC = function () { return <số độ>; };   // hoặc một số

   Không khai (hoặc trả về rác) => coi như 0 => la bàn coi `hlookat 0` là Bắc,
   đúng y hành vi cũ của quả cầu. Nghĩa là trang nào chưa có yaw thì KHÔNG
   sai thêm cái gì, chỉ là không đúng thêm.
   🔴 Phải là HÀM nếu trang có nhiều cảnh — đổi cảnh là số lệch đổi theo.
   Khai bằng một con số chết thì cảnh thứ hai chỉ sai.

   ---------------------------------------------------------------------------
   🔴 BẪY ĐÃ TRÁNH (chép nguyên bài học của `era-globe.js`, vẫn đúng ở đây):
     a) krpano KHÔNG bắn sự kiện JS khi đổi tầm nhìn => phải HỎI theo nhịp.
        setInterval nhẹ (20 lần/giây) + chỉ vẽ lại khi số THỰC SỰ đổi.
        KHÔNG dùng requestAnimationFrame liên tục (tốn pin iPad).
     b) `pointer-events:none` giải quyết luôn bẫy (e) của era-globe.js:
        index.html trang Thực tế có một listener 'click' ở pha CAPTURE cho
        tool chấm điểm, `stopPropagation` không cản được. La bàn này không
        nhận chuột nên KHÔNG cần thêm vào danh sách loại trừ nào cả.

   🔴 BẪY RIÊNG CỦA LA BÀN (mới, 16/09):
     c) TRANG GIỎ HÀNG NHÌN THẲNG XUỐNG (nadir, vlookat = 90). Đó là ĐIỂM
        KỲ DỊ — đúng họ với BẪY 50. Ở nadir, kéo ngang KHÔNG lia ngang mà
        XOAY CẢ MẶT ĐẤT, nên la bàn BẮT BUỘC phải xoay theo; một la bàn
        vẽ chết chỉ lên là sai ngay khi khách kéo cú đầu tiên.
        Quy ước dùng ở đây (đã đo bằng `_kiem-laban.py`, không phải suy luận):
          đỉnh widget = hướng đang nhìn = phương vị (hlookat + lệch)
          => đĩa xoay `−(hlookat + lệch)` độ, chiều kim đồng hồ.
        Quy ước này ĐÚNG CHO CẢ hai kiểu nhìn (ngang và nadir) nên không
        phải tách nhánh theo vlookat.
   ========================================================================== */
(function () {
  'use strict';

  var TAG = '[era-laban]';

  var NHIP_MS = 50;   /* nhịp hỏi krpano — cùng nhịp với era-globe.js */

  /* 8 hướng tiếng Việt. Chỉ số = làm tròn(phương vị / 45) % 8.
     🔴 Chữ ĐẦY ĐỦ, cố ý — không viết tắt. Anh Tony chốt 16/09: *"nó là cái
        chính để sale nhìn vào tư vấn, căn này hướng nam"*. Sale đứng cạnh
        khách thì đọc "ĐÔNG NAM" là nói ra miệng được ngay, còn "ĐN" phải
        dịch trong đầu một nhịp. Quả cầu bên `era-globe.js` vẫn viết tắt vì
        chỗ đó chật và nó là CẦN ĐIỀU KHIỂN, không phải chỗ để đọc. */
  var TEN = ['BẮC', 'ĐÔNG BẮC', 'ĐÔNG', 'ĐÔNG NAM',
             'NAM', 'TÂY NAM', 'TÂY', 'TÂY BẮC'];

  /* Trang này đã có sẵn biến toàn cục `kp` (krpano trả về trong onready).
     Dùng nó trước; không có thì tìm theo id mặc định của krpano. */
  function K() {
    if (window.kp && window.kp.get) return window.kp;
    var e = document.getElementById('krpanoSWFObject');
    return (e && e.get) ? e : null;
  }

  /* Đọc độ lệch Bắc của CẢNH ĐANG XEM. Hỏng kiểu gì cũng trả 0, không ném lỗi:
     la bàn lệch còn hơn cả trang chết vì một cảnh thiếu số. */
  function lechBac() {
    try {
      var v = window.ERA_LECH_BAC;
      if (typeof v === 'function') v = v();
      v = Number(v);
      return isFinite(v) ? v : 0;
    } catch (e) { return 0; }
  }

  function chuan360(d) { return (d % 360 + 360) % 360; }

  function dung() {
    /* ============================================================
       CỠ ĐIỀU KHIỂN BẰNG ĐÚNG MỘT BIẾN `--lb-co`.

       Anh Tony 16/09 (sau khi xem bản 56px): *"nó cần lớn hơn. Lý do nó là
       cái chính để sale nhìn vào tư vấn, căn này hướng nam."*
       => 96px máy bàn · 76px điện thoại. Đây KHÔNG phải đồ trang trí góc màn,
          nó là dụng cụ làm việc — cỡ phải đọc được khi cầm iPad chìa sang
          cho khách xem, tức là cách mắt khoảng một sải tay.

       🔴 Mọi số đo bên trong đều `calc()` theo `--lb-co`. Anh bảo to/nhỏ nữa
          thì SỬA ĐÚNG MỘT SỐ, không phải dò 12 chỗ. Đừng ghi số pixel chết
          vào đây — bản đầu làm vậy và đổi cỡ một lần là lệch hết kim với chữ.
       ============================================================ */
    var css = ''
      + '#eraLaBan{--lb-co:96px;'
      +   'position:fixed;right:var(--wp-space-md,16px);top:var(--wp-space-md,16px);'
      +   'width:var(--lb-co);height:var(--lb-co);z-index:var(--wp-z-overlay,50);'
      +   'border-radius:50%;pointer-events:none;'
      +   'background:radial-gradient(circle at 35% 30%, rgba(0,86,107,.94), rgba(0,26,33,.96));'
      +   'border:1px solid var(--wp-hairline,#005A70);'
      +   'box-shadow:3px 3px 16px rgba(0,0,0,.34);}'
      /* Đĩa xoay: chứa kim + 4 chữ. Xoay cả cụm nên chữ luôn đúng chỗ của nó. */
      + '#eraLaBan .lb-dial{position:absolute;inset:0;transition:transform .06s linear;}'
      /* Kim đỏ nằm ở vị trí chữ B => kim luôn chỉ Bắc thật. */
      + '#eraLaBan .lb-kim{position:absolute;left:50%;top:calc(var(--lb-co) * .03);'
      +   'width:0;height:0;margin-left:calc(var(--lb-co) * -.085);'
      +   'border-left:calc(var(--lb-co) * .085) solid transparent;'
      +   'border-right:calc(var(--lb-co) * .085) solid transparent;'
      +   'border-bottom:calc(var(--lb-co) * .185) solid #E01B24;'
      +   'filter:drop-shadow(0 0 3px rgba(0,0,0,.85));}'
      + '#eraLaBan .lb-vong{position:absolute;inset:calc(var(--lb-co) * .135);'
      +   'border-radius:50%;border:1px solid rgba(127,211,227,.34);}'
      /* Chấm tâm — cho mắt bám được trục khi đĩa đang xoay. */
      + '#eraLaBan .lb-truc{position:absolute;left:50%;top:50%;'
      +   'width:calc(var(--lb-co) * .05);height:calc(var(--lb-co) * .05);'
      +   'margin:calc(var(--lb-co) * -.025) 0 0 calc(var(--lb-co) * -.025);'
      +   'border-radius:50%;background:rgba(127,211,227,.55);}'
      + '#eraLaBan .lb-h{position:absolute;'
      +   'font:var(--wp-fw-bold,700) calc(var(--lb-co) * .17)/1 '
      +   'var(--wp-font,Montserrat,Arial,sans-serif);'
      +   'color:var(--wp-text,#fff);text-shadow:0 0 4px #000;}'
      + '#eraLaBan .lb-h.b{left:50%;top:calc(var(--lb-co) * .245);'
      +   'margin-left:calc(var(--lb-co) * -.055);color:#FF9AA0;}'
      + '#eraLaBan .lb-h.n{left:50%;bottom:calc(var(--lb-co) * .06);'
      +   'margin-left:calc(var(--lb-co) * -.055);}'
      + '#eraLaBan .lb-h.d{right:calc(var(--lb-co) * .06);top:50%;'
      +   'margin-top:calc(var(--lb-co) * -.085);}'
      + '#eraLaBan .lb-h.t{left:calc(var(--lb-co) * .06);top:50%;'
      +   'margin-top:calc(var(--lb-co) * -.085);}'
      /* Dòng chữ nằm DƯỚI đĩa. `left/right` âm để tên hướng dài ("ĐÔNG NAM")
         không bị bó theo bề ngang đĩa — chép cách `#eraGlobe .gb-so` đã làm. */
      + '#eraLaBan .lb-so{position:absolute;left:calc(var(--lb-co) * -.55);'
      +   'right:calc(var(--lb-co) * -.55);bottom:calc(var(--lb-co) * -.30);'
      +   'text-align:center;white-space:nowrap;'
      +   'color:var(--wp-text,#fff);text-shadow:0 1px 4px #000, 0 0 10px #000;}'
      /* Tên hướng là chữ TO NHẤT cụm — đó là thứ sale đọc ra miệng. */
      + '#eraLaBan .lb-ten{display:block;'
      +   'font:var(--wp-fw-bold,700) calc(var(--lb-co) * .155)/1.1 '
      +   'var(--wp-font,Montserrat,Arial,sans-serif);letter-spacing:.8px;}'
      + '#eraLaBan .lb-do{display:block;margin-top:calc(var(--lb-co) * .025);'
      +   'font:var(--wp-fw-regular,400) calc(var(--lb-co) * .115)/1 '
      +   'var(--wp-font,Montserrat,Arial,sans-serif);'
      +   'color:var(--wp-primary-tint,#7FD3E3);letter-spacing:.5px;}'
      /* 🔴 Điện thoại: thu về 76px. Cùng ngưỡng 568px mà index.html đang dùng
         cho .tab/.o — đừng đặt ngưỡng mới, lệch ngưỡng là bố cục gãy một dải. */
      + '@media (max-width:568px){'
      +   '#eraLaBan{--lb-co:76px;right:10px;top:10px;}'
      + '}'
      /* 🔴 Điện thoại XOAY NGANG chỉ cao ~390px — `max-width` KHÔNG bắt được
         ca này (bài học 12/09 ghi ngay trong giohang/index.html). Màn thấp
         thì la bàn phải nhường chỗ, không thì nó ăn hết mép trên. */
      + '@media (max-height:600px){'
      +   '#eraLaBan{--lb-co:68px;top:10px;}'
      + '}';

    var st = document.createElement('style');
    st.id = 'eraLaBanCss';
    st.textContent = css;
    document.head.appendChild(st);

    var g = document.createElement('div');
    g.id = 'eraLaBan';
    g.innerHTML =
        '<div class="lb-vong"></div>'
      + '<div class="lb-dial">'
      +   '<span class="lb-truc"></span>'
      +   '<span class="lb-kim"></span>'
      +   '<span class="lb-h b">B</span><span class="lb-h d">Đ</span>'
      +   '<span class="lb-h n">N</span><span class="lb-h t">T</span>'
      + '</div>'
      + '<div class="lb-so"><b class="lb-ten">—</b><i class="lb-do"></i></div>';
    document.body.appendChild(g);
    return g;
  }

  function chay() {
    if (!K()) return false;
    if (document.getElementById('eraLaBan')) return true;

    var g    = dung();
    var dial = g.querySelector('.lb-dial');
    var eTen = g.querySelector('.lb-ten');
    var eDo  = g.querySelector('.lb-do');

    var hCu = null, lCu = null;

    function ve() {
      var kk = K(); if (!kk) return;
      var h = Number(kk.get('view.hlookat'));
      if (isNaN(h)) return;
      var lech = lechBac();
      if (h === hCu && lech === lCu) return;   /* 🔴 không đổi thì không vẽ lại */
      hCu = h; lCu = lech;

      /* Đỉnh widget = hướng đang nhìn. Bắc nằm lệch `−(h + lech)` so với đỉnh. */
      dial.style.transform = 'rotate(' + (-(h + lech)).toFixed(1) + 'deg)';

      var pv = chuan360(h + lech);                       /* phương vị đang nhìn */
      eTen.textContent = TEN[Math.round(pv / 45) % 8];
      eDo.textContent  = Math.round(pv) + '°';
    }

    ve();
    setInterval(ve, NHIP_MS);

    /* Để `_kiem-laban.py` đọc được số mà không phải suy ngược từ chuỗi CSS. */
    window.ERA_LABAN = {
      lech  : lechBac,
      gocDia: function () { var kk = K(); if (!kk) return null;
                            return -(Number(kk.get('view.hlookat')) + lechBac()); },
      bacAth: function () { return chuan360(-lechBac()); }
    };
    return true;
  }

  /* krpano nạp không đồng bộ — thử lại tới khi có, tối đa 20 giây rồi thôi.
     Chép đúng cách era-globe.js chờ, để hai widget lên cùng nhịp. */
  if (!chay()) {
    var dem = 0;
    var t = setInterval(function () {
      if (chay() || ++dem > 200) clearInterval(t);
      if (dem > 200) console.warn(TAG, 'không thấy krpano sau 20 giây — bỏ qua.');
    }, 100);
  }
})();
