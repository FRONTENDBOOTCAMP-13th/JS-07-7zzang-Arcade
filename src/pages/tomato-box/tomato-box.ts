import '../../style.css';
import './tomato-box.css';

// 실행
document.addEventListener('DOMContentLoaded', main);

// 전역 변수
const trophyBtn = document.querySelector('.trophy');
const bestScore = document.querySelector('.bestscore') as HTMLElement;
const startBtn = document.querySelector('.start') as HTMLElement;
const intro = document.querySelector('.intro-wrap');
const play = document.querySelector('.play-wrap');

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const cols = 17;
const rows = 10;
const paddingX = 20;
const paddingY = 20;
const numWidth = 745 / cols;
const numHeight = 445 / rows;

let scoreNum = 0;

const timeLimit = 120;
let timeLeft = timeLimit;
const dragThreshold = 5;
let isDragging = false;
let startX: number;
let startY: number;
let endX: number;
let endY: number;
let draggable = false;

let isGameOver = false;

let isVisible = false;

const gridData: any[][] = [];
const flyingTomatoes: {
  x: number;
  y: number;
  number: number;
  incX: number;
  incY: number;
  image: HTMLImageElement;
}[] = [];

const tomatoImage = new Image();
tomatoImage.src = '/src/assets/images/tomato-img/tomato-empty.png';

const tomatoSelectedImage = new Image();
tomatoSelectedImage.src = '/src/assets/images/tomato-img/select-tomato.png';

interface ScoreArray {
  name: string;
  score: number;
}

const localKey = 'tomatobox_Score';

let bgm: HTMLAudioElement;

// 메인, 게임 실행 함수
function main() {
  canvas = document.querySelector('canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  tomatoIntro();
  playGrid();
  events();
  animateTomatoes();
}

// 인트로
function tomatoIntro() {
  // 트로피 클릭
  trophyBtn?.addEventListener('click', () => {
    bestFive();
    ScoreToggle(bestScore);
    playIcon('/sounds/pointer.wav');
  });

  // 스타트 버튼 클릭
  startBtn?.addEventListener('click', () => {
    window.parent.postMessage({ type: 'STOP_BGM' }, '*');

    intro?.classList.add('hide');
    intro?.classList.remove('show');
    play?.classList.remove('hide');
    play?.classList.add('show');

    const bgm = (window as any).bgm as HTMLAudioElement | undefined;
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }

    playBgm('/sounds/tomato-bgm.wav');
    playIcon('/sounds/pointer.wav');

    startTimer();
  });
}

// 스코어 리스트 보이기
function ScoreToggle(scoreEl: HTMLElement) {
  if (!isVisible) {
    scoreEl.classList.remove('hide');
    scoreEl.classList.add('show');
  } else {
    scoreEl.classList.remove('show');
    scoreEl.classList.add('hide');
  }
  isVisible = !isVisible;
}

// 최고 점수 상위 5명
function bestFive() {
  const scoreListEl = document.querySelector('.bestscore .score-list');

  if (!scoreListEl) return;

  const stored = localStorage.getItem(localKey);
  const entries: ScoreArray[] = stored ? JSON.parse(stored) : [];

  const top5 = entries.sort((a, b) => b.score - a.score).slice(0, 5);

  scoreListEl.innerHTML = top5
    .map(
      entry => `
    <li>
      <span class="rank-name">${entry.name}</span>
      <span class="rank-score">${entry.score}</span>
    </li>`,
    )
    .join('');
}

// 숫자 스타일
function setNumStyle() {
  ctx.font = `${numHeight * 0.6}px DungGeunMo`;
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

// 토마토, 숫자 그리기
function playGrid() {
  Promise.all([document.fonts.ready, new Promise(resolve => (tomatoImage.onload = resolve))]).then(() => {
    setNumStyle();

    for (let row = 0; row < rows; row++) {
      const rowData = [];

      for (let col = 0; col < cols; col++) {
        const x = col * numWidth + paddingX;
        const y = row * numHeight + paddingY;
        const randomNum = Math.floor(Math.random() * 9) + 1;

        rowData.push({ x, y, number: randomNum, selected: false });

        ctx.drawImage(tomatoImage, x, y, numWidth, numHeight);
        ctx.fillText(randomNum.toString(), x + numWidth / 2, y + numHeight / 1.85);
      }

      gridData.push(rowData);
    }
  });
}

// 선택된 상태 업데이트
function redrawGrid() {
  setNumStyle();

  for (let row of gridData) {
    for (let cell of row) {
      const img = cell.selected ? tomatoSelectedImage : tomatoImage;

      if (cell.number === 0) continue;

      ctx.drawImage(img, cell.x, cell.y, numWidth, numHeight);
      ctx.fillText(cell.number.toString(), cell.x + numWidth / 2, cell.y + numHeight / 1.85);
    }
  }
}

// 선택된 토마토 찾기
function findTomatoSelect(startX: number, startY: number, endX: number, endY: number) {
  const [minX, maxX] = [Math.min(startX, endX), Math.max(startX, endX)];
  const [minY, maxY] = [Math.min(startY, endY), Math.max(startY, endY)];
  const positions = [],
    numbers = [];

  for (let row = 0; row < gridData.length; row++) {
    for (let col = 0; col < gridData[row].length; col++) {
      const cell = gridData[row][col];
      const cx = cell.x + numWidth / 2;
      const cy = cell.y + numHeight / 2;

      if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
        positions.push({ row, col });
        numbers.push(cell.number);
      }
    }
  }
  return { positions, numbers };
}

// 타이머
function startTimer() {
  const currTimeBar = document.querySelector('.curr') as HTMLDivElement;

  const timer = setInterval(() => {
    timeLeft--;
    currTimeBar.style.height = `${(timeLeft / timeLimit) * 66}%`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      setTimeout(() => {
        currTimeBar.style.height = '0%';
        gameOver();
      }, 1000);
    }
  }, 1000);
}

// 게임오버 시 로직
function gameOver() {
  document.querySelector('.gameover')?.classList.add('show');
  document.querySelector('.overlay-bg')?.classList.add('show');

  const score = scoreNum;
  const scoreInGameOver = document.querySelector('.gameover-score .gamescore') as HTMLElement;
  isGameOver = true;

  scoreInGameOver.textContent = score.toString();

  // 게임 오버 음악
  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
    playGameover('/sounds/tomato-gameover.wav');
  }
}

// 드래그 박스 스타일
function selectBoxStyle() {
  if (draggable && isDragging && !isGameOver) {
    ctx.strokeStyle = '#0092FF';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(242, 175, 0,0.2)';
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    ctx.fillRect(startX, startY, endX - startX, endY - startY);
  }
}

// 드래그 이벤트, 다시하기, 취소하기 클릭 이벤트, 닉네임 입력 이벤트
function events() {
  const nicknameInput = document.querySelector('.nickname-input') as HTMLInputElement;
  const saveScoreBtn = document.querySelector('.savescore .savebtn') as HTMLElement;
  const saveBtn = document.querySelector('.savebtn');
  const saveScore = document.querySelector('.savescore') as HTMLElement;
  const restart = document.querySelector('.retry');
  const cancel = document.querySelector('.cancel');
  const scoreInGame = document.querySelector('.overlay .score') as HTMLElement;

  // 드래그 시작 위치, 마우스 클릭 유지 상태
  canvas.addEventListener('mousedown', e => {
    if (isGameOver) return;

    startX = e.offsetX;
    startY = e.offsetY;
    draggable = true;
    isDragging = false;
  });

  // 드래그 시작위치에서 움직임, 마우스 드래그
  canvas.addEventListener('mousemove', e => {
    if (!draggable || isGameOver) return;

    endX = e.offsetX;
    endY = e.offsetY;

    if (!isDragging && (Math.abs(endX - startX) > dragThreshold || Math.abs(endY - startY) > dragThreshold)) {
      isDragging = true;
    }

    if (!isDragging) return;

    const selection = findTomatoSelect(startX, startY, endX, endY);

    clearSelect();

    selection.positions.forEach(pos => {
      if (gridData[pos.row][pos.col].number !== 0) {
        gridData[pos.row][pos.col].selected = true;
      }
    });
  });

  // 드래그 마지막, 마우스 떼기
  canvas.addEventListener('mouseup', e => {
    if (isGameOver) return;

    endX = e.offsetX;
    endY = e.offsetY;

    if (isDragging) {
      const selection = findTomatoSelect(startX, startY, endX, endY);
      const filtered = selection.positions.filter(pos => gridData[pos.row][pos.col].number !== 0);
      const nums = filtered.map(pos => gridData[pos.row][pos.col].number);

      if (nums.length && nums.reduce((a, b) => a + b, 0) === 10) {
        playEffect('/sounds/tomato-effect.wav');

        filtered.forEach(pos => {
          const cell = gridData[pos.row][pos.col];

          flyingTomatoes.push({
            x: cell.x,
            y: cell.y,
            incX: (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 6 + 4),
            incY: -(Math.random() * 5 + 7),
            image: tomatoSelectedImage,
            number: cell.number,
          });

          gridData[pos.row][pos.col].number = 0;
        });

        scoreNum += nums.length;

        if (scoreInGame) scoreInGame.textContent = scoreNum.toString();
      }
    }

    draggable = false;
    isDragging = false;

    clearSelect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    redrawGrid();
  });

  // 캔버스 밖 벗어났을 때, 드래그 취소되게 하기
  canvas.addEventListener('mouseleave', () => {
    if (isGameOver) return;

    draggable = false;

    clearSelect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    redrawGrid();
  });

  // 점수 저장
  saveBtn?.addEventListener('click', () => {
    playIcon('/sounds/pointer.wav');
    if (!isVisible) {
      saveScore.classList.remove('hide');
      saveScore.classList.add('show');
    } else {
      saveScore.classList.remove('show');
      saveScore.classList.add('hide');
    }

    isVisible = !isVisible;
  });

  // 다시하기
  restart?.addEventListener('click', () => {
    localStorage.removeItem('tomatobox_lastScore');
    playIcon('/sounds/pointer.wav');

    setTimeout(() => {
      window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
    }, 200);

    // 2) 약간 기다렸다가 reload
    setTimeout(() => {
      location.href = '/src/pages/tomato-box/tomato-box.html';
    }, 200); // 0.2초만 기다려도 충분
  });

  // 취소
  cancel?.addEventListener('click', () => {
    playIcon('/sounds/pointer.wav');
    if (saveScore?.classList.contains('show')) {
      saveScore.classList.remove('show');
      saveScore.classList.add('hide');
    }
  });

  // 닉네임 입력 받고 점수저장
  saveScoreBtn?.addEventListener('click', () => {
    if (!nicknameInput || !nicknameInput.value.trim()) {
      playIcon('/sounds/pointer.wav');
      Toast('닉네임을 입력해주세요!');

      return;
    }
    playIcon('/sounds/pointer.wav');
    const name = nicknameInput.value.trim().toUpperCase();
    const score = scoreNum;

    const newEntry: ScoreArray = { name, score };
    const stored = localStorage.getItem(localKey);
    const scoreList: ScoreArray[] = stored ? JSON.parse(stored) : [];

    scoreList.unshift(newEntry);
    scoreList.sort((a, b) => b.score - a.score);
    localStorage.setItem(localKey, JSON.stringify(scoreList));

    nicknameInput.value = '';

    Toast(`점수가 저장되었습니다!`);

    setTimeout(() => {
      window.location.href = '/src/pages/tomato-box/tomato-box.html';
    }, 1500);
  });

  nicknameInput?.addEventListener('input', () => {
    const value = nicknameInput.value;
    const sliced = [...value].slice(0, 3).join('');

    if (value !== sliced) {
      nicknameInput.value = sliced;
    }
  });
}

// 토스트
function Toast(message: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 1500);
}

// 선택 초기화
function clearSelect() {
  for (let row of gridData) {
    for (let cell of row) cell.selected = false;
  }
}

// 토마토 애니메이션, 드래그 표시
function animateTomatoes() {
  for (let i = flyingTomatoes.length - 1; i >= 0; i--) {
    const t = flyingTomatoes[i];

    t.incY += 2; // 떨어지는 속도
    t.x += t.incX;
    t.y += t.incY;

    if (t.y > canvas.height) flyingTomatoes.splice(i, 1);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  redrawGrid();

  flyingTomatoes.forEach(t => {
    ctx.drawImage(t.image, t.x, t.y, numWidth, numHeight);
    ctx.fillText(t.number.toString(), t.x + numWidth / 2, t.y + numHeight / 1.85);
  });

  selectBoxStyle();
  requestAnimationFrame(animateTomatoes);
}

// 배경음
function playBgm(soundPath: string) {
  bgm = new Audio(soundPath);
  bgm.loop = true;
  bgm.volume = 0.5;

  bgm.play().catch(err => {
    console.warn('배경음 재생 실패:', err);
  });
}

// 토마토 떨어질 때 효과음
function playEffect(soundPath: string) {
  const effect = new Audio(soundPath);
  effect.volume = 0.5;

  effect.play().catch(err => {
    console.warn('효과음 재생 실패:', err);
  });
}

// 게임오버 효과음
function playGameover(soundPath: string) {
  const gameover = new Audio(soundPath);
  gameover.volume = 0.5;

  gameover.play().catch(err => {
    console.warn('효과음 재생 실패:', err);
  });
}

// 홈, 트로피 클릭 효과음
function playIcon(soundPath: string) {
  const pointer = new Audio(soundPath);
  pointer.volume = 1;

  pointer.play().catch(err => {
    console.warn('효과음 재생 실패', err);
  });
}
