import '../../style.css';
import './animal.css';
import bananaImg from '../../assets/images/animal-img/banana.webp';
import canImg from '../../assets/images/animal-img/can.webp';
import fireImg from '../../assets/images/animal-img/fire.webp';
import boom1Img from '../../assets/images/animal-img/boom1.webp';
import boom2Img from '../../assets/images/animal-img/boom2.webp';
import acornsImg from '../../assets/images/animal-img/acorns.webp';
import scoreChick1 from '../../assets/images/animal-img/score-chick1.webp';
import scoreChick2 from '../../assets/images/animal-img/score-chick2.webp';
import scoreChick3 from '../../assets/images/animal-img/score-chick3.webp';
import scoreChick4 from '../../assets/images/animal-img/score-chick4.webp';
import scoreChick5 from '../../assets/images/animal-img/score-chick5.webp';
import chickIdleFront from '../../assets/images/animal-img/chick-idle-front.webp';
import chickFallen from '../../assets/images/animal-img/chick-fallen.webp';
import idleLeft from '../../assets/images/animal-img/chick-idle-left.webp';
import idleRight from '../../assets/images/animal-img/chick-idle-right.webp';
import evo1Left from '../../assets/images/animal-img/chick-evo1-left.webp';
import evo1Right from '../../assets/images/animal-img/chick-evo1-right.webp';
import evo2Left from '../../assets/images/animal-img/chick-evo2-left.webp';
import evo2Right from '../../assets/images/animal-img/chick-evo2-right.webp';
import evo3Left from '../../assets/images/animal-img/chick-evo3-left.webp';
import evo3Right from '../../assets/images/animal-img/chick-evo3-right.webp';
import evo4Left from '../../assets/images/animal-img/chick-evo4-left.webp';
import evo4Right from '../../assets/images/animal-img/chick-evo4-right.webp';

// 파이어 베이스 파일 import
import { fireScore, getTopScores } from '../../utilits/scoreService';

function getElById<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is not a ${type.name}`);
  return el;
}
function queryEl<T extends HTMLElement>(selector: string, type: { new (): T }): T {
  const el = document.querySelector(selector);
  if (!(el instanceof type)) throw new Error(`${selector} is not a ${type.name}`);
  return el;
}

/**
 * 배경 관련 요소 및 상태 초기화
 */
const bg1 = getElById('bg1', HTMLElement);
const bg2 = getElById('bg2', HTMLElement);
const starContainer = getElById('star-container', HTMLElement);
const clouds = document.querySelectorAll('.cloud');

const gradients: string[] = [
  'linear-gradient(135deg, #1976D2 0%, #2196F3 25%, #42A5F5 50%, #64B5F6 75%, #BBDEFB 95%, #E0F7FA 100%)',
  'linear-gradient(135deg, #90CAF9 0%, #BBDEFB 30%, #E3F2FD 65%, #FFF8E1 100%)',
  'linear-gradient(135deg, #FFE0B2 0%, #FFD180 30%, #F8BBD0 60%, #E1BEE7 100%)',
  'linear-gradient(to top, #F8BBD0 0%, #CE93D8 40%, #9575CD 80%, #5C6BC0 100%)',
  'linear-gradient(to top, #5C6BC0 0%, #3949AB 30%, #283593 60%, #1A237E 100%)',
  'linear-gradient(to bottom, #0A0F1E 0%, #0D1B2A 30%, #1B263B 70%, #243447 100%)',
];

let gradientIndex = 0;
let isBg1Visible = true;

/**
 * 초기 배경 설정 + 별 생성
 */
function initBackground(): void {
  bg1.style.background = gradients[0];
  bg1.classList.add('visible');
  bg2.classList.add('hidden');
  createStars(60);
}
// 초기화 실행
initBackground();

/**
 * 점수 또는 단계에 따라 배경 전환
 * @param score 현재 배경 단계 (0~5)
 */
function updateBackgroundByStep(score: number): void {
  const newIndex = getBackgroundIndex(score);

  if (newIndex === gradientIndex) return;

  gradientIndex = newIndex;
  const nextGradient = gradients[newIndex];

  if (isBg1Visible) {
    bg2.style.background = nextGradient;
    bg2.classList.replace('hidden', 'visible');
    bg1.classList.replace('visible', 'hidden');
  } else {
    bg1.style.background = nextGradient;
    bg1.classList.replace('hidden', 'visible');
    bg2.classList.replace('visible', 'hidden');
  }

  const isNight = newIndex >= gradients.length - 3;
  starContainer.style.display = isNight ? 'block' : 'none';
  starContainer.style.opacity = isNight ? `${0.3 + 0.3 * (newIndex % 3)}` : '0';

  clouds.forEach(cloud => {
    if (cloud instanceof HTMLElement) {
      cloud.style.opacity = isNight ? '0.6' : '1';
    }
  });

  isBg1Visible = !isBg1Visible;
}

function getBackgroundIndex(score: number): number {
  if (score < 15) return 0;
  if (score < 35) return 1;
  if (score < 60) return 2;
  if (score < 90) return 3;
  if (score < 130) return 4;
  return 5;
}

/**
 * 별 생성
 * @param count 생성할 별 개수
 */
function createStars(count: number): void {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    starContainer.appendChild(star);
  }
}

/**
 * 인트로 트로피 팝업
 */
const trophyButton = queryEl('.trophy-button', HTMLImageElement);
const bestScorePopup = getElById('bestScorePopup', HTMLDivElement);

// 트로피 버튼 클릭 시 BEST SCORE 팝업 열기
trophyButton.addEventListener('click', () => {
  showBestScores();
  bestScorePopup.classList.remove('hidden');
});
// 팝업 외부 클릭 시 BEST SCORE 팝업 닫기
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as Node;
  if (!bestScorePopup.contains(target) && !trophyButton.contains(target)) {
    bestScorePopup.classList.add('hidden');
  }
});
// 팝업 닫기 - ESC키
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !bestScorePopup.classList.contains('hidden')) {
    bestScorePopup.classList.add('hidden');
  }
});

/**
 * 트로피 팝업 -> BEST SCORE 목록 보여주기
 */
async function showBestScores() {
  const bestScoreList = getElById('bestScoreList', HTMLUListElement);
  bestScoreList.innerHTML = '';

  const characterImages = [scoreChick1, scoreChick2, scoreChick3, scoreChick4, scoreChick5];

  try {
    // firestore 접근, animal-patrol 값 가진 데이터들 중 상위 5개 가져옴
    const topScores = await getTopScores('animal-patrol');

    topScores.forEach((entry: any, index: number) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <img src="${characterImages[index]}" alt="캐릭터" class="score-character" />
        <span class="score-name">${entry.nickname}</span>
        <span class="score-value">${String(entry.score).padStart(5, '0')}</span>
      `;
      bestScoreList.appendChild(li);
    });
  } catch (err) {
    bestScoreList.innerHTML = '<li>점수 불러오기 실패</li>';
  }
}

/**
 * 인트로 전환, 캐릭터 배치
 */
let score = 0;
let gameActive = false;
let characterX = (920 - 90) / 2;

// 인게임 캐릭터 방향 & 단계 변수
let characterDirection: 'left' | 'right' = 'right';
let evolutionStage: 0 | 1 | 2 | 3 | 4 = 0;

const introScreen = getElById('intro', HTMLElement);
const gameScreen = getElById('game', HTMLElement);
const character = getElById('character', HTMLImageElement);
const startButton = queryEl('.start-text', HTMLDivElement);
const scoreUI = getElById('score', HTMLElement);

// 인게임 BGM
const gameBgm = new Audio('/sounds/animal-bgm.mp3');
gameBgm.loop = true;
gameBgm.volume = 0.1;

// 게임 오버 효과음
const sfxVolume = 0.1;
const gameOverSfx = new Audio('/sounds/animal-gameover.wav');
gameOverSfx.volume = sfxVolume;

// 안전한 DOM 요소 연결 (초기 정의 필수)
const gameGuidePopup = getElById('gameGuidePopup', HTMLDivElement);
const popupMusicIcon = getElById('popupMusicIcon', HTMLImageElement);
const popupMusicOnBtn = getElById('popupMusicOnBtn', HTMLButtonElement);
const popupMusicOffBtn = getElById('popupMusicOffBtn', HTMLButtonElement);

let guideClosed = false;

// START GAME 버튼 클릭 → 인게임 전환 + BGM 재생 + 팝업 표시
startButton.addEventListener('click', () => {
  introScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  // 외부 BGM 정지
  window.parent.postMessage({ type: 'STOP_BGM' }, '*');
  gameBgm.pause();
  gameBgm.currentTime = 0;

  gameBgm.play();

  openGameGuide();
});

// 팝업 열기
function openGameGuide(): void {
  gameGuidePopup.classList.remove('hidden');
  popupMusicIcon.classList.add('spin');
  popupMusicOnBtn.classList.add('on');
  popupMusicOffBtn.classList.remove('off');

  gameBgm.play();
  gameOverSfx.volume = sfxVolume;
}

// 팝업 내 음악 제어
function turnMusicOn(): void {
  popupMusicIcon.classList.add('spin');
  popupMusicOnBtn.classList.add('on');
  popupMusicOffBtn.classList.remove('off');

  gameBgm.play();
  gameOverSfx.volume = sfxVolume;
}

function turnMusicOff(): void {
  popupMusicIcon.classList.remove('spin');
  popupMusicOnBtn.classList.remove('on');
  popupMusicOffBtn.classList.add('off');

  gameBgm.pause();
  gameOverSfx.volume = 0;
}

popupMusicOnBtn.addEventListener('click', turnMusicOn);
popupMusicOffBtn.addEventListener('click', turnMusicOff);

// ESC → 팝업 닫고 게임 시작
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && !gameGuidePopup.classList.contains('hidden') && !guideClosed) {
    guideClosed = true;
    closeGuideAndStartGame();
  }
});

// 팝업 닫기 + 실제 게임 시작
function closeGuideAndStartGame(): void {
  gameGuidePopup.classList.add('hidden');

  gameActive = true;
  score = 0;
  characterX = (920 - 90) / 2;

  character.src = chickIdleFront;
  character.style.left = `${characterX}px`;
  character.style.width = '90px';
  character.style.height = '110px';

  updateScore();
  spawnObstacles();
}

// 이미 출력한 예고 멘트 점수 기록용 Set
const shownWarnings = new Set<number>();
/**
 * 점수를 1초마다 증가시키고 배경 & 진화 멘트 & 단계 업데이트
 */
function updateScore(): void {
  if (!gameActive) return;

  score++;
  scoreUI.textContent = `Score: ${score}`;

  // 진화 예고 멘트 출력
  const warningMessage = evolutionWarnings[score];
  if (warningMessage && !shownWarnings.has(score)) {
    showSpeechBubble(warningMessage);
    shownWarnings.add(score);
    updateSpeechBubblePosition(); // 말풍선 위치

    setTimeout(updateScore, 1000);
    return;
  }

  // 진화 로직은 유지 -> 멘트는 출력x
  const newStage = getEvolutionStage(score);
  if (newStage !== evolutionStage) {
    evolutionStage = newStage;
    updateCharacterImage();
  }

  updateBackgroundByStep(score); // 현재 점수 기반으로 배경 전환
  setTimeout(updateScore, 1000);
}

// 진화 단계 예고 멘트
const evolutionWarnings: Record<number, string> = {
  17: '몸이...뭔가 간질간질해!',
  37: '어어...! 내 안의 솟구치는 힘!',
  62: '모자를 쓰면... 무언가 달라질까?',
  87: '전설의 변신, 지금 시작된다!',
};

// 진화 단계 예고 말풍선
const speechBubble = getElById('speech-bubble', HTMLDivElement);
const bubbleText = queryEl('.bubble-text', HTMLDivElement);

function showSpeechBubble(message: string): void {
  if (!bubbleText) return;

  bubbleText.textContent = message;
  speechBubble.classList.remove('hidden');
  speechBubble.classList.add('show');

  speechBubbleVisible = true;
  animateSpeechBubble(); // 캐릭터 위치 업데이트 시작

  setTimeout(() => {
    speechBubble.classList.remove('show');
    speechBubble.classList.add('hidden');
    speechBubbleVisible = false; // 말풍선 사라지고 위치 업데이트 중단
  }, 2000);
}

/**
 * 말풍선을 캐릭터 위 중앙 정렬 위치로 이동
 */
function updateSpeechBubblePosition(): void {
  const bubbleRect = speechBubble.getBoundingClientRect();

  // 말풍선을 캐릭터 중심 위에 맞춤
  speechBubble.style.left = `${character.offsetLeft + character.offsetWidth / 2 - bubbleRect.width / 2}px`;
  speechBubble.style.top = `${character.offsetTop - bubbleRect.height - 10}px`;
}

let speechBubbleVisible = false;

/**
 * 말풍선이 보이는 동안 캐릭터 따라다니도록 위치 지속 갱신
 */
function animateSpeechBubble(): void {
  if (!speechBubbleVisible) return;

  updateSpeechBubblePosition();
  speechBubbleFrameId = requestAnimationFrame(animateSpeechBubble);
}

/**
 * 진화 단계 계산
 */
function getEvolutionStage(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 65) return 2;
  if (score < 90) return 3;
  return 4;
}

/**
 * 캐릭터 이미지 단계별 업데이트
 */
function updateCharacterImage(): void {
  const stage = getEvolutionStage(score);
  evolutionStage = stage;

  const baseWidth = 90;
  const baseHeight = 110;
  const scaleSize = [1, 1.1, 1.2, 1.25, 1.3];

  const scale = scaleSize[Math.min(stage, scaleSize.length - 1)];
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);

  const characterImagesMap = {
    idle: {
      left: idleLeft,
      right: idleRight,
    },
    evo1: {
      left: evo1Left,
      right: evo1Right,
    },
    evo2: {
      left: evo2Left,
      right: evo2Right,
    },
    evo3: {
      left: evo3Left,
      right: evo3Right,
    },
    evo4: {
      left: evo4Left,
      right: evo4Right,
    },
  };

  const evoKey = stage === 0 ? 'idle' : (`evo${stage}` as keyof typeof characterImagesMap);
  const src = characterImagesMap[evoKey][characterDirection];

  character.src = src;
  character.style.width = `${width}px`;
  character.style.height = `${height}px`;
  character.style.left = `${characterX}px`;
}

/**
 * 방향키로 캐릭터 조작
 */
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!gameActive) return;

  const step = 15;
  const maxLeft = 920 - 90;

  if (e.key === 'ArrowLeft') {
    characterX = Math.max(0, characterX - step);
    characterDirection = 'left';
    updateCharacterImage();
  } else if (e.key === 'ArrowRight') {
    characterX = Math.min(maxLeft, characterX + step);
    characterDirection = 'right';
    updateCharacterImage();
  }

  character.style.left = `${characterX}px`;
});

const obstacleImages = [bananaImg, canImg, fireImg, boom1Img, boom2Img, acornsImg];
let obstacleTimeoutId: number | undefined;
const activeIntervals: number[] = [];
let speechBubbleFrameId: number | undefined;

/**
 * 장애물 랜덤 위치 생성 및 낙하 처리
 */
function spawnObstacles(): void {
  if (!gameActive) return;

  const gridSize = 100; // 장애물은 100px 간격 셀에 위치
  const maxX = 900; // 전체 가로폭 기준
  const cells = Math.floor(maxX / gridSize); // 총 셀 개수: 9

  // 이전 위치와 다르게 랜덤한 셀 인덱스를 지정
  const cellIndex = getRandomCell(cells);
  const posX = cellIndex * gridSize;

  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';

  const randomIndex = Math.floor(Math.random() * obstacleImages.length);
  obstacle.style.backgroundImage = `url('${obstacleImages[randomIndex]}')`;
  obstacle.style.left = `${posX}px`;
  obstacle.style.top = '-60px';

  gameScreen.appendChild(obstacle);

  // 랜덤 딜레이 -> 낙하 시작
  const fallDelay = Math.floor(Math.random() * 300);
  setTimeout(() => {
    fallObstacle(obstacle);
  }, fallDelay);

  // 점수 구간별 생성
  const interval = getSpawnInterval(score);
  obstacleTimeoutId = window.setTimeout(spawnObstacles, interval);
}

/**
 * 현재 점수에 따라 다음 장애물 생성까지의 간격(ms)을 반환
 *
 * @param score 현재 점수
 * @returns 생성 대기 시간 (ms)
 */
function getSpawnInterval(score: number): number {
  if (score < 20) return 800;
  if (score < 40) return 700;
  if (score < 65) return 600;
  if (score < 90) return 550;
  return 450;
}

/**
 * 주어진 장애물을 일정한 속도로 낙하시킴
 *
 * 16ms마다 y좌표 증가
 * 낙하 중 충돌 검사 및 화면 이탈 시 제거
 *
 * @param obstacle 낙하시킬 장애물 요소
 */
function fallObstacle(obstacle: HTMLDivElement): void {
  let y = -60;
  const speed = getObstacleSpeed(score);

  const interval = setInterval(() => {
    if (!gameActive) {
      clearInterval(interval);
      return;
    }

    y += speed;
    obstacle.style.top = `${y}px`;

    if (y > 600) {
      obstacle.remove();
      clearInterval(interval);
    } else if (isColliding(obstacle, character)) {
      clearInterval(interval);
      endGame();
    }
  }, 16); // 약 60fps 주기로 실행
  // activeIntervals.push(interval);
}

/**
 * 현재 점수에 따라 장애물 낙하 속도(px/frame)를 반환
 *
 * @param score 현재 점수
 * @returns 프레임당 이동 픽셀 수
 */
function getObstacleSpeed(score: number): number {
  if (score < 20) return 4;
  if (score < 40) return 5;
  if (score < 65) return 6;
  if (score < 90) return 7;
  return 8;
}

let cellOrder: number[] = [];
let cellIndexNow = 0;

/**
 * 한 바퀴 셀 다 돌기 전까지는 중복 없이 셀 인덱스를 순환
 */
function getRandomCell(cells: number): number {
  if (cellOrder.length !== cells || cellIndexNow >= cellOrder.length) {
    cellOrder = [...Array(cells).keys()];
    for (let i = cellOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellOrder[i], cellOrder[j]] = [cellOrder[j], cellOrder[i]];
    }
    cellIndexNow = 0;
  }

  const result = cellOrder[cellIndexNow];
  cellIndexNow++;
  return result;
}

/**
 * 두 Html 요소의 위치 정보를 기반으로 충돌 여부를 판단
 *
 * @param a 첫 번째 요소
 * @param b 두 번째 요소
 * @returns 충돌 여부 (boolean)
 */
function isColliding(a: HTMLElement, b: HTMLElement): boolean {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top;
}

const gameOverPopup = getElById('game-over-popup', HTMLDivElement);
const finalScore = getElById('finalScore', HTMLElement);

/**
 * 충돌 시 게임을 종료 -> GAME OVER 팝업, 쓰러진 캐릭터로 교체
 */
function endGame(): void {
  gameActive = false;
  finalScore.textContent = `${score}`;
  gameOverPopup.classList.remove('hidden');

  // 정지
  gameBgm.pause();
  gameBgm.currentTime = 0;
  // GAME OVER 효과음
  gameOverSfx.currentTime = 0;
  gameOverSfx.play();

  character.src = chickFallen;
  character.style.width = '120px';
  character.style.height = '80px';
}

// GAME OVER 팝업 -> RETRY 버튼 클릭 시 인트로로 복귀
const retryButton = getElById('retryButton', HTMLButtonElement);
retryButton.addEventListener('click', resetGame);

const saveScoreButton = getElById('saveScoreButton', HTMLButtonElement);
const overlay = getElById('overlay', HTMLDivElement);
const saveScorePopup = getElById('save-score-popup', HTMLDivElement);
const playerNameInput = getElById('playerName', HTMLInputElement);
const saveNameButton = getElById('saveNameButton', HTMLButtonElement);
const toast = getElById('toast', HTMLDivElement);

/**
 * SAVE SCORE 버튼 클릭 시 저장 가능한 팝업을 표시
 */
saveScoreButton.addEventListener('click', (): void => {
  overlay.classList.add('show');
  saveScorePopup.classList.remove('hidden');
  playerNameInput.value = '';
  playerNameInput.focus();
});

/**
 * SAVE 버튼 클릭 시 이름 정상 입력 확인 및 저장
 */
saveNameButton.addEventListener('click', async () => {
  const rawInput = playerNameInput.value.trim();

  if (rawInput.length === 0) {
    alert('이름을 입력해주세요.');
    return;
  }

  if (!validateName(rawInput)) {
    alert('이름은 완성된 한글 또는 영어로 1~3자만 입력할 수 있어요!');
    return;
  }

  const cleanName = rawInput.replace(/[^가-힣a-zA-Z]/g, '').toUpperCase();

  try {
    await fireScore(cleanName, score, 'animal-patrol'); // Firestore에 저장, 해당 파라미터로
    saveScorePopup.classList.add('hidden');
    overlay.classList.remove('show');
    showToast('기록이 저장되었습니다!');
  } catch (err) {
    showToast(`이미 존재하는 닉네임입니다.`, false);
    playerNameInput.focus();
  }
});

/**
 * 입력된 이름이 유효한지 검사
 */
function validateName(name: string): boolean {
  return /^[가-힣]{1,3}$|^[a-zA-Z]{1,3}$/.test(name);
}

/**
 * CANCEL 버튼 -> 점수 저장 팝업 닫기 후 게임 초기화
 */
const cancelSaveButton = getElById('cancelSaveButton', HTMLButtonElement);
cancelSaveButton.addEventListener('click', () => {
  overlay.classList.remove('show');
  saveScorePopup.classList.add('hidden');
  resetGame();
});

/**
 * 토스트 메시지를 표시한 후, 1.5초 후 숨깁
 * @param message 표시할 메시지
 * @param shouldReset - 메시지 표시 후 게임 초기화를 실행할지 여부 (기본값: true)
 */
function showToast(message: string, shouldReset: boolean = true): void {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');

    // 닉네임 저장 성공 시 초기화 하도록 설정
    if (shouldReset) resetGame();
  }, 1500);
}

/**
 * 게임 전체를 초기화하고 인트로 화면으로 복귀
 */
function resetGame(): void {
  score = 0;
  characterX = (920 - 90) / 2;
  gameActive = false;
  shownWarnings.clear(); // set 초기화 필요 (멘트 띄우기)

  // spawnObstacles setTimeout 중단
  if (obstacleTimeoutId !== undefined) {
    clearTimeout(obstacleTimeoutId);
    obstacleTimeoutId = undefined;
  }

  // 장애물 낙하 setInterval 중단
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals.length = 0; // 배열 초기화

  // 말풍선 애니메이션 중단
  if (speechBubbleFrameId !== undefined) {
    cancelAnimationFrame(speechBubbleFrameId);
    speechBubbleFrameId = undefined;
  }

  gameScreen.classList.add('hidden');
  introScreen.classList.remove('hidden');
  gameOverPopup.classList.add('hidden');
  saveScorePopup.classList.add('hidden');
  bestScorePopup.classList.add('hidden');
  overlay.classList.remove('show');

  // 캐릭터 상태 초기화 (정면 대기 상태 이미지로 복원)
  character.src = chickIdleFront;
  character.style.left = `${characterX}px`;
  character.style.width = '90px';
  character.style.height = '110px';

  // 방향, 진화 단계 초기화
  characterDirection = 'right';
  evolutionStage = 0;

  // 점수 UI 초기화
  scoreUI.textContent = 'Score: 0';

  // 장애물 제거
  const allObstacles = document.querySelectorAll('.obstacle');
  allObstacles.forEach(obstacle => obstacle.remove());

  // 배경 상태 초기화
  gradientIndex = 0;
  isBg1Visible = true;

  bg1.style.background = gradients[0];
  bg1.classList.add('visible');
  bg1.classList.remove('hidden');

  bg2.classList.add('hidden');
  bg2.classList.remove('visible');
  bg2.style.background = '';

  // 별 & 구름 초기화
  starContainer.style.display = 'none';
  starContainer.style.opacity = '0';
  clouds.forEach(cloud => {
    if (cloud instanceof HTMLElement) {
      cloud.style.opacity = '1';
    }
  });

  // 인게임 BGM 정지 -> 메인 BGM 재생 요청
  window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');

  // Game guide 팝업 ESC키 초기화
  guideClosed = false;
}
