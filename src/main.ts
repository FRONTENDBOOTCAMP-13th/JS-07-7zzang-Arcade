// main.ts

function updateMainImgScale() {
  const el = document.querySelector<HTMLElement>('.main-img')!;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ORIGINAL_W = 5200;
  const ORIGINAL_H = 2600;

  const scaleX = vw / ORIGINAL_W;
  const scaleY = vh / ORIGINAL_H;
  const scale = Math.max(scaleX, scaleY);

  el.style.transformOrigin = 'center center';
  el.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// 1) 기본 리사이즈 핸들러
window.addEventListener('load', updateMainImgScale);
window.addEventListener('resize', updateMainImgScale);

// 2) 코인 슬롯 클릭 시 스케일만 제거
const coin = document.querySelector<HTMLElement>('.coin-slot')!;
coin.addEventListener('click', () => {
  const el = document.querySelector<HTMLElement>('.main-img')!;
  // translate만 남기고, scale을 1로 리셋
  el.style.transform = 'translate(-50%, -50%) scale(1)';
});
