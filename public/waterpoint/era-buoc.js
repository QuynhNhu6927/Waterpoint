/* ============================================================================
   era-buoc.js — THANH BƯỚC DÙNG CHUNG cho cả 4 trang Waterpoint  (15/09/2026)
   ----------------------------------------------------------------------------
   Cách dùng, đặt TRƯỚC </body>:
     <script src="era-buoc.js"    data-buoc="thuc-te"></script>     (wp-thuc-te/)
     <script src="../era-buoc.js" data-buoc="tong-quan"></script>   (tong-quan/)
     <script src="../era-buoc.js" data-buoc="gio-hang"></script>    (giohang/)
     <script src="../era-buoc.js" data-buoc="tien-ich"></script>    (tienich/)

   ┌── VÌ SAO CÓ FILE NÀY ────────────────────────────────────────────────────┐
   │ Chính code cũ đã tự ghi cảnh báo:                                        │
   │   "🔴 Nav 4 tab HARD-CODE roi rac o 4 CHO ... Them/bo tab phai sua DU 4" │
   │ Và đã dính thật: 15/09 thêm tab "Tiện ích" phải sửa 4 nơi.               │
   │ Anh Tony 15/09 bảo xem cách Phú Gia Bảo Lộc xử lý → họ làm đúng thứ này  │
   │ bằng `06-WEB/PGBL-web/assets/eranav.js`: MỘT file, mọi trang gọi 1 dòng. │
   └──────────────────────────────────────────────────────────────────────────┘

   ┌── VẤN ĐỀ THỨ HAI: THANH BƯỚC TRÀN MẤT TAB TRÊN ĐIỆN THOẠI ───────────────┐
   │ Đo thật iPhone dọc 390px, CẢ 4 trang giống nhau:                         │
   │     thấy 2/4 tab · thừa 145px · tab "Tiện ích" nằm HẲN ngoài khung       │
   │ Vuốt tay vẫn tới được nhưng KHÔNG có dấu hiệu nào — khách không biết có. │
   │                                                                          │
   │ PGBL đo được: 5 mục trong 370px, TRÀN 0px. Họ không chữa triệu chứng     │
   │ (thêm mũi tên) mà chữa GỐC — làm cho nó không bao giờ tràn:              │
   │   1. mỗi mục `flex:1` → CHIA ĐỀU bề ngang (mình đang `flex:0 0 auto`,    │
   │      mỗi nút tự rộng theo độ dài chữ rồi đẩy nhau ra ngoài)              │
   │   2. ICON TRÊN · CHỮ DƯỚI → mỗi mục ~66px thay vì ~140px                 │
   │   3. chữ TỰ THU trên màn hẹp                                             │
   │ Anh Tony chốt 15/09: làm theo cách này.                                  │
   └──────────────────────────────────────────────────────────────────────────┘

   🔴 LẤY CÁCH LÀM, KHÔNG LẤY LỚP VỎ — y như hôm bê quả cầu về:
      · PGBL nạp font icon Phosphor từ CDN → ở đây VẼ SVG THẲNG. Nghiệm thu
        của mình đòi tải < 3s trên 4G (mục 3 CLAUDE.md), không thêm CDN.
      · PGBL dùng viên bo tròn 16px + blur → ở đây giữ KHỐI BO 2 GÓC ĐỐI NHAU
        của design system ERA (Group.svg, Anh Tony chốt 12/09).

   🔴 CHIỀU CAO GIỮ ĐÚNG `--wp-nav-h` (52px) — CỐ Ý.
      Dải chip (`#ds`/`#chip`), quả cầu, `#dangxem` đều neo theo công thức
      `bottom: calc(--wp-space-xl + --wp-nav-h + --wp-space-sm)`. Đổi chiều cao
      thanh bước là XÔ LỆCH HẾT mấy thứ đó. Giữ nguyên 52px ⇒ không phải sửa
      một dòng nào ở các lớp khác.

   ⚠️ KHÔNG thêm `env(safe-area-inset-bottom)`: thanh này đã nằm ở
      `bottom:32px`, quá đủ để tránh vạch Home của iPhone. PGBL cần vì thanh
      của họ dán sát `bottom:0`. Thêm vào đây là đẩy thanh lên, hụt khe với
      dải chip phía trên.

   GỠ BỎ = xoá 1 dòng <script> ở trang đó, trả lại `veNav()` cũ.
   ========================================================================== */
(function () {
  'use strict';

  var me = document.currentScript ||
           (function () {           /* dự phòng khi script nạp kiểu defer/động */
             var a = document.querySelectorAll('script[src*="era-buoc.js"]');
             return a.length ? a[a.length - 1] : null;
           })();
  var dang = (me && me.getAttribute('data-buoc')) || '';

  /* GOC = thư mục gốc của web (luôn có '/' ở cuối).
     Đo bằng cách cắt 'era-buoc.js' khỏi src của CHÍNH file này.
     🔴 Bài học 26/08 của PGBL, chép nguyên: KHÔNG được ghi đường dẫn tuyệt đối
        kiểu '/giohang/index.html'. Dấu '/' = gốc DOMAIN, chỉ đúng khi web nằm
        ngay gốc. IT deploy vào thư mục con là 404 sạch, KHÔNG một dòng lỗi.
     🔴 Đo bằng `src` chứ KHÔNG phải `location.pathname` — pathname là đường dẫn
        của TRANG đang mở, mỗi trang một độ sâu khác nhau (`/`, `/tong-quan/`);
        còn src của file này luôn có dạng <GOC>era-buoc.js dù mở từ đâu. */
  var GOC = (function () {
    try {
      var src = (me && me.src) || '';
      if (!src) return '';
      var p = new URL(src, location.href).pathname;
      var i = p.lastIndexOf('/');
      return i < 0 ? '' : p.slice(0, i + 1);
    } catch (e) { return ''; }
  })();

  /* Icon nét mảnh 24×24, vẽ tay theo bộ icon ERA đang dùng trong các trang. */
  var IC = {
    'tong-quan': '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    'thuc-te'  : '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    'gio-hang' : '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    'tien-ich' : '<path d="M12 20v-6"/><path d="M12 14c-3.5 0-5-2.2-5-4.5S9 5 12 5s5 2.2 5 4.5S15.5 14 12 14z"/>'
  };

  /* 🔴 DANH SÁCH TAB — NAY CHỈ CÒN MỘT CHỖ DUY NHẤT.
     Thêm / bớt / đổi tên tab thì sửa ở đây, cả 4 trang đổi theo.
     `href` là đường dẫn TƯƠNG ĐỐI so với GOC (xem ghi chú GOC ở trên). */
  var BUOC = [
    { id: 'tong-quan', ten: 'Tổng quan', href: 'tong-quan/index.html' },
    { id: 'thuc-te',   ten: 'Thực tế',   href: 'index.html'           },
    { id: 'gio-hang',  ten: 'Giỏ hàng',  href: 'giohang/index.html'   },
    { id: 'tien-ich',  ten: 'Tiện ích',  href: 'tienich/index.html'   }
  ];

  var css = ''
    /* Ghi đè hẳn khối `#nav` cũ của từng trang. Cùng độ đặc hiệu (1 id) nhưng
       <style> này chèn lúc chạy nên luôn đứng SAU ⇒ thắng. */
    + '#nav{position:fixed;left:50%;transform:translateX(-50%);'
    + 'bottom:var(--wp-space-xl,32px);z-index:var(--wp-z-overlay,50);'
    + 'display:flex;align-items:stretch;gap:var(--wp-space-xxs,4px);'
    + 'width:calc(100vw - var(--wp-space-xl,32px));max-width:520px;'
    + 'height:var(--wp-nav-h,52px);'
    /* 🔴 BỎ HẲN cuộn ngang — đây chính là thứ làm mất tab. Nay không tràn nữa. */
    + 'overflow:visible;padding:0}'
    /* min-width:0 BẮT BUỘC: thiếu nó thì flex item không co được xuống dưới
       bề rộng nội dung, `flex:1` thành vô nghĩa và vẫn tràn y như cũ. */
    + '#nav .tab{flex:1 1 0;min-width:0;height:100%;--r:16px;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
    + 'gap:2px;padding:0 2px}'
    + '#nav .tab svg{width:18px;height:18px;flex:0 0 auto;fill:none;stroke:currentColor;'
    + 'stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
    + '#nav .tab span{font-size:10px;font-weight:var(--wp-fw-bold,700);letter-spacing:.3px;'
    + 'text-transform:uppercase;white-space:nowrap;line-height:1}'
    /* Màn hẹp: thu chữ + icon (học đúng mốc 560px của PGBL) */
    + '@media (max-width:560px){#nav .tab span{font-size:9px;letter-spacing:.1px}'
    + '#nav .tab svg{width:16px;height:16px}}'
    /* Màn RẤT thấp (điện thoại xoay ngang ~390px cao): bỏ icon, chỉ còn chữ,
       khỏi chiếm chiều cao quý hiếm. */
    + '@media (max-height:420px){#nav .tab svg{display:none}'
    + '#nav .tab span{font-size:10px}}';

  function dung() {
    var N = document.getElementById('nav');
    if (!N) return false;

    var st = document.getElementById('era-buoc-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'era-buoc-style';
      st.textContent = css;
      document.head.appendChild(st);
    }

    N.innerHTML = '';
    BUOC.forEach(function (b) {
      var e = document.createElement('button');
      e.type = 'button';
      e.className = 'k3d tab' + (b.id === dang ? ' on' : '');
      e.dataset.buoc = b.id;
      e.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    (IC[b.id] || '') + '</svg><span></span>';
      e.querySelector('span').textContent = b.ten;
      if (b.id === dang) {
        e.setAttribute('aria-current', 'page');
      } else {
        e.onclick = function () { location.href = GOC + b.href; };
      }
      N.appendChild(e);
    });
    return true;
  }

  /* Trang nào dựng `#nav` bằng JS (veNav) thì thẻ <nav> có thể chưa có nội dung
     lúc script này chạy — không sao, ta ghi đè innerHTML nên chạy sau là đúng. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dung);
  } else {
    dung();
  }
})();
