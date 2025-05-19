import './style.css';
// main.ts
const selection = document.querySelector<HTMLElement>('.game-selection')!;
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
coinSound.preload = 'auto'; // 미리 로드해 두기

const gamePaths: Record<string, string> = {
  animal: '/src/pages/animal-patrol/animal.html',
  space: '/src/pages/the-seventh-space/space.html',
  smash: '/src/pages/smash7-hit/smash.html',
  tomato: '/src/pages/tomato-box/tomato-box.html',
};
let isZoomed = false;

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
  // translate만 남기고, scale을 1로 리셋
  isZoomed = true;
  sel.style.display = 'grid';
  el.style.transform = 'translate(-50%, -50%) scale(1)';
});

// “바깥 영역” 클릭 감지
document.addEventListener('click', e => {
  const target = e.target as Node;
  const selEl = document.querySelector<HTMLElement>('.game-selection');
  // selEl 이 없으면 그냥 빠져나가기
  if (!selEl) return;

  if (!gameScreen.contains(target) && !coin.contains(target) && !selEl.contains(target) && isZoomed) {
    isZoomed = false;
    updateMainImgScale();
  }
});

selection.querySelectorAll<HTMLElement>(':scope > div').forEach(icon => {
  console.log('클릭');
  icon.addEventListener('click', () => {
    const key = icon.classList[0];
    const url = gamePaths[key];
    if (!url) return;
    history.pushState({ view: 'game', key }, '', `/#${key}`);
    // 이전 콘텐츠 제거
    gameScreen.innerHTML = '';

    // object 요소 생성
    const obj = document.createElement('object');
    obj.data = url;
    obj.type = 'text/html';
    obj.setAttribute('width', '100%');
    obj.setAttribute('height', '100%');
    obj.addEventListener('load', () => {
      const doc = (obj as any).contentDocument as Document;
      const homeLink = doc.querySelector<HTMLAnchorElement>('a[href="/"], a[href="/index.html"], a[href="/home.html"]');
      if (homeLink) {
        homeLink.addEventListener('click', e => {
          e.preventDefault();
          window.history.back();
        });
      }
    });

    // 3) gameScreen에 삽입
    gameScreen.appendChild(obj);

    // 4) 선택 메뉴 숨기기
    selection.classList.add('hidden');
  });
});

window.addEventListener('popstate', e => {
  const state = (e.state as { view: string; key?: string }) || { view: 'menu' };

  if (state.view === 'menu') {
    // ① object만 지우고
    const existing = gameScreen.querySelector('object');
    if (existing) gameScreen.removeChild(existing);

    // ② selection HTML을 innerHTML로 다시 그리기
    gameScreen.innerHTML = `
      <div class="game-selection">
        <div class="animal"></div>
        <div class="space"></div>
        <div class="smash"></div>
        <div class="tomato"></div>
      </div>
    `;

    selection.style.display = 'grid';
    // 클릭 이벤트도 다시
    const newSelection = gameScreen.querySelector<HTMLElement>('.game-selection')!;
    newSelection.querySelectorAll<HTMLElement>(':scope > div').forEach(icon => {
      icon.addEventListener('click', () => {
        const key = icon.classList[0];
        const url = gamePaths[key];
        if (!url) return;
        history.pushState({ view: 'game', key }, '', `/#${key}`);
        // 이전 콘텐츠 제거
        gameScreen.innerHTML = '';

        // object 요소 생성
        const obj = document.createElement('object');
        obj.data = url;
        obj.type = 'text/html';
        obj.setAttribute('width', '100%');
        obj.setAttribute('height', '100%');
        obj.addEventListener('load', () => {
          const doc = (obj as any).contentDocument as Document;
          const homeLink = doc.querySelector<HTMLAnchorElement>('a[href="/"], a[href="/index.html"], a[href="/home.html"]');
          console.log(homeLink);
          if (homeLink) {
            homeLink.addEventListener('click', e => {
              console.log('홈버튼 클릭');
              e.preventDefault();
              window.history.back();
            });
          }
        });
        // gameScreen에 삽입
        gameScreen.appendChild(obj);
      });
    });
  } else if (state.view === 'game' && state.key) {
    console.log('else if 실행');

    // 다시 해당 게임 화면으로
    const obj = document.createElement('object');
    obj.data = gamePaths[state.key];
    obj.type = 'text/html';
    obj.setAttribute('width', '100%');
    obj.setAttribute('height', '100%');

    gameScreen.appendChild(obj);
    selection.style.display = 'none';
  }
});

function playCoinAnimation() {
  // 1) 동전 삽입 효과 사운드
  const coinSound = new Audio('/sounds/coin-insert.mp3');
  coinSound.play().catch(() => {
    /* 자동 재생 차단 무시 */
  });

  // 2) BGM은 한 번만 시작
  if (!bgmStarted) {
    bgmStarted = true;
    setTimeout(() => {
      bgm.play().catch(() => {});
    }, 1000); // 1000ms = 1초
  }

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
