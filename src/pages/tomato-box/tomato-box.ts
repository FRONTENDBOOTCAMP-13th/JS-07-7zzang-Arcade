import '../../style.css';
import './tomato-box.css';

// 이미지 import
import tomatoImg from '../../assets/images/tomato-img/tomato-empty.webp';
import tomatoSelectedSrc from '../../assets/images/tomato-img/select-tomato.webp';

import bgmOnImg from '../../assets/images/tomato-img/bgmon.webp';
import bgmOffImg from '../../assets/images/tomato-img/bgmoff.webp';

// 파이어베이스 컬렉션 import
import { fireScore, getTopScores } from '../../utilits/scoreService';

// 전역 변수
const homeBtn = document.querySelector('.home');
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
tomatoImage.src = tomatoImg;

const tomatoSelectedImage = new Image();
tomatoSelectedImage.src = tomatoSelectedSrc;

let bgm: HTMLAudioElement;
let isBgmOn = true;

let angle = 0;
let animationFrameId: number;

let pointerSound: HTMLAudioElement | null = null;
let effectSound: HTMLAudioElement | null = null;

let isAnimating = false;

document.addEventListener('DOMContentLoaded', () => {
  tomatoIntro();

  trophyBtn?.addEventListener('click', handleTrophyClick);
});

// 메인, 게임 실행 함수
function main() {
  cancelAnimationFrame(animationFrameId);

  const canvasEl = document.querySelector('canvas');

  if (!canvasEl) {
    return;
  }

  canvas = canvasEl as HTMLCanvasElement;

  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) {
    return;
  }

  ctx = maybeCtx;

  playGrid();
  events();

  isAnimating = true;
  animateTomatoes();

  // 개발자 모드
  initDevMode();
}

// 게임 상태 초기화 함수
function resetGameState() {
  scoreNum = 0;
  timeLeft = timeLimit;
  isGameOver = false;
  isVisible = false;
  draggable = false;
  isDragging = false;

  gridData.length = 0;
  flyingTomatoes.length = 0;

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// UI 상태 초기화 함수
function resetUIState() {
  const scoreInGame = document.querySelector('.overlay .score') as HTMLElement;
  if (scoreInGame) scoreInGame.textContent = '0';

  const currTimeBar = document.querySelector('.curr') as HTMLDivElement;
  if (currTimeBar) currTimeBar.style.height = '66%';

  const gameoverPopup = document.querySelector('.gameover');
  const overlayBg = document.querySelector('.overlay-bg');
  const saveScore = document.querySelector('.savescore') as HTMLElement;
  const startPopup = document.querySelector('.start-popup') as HTMLElement;

  gameoverPopup?.classList.remove('show');
  overlayBg?.classList.remove('show');
  saveScore?.classList.remove('show');
  saveScore?.classList.add('hide');
  startPopup?.classList.remove('show');
  startPopup?.classList.add('hide');

  const nicknameInput = document.querySelector('.nickname-input') as HTMLInputElement;
  if (nicknameInput) nicknameInput.value = '';

  const bestScoreList = document.querySelector('.bestscore') as HTMLElement;
  if (bestScoreList) {
    bestScoreList.classList.remove('show');
    bestScoreList.classList.add('hide');
  }
  isVisible = false;
}

// 화면 전환
function showIntroScreen() {
  intro?.classList.remove('hide');
  intro?.classList.add('show');
  play?.classList.add('hide');
  play?.classList.remove('show');
}

// 게임 초기화, 게임 마무리하고 되돌아갈때 사용
function restartGame() {
  cancelAnimationFrame(animationFrameId); // 토마토 애니메이션 초기화
  isAnimating = false;

  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }

  isBgmOn = true;
  cdState();

  resetGameState();
  resetUIState();
  showIntroScreen();

  tomatoIntro();

  window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
  events();
}

// 인트로
function tomatoIntro() {
  // 홈 버튼 클릭
  homeBtn?.addEventListener('click', () => {
    if (isBgmOn) {
      playIcon('/sounds/pointer.wav');
    }

    window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
  });

  // 트로피 클릭
  trophyBtn?.removeEventListener('click', handleTrophyClick);
  trophyBtn?.addEventListener('click', handleTrophyClick);

  // 스타트 버튼 클릭
  startBtn?.addEventListener('click', () => {
    const popup = document.querySelector('.start-popup') as HTMLElement;

    window.parent.postMessage({ type: 'STOP_BGM' }, '*');

    if (isBgmOn) {
      playBgm('/sounds/tomato-bgm.wav');
    }
    cdState();

    intro?.classList.add('hide');
    intro?.classList.remove('show');
    play?.classList.remove('hide');
    play?.classList.add('show');

    popup.classList.remove('hide');
    popup.classList.add('show');

    playIcon('/sounds/pointer.wav');
  });

  const onoffBtn = document.querySelector('.onoff-buttons img') as HTMLImageElement;

  onoffBtn.removeEventListener('click', handleOnoffClick);
  onoffBtn.addEventListener('click', handleOnoffClick);

  // esc 키보드 이벤트
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const popup = document.querySelector('.start-popup') as HTMLElement;
      const overlay = document.querySelector('.overlay-bg') as HTMLElement;

      if (!popup.classList.contains('hide')) {
        popup.classList.add('hide');
        popup.classList.remove('show');
        overlay?.classList.remove('show');

        window.parent.postMessage({ type: 'STOP_BGM' }, '*');

        setTimeout(() => {
          main();
        }, 50);

        if (isBgmOn) {
          playBgm('/sounds/tomato-bgm.wav');
        }

        playIcon('/sounds/pointer.wav');

        startTimer();
      }
    }
  });
}

function ScoreToggle(scoreEl: HTMLElement) {
  const isNowVisible = scoreEl.classList.contains('show');
  scoreEl.classList.toggle('show', !isNowVisible);
  scoreEl.classList.toggle('hide', isNowVisible);
}

// 최고 점수 상위 5명
async function bestFive() {
  const scoreListEl = document.querySelector('.bestscore .score-list');

  if (!scoreListEl) return;

  // firestore 접근, tomato-box 값 가진 데이터들 중 상위 5개 가져옴
  try {
    const top5 = await getTopScores('tomato-box');

    scoreListEl.innerHTML = top5
      .map(
        (entry: any) => `
        <li>
          <span class="rank-name">${entry.nickname}</span>
          <span class="rank-score">${entry.score}</span>
        </li>`,
      )
      .join('');
  } catch (err) {}
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
  const tomatoReady = new Promise<void>(resolve => {
    if (tomatoImage.complete) {
      resolve();
    } else {
      tomatoImage.onload = () => resolve();
    }
  });

  Promise.all([document.fonts.ready, tomatoReady]).then(() => {
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

  if (currTimeBar) {
    currTimeBar.style.height = '66%';
  }

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

    if (isBgmOn) {
      playGameover('/sounds/tomato-gameover.wav');
    }
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

  // 점수 저장 팝업 토글
  saveBtn?.addEventListener('click', () => {
    playIcon('/sounds/pointer.wav');
    if (!isVisible) {
      saveScore.classList.remove('hide');
      saveScore.classList.add('show');
      nicknameInput.focus();
    } else {
      saveScore.classList.remove('show');
      saveScore.classList.add('hide');
    }

    isVisible = !isVisible;
  });

  // 다시하기
  restart?.addEventListener('click', () => {
    playIcon('/sounds/pointer.wav');

    restartGame();
  });

  // 점수저장
  saveScoreBtn?.removeEventListener('click', handleSaveScoreClick);
  saveScoreBtn?.addEventListener('click', handleSaveScoreClick);

  // 취소
  cancel?.addEventListener('click', () => {
    playIcon('/sounds/pointer.wav');

    restartGame();
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
function Toast(message: string, _shouldReset: boolean = true) {
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
  if (!isAnimating) return;

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
  if (!isBgmOn) return;

  if (bgm) {
    bgm.play().catch(err => {
      console.warn('BGM resume 실패:', err);
    });
    return;
  }

  bgm = new Audio(soundPath);
  bgm.loop = true;
  bgm.volume = 0.1;

  bgm.play().catch(err => {
    console.warn('배경음 재생 실패:', err);
  });
}

// 토마토 떨어질 때 효과음
function playEffect(soundPath: string) {
  if (!isBgmOn) return;

  if (!effectSound) {
    effectSound = new Audio(soundPath);
    effectSound.volume = 0.1;
  } else {
    effectSound.pause();
    effectSound.currentTime = 0;
  }

  effectSound.play().catch(err => {
    console.warn('효과음 재생 실패:', err);
  });
}

// 게임오버 효과음
function playGameover(soundPath: string) {
  if (!isBgmOn) return;

  const gameover = new Audio(soundPath);
  gameover.volume = 0.1;

  gameover.play().catch(err => {
    console.warn('효과음 재생 실패:', err);
  });
}

// 버튼 클릭 시 효과음
function playIcon(soundPath: string) {
  if (!isBgmOn) return;

  if (!pointerSound) {
    pointerSound = new Audio(soundPath);
    pointerSound.volume = 0.4;
  } else {
    pointerSound.pause();
    pointerSound.currentTime = 0;
  }

  pointerSound.play().catch(err => {
    console.warn('효과음 재생 실패', err);
  });
}

// 개발자 모드, p키 입력 시 10초씩 시간 줄어듬
function initDevMode() {
  document.addEventListener('keydown', e => {
    if (e.key.toUpperCase() === 'P') {
      if (!isGameOver && play?.classList.contains('show')) {
        timeLeft = Math.max(0, timeLeft - 10);

        const currTimeBar = document.querySelector('.curr') as HTMLDivElement;
        if (currTimeBar) {
          currTimeBar.style.height = `${(timeLeft / timeLimit) * 66}%`;
        }
      }
    }
  });
}

// 점수저장 함수
async function handleSaveScoreClick() {
  const nicknameInput = document.querySelector('.nickname-input') as HTMLInputElement;
  const value = nicknameInput?.value.trim();

  if (!nicknameInput || !value) {
    playIcon('/sounds/pointer.wav');
    Toast('닉네임을 입력해주세요!');
    return;
  }

  const isValid = /^[가-힣a-zA-Z]{1,3}$/.test(value);
  if (!isValid) {
    playIcon('/sounds/pointer.wav');
    Toast('닉네임은 한글/영문 1~3자로 입력해주세요!');
    return;
  }

  playIcon('/sounds/pointer.wav');

  const score = scoreNum;

  try {
    await fireScore(value, score, 'tomato-box');
    Toast(`점수가 저장되었습니다!`);

    setTimeout(() => {
      restartGame();
    }, 2000);
  } catch (err) {
    Toast(`이미 존재하는 닉네임입니다.`, false);
  }
}

// cd 돌아가기 애니메이션
function cdSpin() {
  cancelAnimationFrame(animationFrameId);
  function rotateCD() {
    angle = (angle + 2) % 360;
    const cdImg = document.querySelector('.cd-img') as HTMLImageElement;
    if (cdImg) cdImg.style.transform = `rotate(${angle}deg)`;
    animationFrameId = requestAnimationFrame(rotateCD);
  }
  rotateCD();
}

function stopCDSpin() {
  cancelAnimationFrame(animationFrameId);
}

// cd 상태 반영 위한 함수
function cdState() {
  const onoffBtn = document.querySelector('.onoff-buttons img') as HTMLImageElement;

  if (isBgmOn) {
    cdSpin();
    onoffBtn.src = bgmOnImg;
  } else {
    stopCDSpin();
    onoffBtn.src = bgmOffImg;
  }
}

// 온오프 함수
function handleOnoffClick() {
  isBgmOn = !isBgmOn;

  const onoffBtn = document.querySelector('.onoff-buttons img') as HTMLImageElement;

  if (isBgmOn) {
    cdSpin();
    onoffBtn.src = bgmOnImg;
    playBgm('/sounds/tomato-bgm.wav');
  } else {
    stopCDSpin();
    onoffBtn.src = bgmOffImg;

    if (bgm) {
      bgm.pause();
    }
  }
}

// 트로피 클릭 함수
function handleTrophyClick() {
  bestFive();
  ScoreToggle(bestScore);
  playIcon('/sounds/pointer.wav');
}
