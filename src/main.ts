import './style.css';
// main.ts
const selection = document.querySelector<HTMLElement>('.game-selection')!;
const audioIcon = document.querySelector<HTMLElement>('.audio-icon')!;
const gameScreen = document.querySelector<HTMLElement>('.game-screen')!;
const sel = document.querySelector<HTMLElement>('.game-selection')!;
const coin = document.querySelector<HTMLElement>('.coin-slot')!;
const coinSlot = document.querySelector<HTMLElement>('.coin-slot')!;
const coinSound = new Audio('/sounds/coin-insert.mp3');
const bgm = new Audio('/sounds/bg-music.mp3');
bgm.loop = true;
bgm.volume = 0.2;
bgm.preload = 'auto';
let bgmStarted = false;
let currentObj: HTMLObjectElement | null = null;
coinSound.preload = 'auto'; // 미리 로드해 두기

const gamePaths: Record<string, string> = {
  animal: '/src/pages/animal-patrol/animal.html',
  space: '/src/pages/the-seventh-space/space.html',
  smash: '/src/pages/smash7-hit/smash.html',
  tomato: '/src/pages/tomato-box/tomato-box.html',
};
let isZoomed = false;

(window as any).bgm = bgm;

// 메인-인트로 이후 개인 화면 진입 시 재생 멈춤
window.addEventListener('message', event => {
  const bgm = (window as any).bgm as HTMLAudioElement;

  if (event.data?.type === 'STOP_BGM') {
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
  }

  if (event.data?.type === 'PLAY_MAIN_BGM') {
    if (bgm && bgm.paused) {
      bgm.play().catch(() => {
        console.warn('BGM 재생 실패');
      });
    }
  }
});

function updateMainImgScale() {
  if (isZoomed) return;
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

// 기본 리사이즈 핸들러
window.addEventListener('load', updateMainImgScale);
window.addEventListener('resize', updateMainImgScale);

coin.addEventListener('click', () => {
  const el = document.querySelector<HTMLElement>('.main-img')!;
  if (currentObj) {
    // 이미 object(게임 iframe)가 떠 있으면
    playCoinAnimation();
    isZoomed = true;
    el.style.transform = 'translate(-50%, -50%) scale(1)';
    el.style.transition = 'transform 0.8s ease-in-out';
    return;
  }

  // translate만 남기고, scale을 1로 리셋
  isZoomed = true;
  sel.style.display = 'grid';
  el.style.transform = 'translate(-50%, -50%) scale(1)';
  el.style.transition = 'transform 0.8s ease-in-out';
});

// “바깥 영역” 클릭 감지
document.addEventListener('click', e => {
  const target = e.target as Node;
  const selEl = document.querySelector<HTMLElement>('.game-selection');
  if (!selEl) return;

  if (!gameScreen.contains(target) && !coin.contains(target) && !selEl.contains(target) && isZoomed) {
    isZoomed = false;

    const el = document.querySelector<HTMLElement>('.main-img')!;

    // 다시 애니메이션 켜고
    el.style.transition = 'transform 0.8s ease-in-out';
    updateMainImgScale();
  }
});

audioIcon.addEventListener('click', toggleBgm);

selection.querySelectorAll<HTMLElement>(':scope > div').forEach(icon => {
  icon.addEventListener('click', () => {
    const key = icon.classList[0];
    const url = gamePaths[key];
    if (!url) return;

    // 1) selection 숨기기
    selection.style.display = 'none';

    // 2) 이전 object 숨김 스타일 초기화
    if (currentObj) {
      currentObj.hidden = true;
      currentObj.style.display = 'none';
    }

    // 3) 같은 키면 재활용, 아니면 새로 생성
    let obj: HTMLObjectElement;
    if (currentObj && currentObj.dataset.key === key) {
      obj = currentObj;
      // 재활용 시엔 hidden 풀고, display 초기화
      obj.hidden = false;
      obj.style.display = '';
    } else {
      if (currentObj) gameScreen.removeChild(currentObj);

      obj = document.createElement('object');
      obj.dataset.key = key;
      obj.data = url;
      obj.type = 'text/html';
      obj.width = '100%';
      obj.height = '100%';
      // 표시 상태로
      obj.hidden = false;
      obj.style.display = '';

      obj.addEventListener('load', () => {
        const doc = (obj as any).contentDocument as Document;
        doc.querySelectorAll<HTMLAnchorElement>('a[href="/"], a[href="/index.html"], a[href="/home.html"]').forEach(link => {
          link.addEventListener('click', ev => {
            ev.preventDefault();
            // 홈 클릭 시
            obj.hidden = true;
            obj.style.display = 'none';
            selection.style.display = 'grid';
          });
        });
      });

      gameScreen.appendChild(obj);
      currentObj = obj;
    }
  });
});

function toggleBgm() {
  if (bgmStarted) {
    bgm.pause();
    audioIcon.classList.add('off');
  } else {
    bgm.play();
    audioIcon.classList.remove('off');
  }
  bgmStarted = !bgmStarted;
}

function playCoinAnimation() {
  // 1) 동전 삽입 효과 사운드
  const coinSound = new Audio('/sounds/coin-insert.mp3');
  coinSound.play().catch(() => {
    /* 자동 재생 차단 무시 */
  });

  toggleBgm();

  // 3) 동전 애니메이션
  const img = document.createElement('img');
  img.src = '/images/coin.png';
  img.classList.add('insert-coin');
  coinSlot.appendChild(img);

  img.addEventListener('animationend', () => {
    img.remove();
  });
}
// 기존에 coinSlot 클릭에 바인딩된 부분을 playCoinAnimation 호출로 교체
coinSlot.addEventListener('click', playCoinAnimation);
