/* Bắt đầu cảnh vườn hoa.
   - Có cảnh sóc (#squirrel-scene): chờ squirrel.js gọi window.startFlowers() sau khi bấm YES.
   - Không có cảnh sóc: bắt đầu ngay khi trang tải xong. */
window.startFlowers = function () {
  if (window.__flowersStarted) return;
  window.__flowersStarted = true;
  document.body.classList.remove("container");          // bỏ pause -> hoa nở
  document.dispatchEvent(new Event("flowers:start"));   // hearts.js bắt đầu bay tim
};

if (!document.getElementById("squirrel-scene")) {
  window.addEventListener("load", window.startFlowers);
}
