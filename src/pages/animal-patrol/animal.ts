import '../../style.css';
import './animal.css';

const localKey = 'animal-bestScores';

interface ScoreEntry {
  name: string;
  score: number;
}

/**
 * 배경 관련 요소 및 상태 초기화
 */
const bg1 = document.getElementById('bg1') as HTMLElement;
const bg2 = document.getElementById('bg2') as HTMLElement;
const starContainer = document.getElementById('star-container') as HTMLElement;
const clouds = document.querySelectorAll('.cloud') as NodeListOf<HTMLElement>;

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

  clouds.forEach((cloud: HTMLElement) => {
    cloud.style.opacity = isNight ? '0.6' : '1';
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
const trophyButton = document.querySelector('.trophy-button') as HTMLImageElement;
const bestScorePopup = document.getElementById('bestScorePopup') as HTMLDivElement;

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
function showBestScores() {
  const bestScoreList = document.getElementById('bestScoreList') as HTMLUListElement;
  bestScoreList.innerHTML = '';

  const latestScores: ScoreEntry[] = JSON.parse(localStorage.getItem(localKey) || '[]');
  const characterImages = ['/src/assets/images/animal-img/score-chick1.png', '/src/assets/images/animal-img/score-chick2.png', '/src/assets/images/animal-img/score-chick3.png', '/src/assets/images/animal-img/score-chick4.png', '/src/assets/images/animal-img/score-chick5.png'];

  latestScores.slice(0, 5).forEach((entry, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${characterImages[index]}" alt="캐릭터" class="score-character" />
      <span class="score-name">${entry.name}</span>
      <span class="score-value">${String(entry.score).padStart(5, '0')}</span>
    `;

    bestScoreList.appendChild(li);
  });
}

/**
 * 인트로 전환, 캐릭터 배치
 */
let score = 0;
let gameActive = false;
let characterX = (920 - 90) / 2;

// 인게임 캐릭터 방향 & 단계 변수
let characterDirection: 'left' | 'right' = 'right';
let evolutionStage: 0 | 1 | 2 | 3 | 4 = 0; // 단계별 효과 추가할 때 사용할거니까 경고 무시

const introScreen = document.getElementById('intro') as HTMLElement;
const gameScreen = document.getElementById('game') as HTMLElement;
const character = document.getElementById('character') as HTMLImageElement;
const startButton = document.querySelector('.start-text') as HTMLDivElement;
const scoreUI = document.getElementById('score') as HTMLElement;

/**
 * START 버튼 클릭 -> 인트로에서 게임 화면으로 전환
 * 캐릭터 위치와 상태를 초기화
 */
startButton.addEventListener('click', () => {
  introScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  gameActive = true;
  score = 0;
  characterX = (920 - 90) / 2;

  character.src = '/src/assets/images/animal-img/chick-idle-front.png'; // 정면
  character.style.left = `${characterX}px`;
  character.style.width = '90px';
  character.style.height = '110px';

  updateScore();
  spawnObstacles();
});

/**
 * 점수를 1초마다 증가시키고 배경을 점수에 맞게 업데이트
 */
function updateScore(): void {
  if (!gameActive) return;

  score++;
  scoreUI.textContent = `Score: ${score}`;
  updateBackgroundByStep(score); // 현재 점수 기반으로 배경 전환
  setTimeout(updateScore, 1000);
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
  evolutionStage = stage; // 현재 진화 단계 저장

  const baseWidth = 90;
  const baseHeight = 110;
  const scaleSize = [1, 1.1, 1.2, 1.25, 1.3];

  const scale = scaleSize[Math.min(stage, scaleSize.length - 1)];
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);

  let src = '';
  if (stage === 0) {
    src = `/src/assets/images/animal-img/chick-idle-${characterDirection}.png`;
  } else {
    src = `/src/assets/images/animal-img/chick-evo${stage}-${characterDirection}.png`;
  }

  character.src = src;
  character.style.width = `${width}px`;
  character.style.height = `${height}px`;
  character.style.left = `${(920 - width) / 2}px`;
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

const obstacleImages = ['/src/assets/images/animal-img/banana.png', '/src/assets/images/animal-img/can.png', '/src/assets/images/animal-img/fire.png', '/src/assets/images/animal-img/boom1.png', '/src/assets/images/animal-img/boom2.png', '/src/assets/images/animal-img/acorns.png'];

let lastCellIndex = -1; // 연속된 위치 중복 방지용

/**
 * 장애물 랜덤 위치 생성 및 낙하 처리
 */
function spawnObstacles(): void {
  if (!gameActive) return;

  const gridSize = 100; // 장애물은 100px 간격 셀에 위치
  const maxX = 900; // 전체 가로폭 기준
  const cells = Math.floor(maxX / gridSize); // 총 셀 개수: 9

  // 이전 위치와 다르게 랜덤한 셀 인덱스를 정함
  let cellIndex: number;
  do {
    cellIndex = Math.floor(Math.random() * cells);
  } while (cellIndex === lastCellIndex);
  lastCellIndex = cellIndex;

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
  setTimeout(spawnObstacles, interval);
}

/**
 * 현재 점수에 따라 다음 장애물 생성까지의 간격(ms)을 반환
 *
 * @param score 현재 점수
 * @returns 생성 대기 시간 (ms)
 */
function getSpawnInterval(score: number): number {
  if (score < 20) return 850;
  if (score < 40) return 750;
  if (score < 65) return 650;
  if (score < 90) return 500;
  return 400;
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
}

/**
 * 현재 점수에 따라 장애물 낙하 속도(px/frame)를 반환
 *
 * @param score 현재 점수
 * @returns 프레임당 이동 픽셀 수
 */
function getObstacleSpeed(score: number): number {
  if (score < 20) return 5;
  if (score < 40) return 6;
  if (score < 65) return 7;
  if (score < 90) return 8;
  return 9;
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

const gameOverPopup = document.getElementById('game-over-popup') as HTMLDivElement;
const finalScore = document.getElementById('finalScore') as HTMLElement;

/**
 * 충돌 시 게임을 종료 -> GAME OVER 팝업, 쓰러진 캐릭터로 교체
 */
function endGame(): void {
  gameActive = false;
  finalScore.textContent = `${score}`;
  gameOverPopup.classList.remove('hidden');

  character.src = '/src/assets/images/animal-img/chick-fallen.png';
  character.style.width = '120px';
  character.style.height = '80px';
}

// GAME OVER 팝업 -> RETRY 버튼 클릭 시 인트로로 복귀
const retryButton = document.getElementById('retryButton') as HTMLButtonElement;
retryButton.addEventListener('click', resetGame);

const saveScoreButton = document.getElementById('saveScoreButton') as HTMLButtonElement;
const overlay = document.getElementById('overlay') as HTMLDivElement;
const saveScorePopup = document.getElementById('save-score-popup') as HTMLInputElement;
const playerNameInput = document.getElementById('playerName') as HTMLInputElement;
const saveNameButton = document.getElementById('saveNameButton') as HTMLDivElement;
const toast = document.getElementById('toast') as HTMLDivElement;

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
saveNameButton.addEventListener('click', () => {
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
  const newEntry = { name: cleanName, score };
  const stored = localStorage.getItem(localKey);
  const bestScores = stored ? (JSON.parse(stored) as ScoreEntry[]) : [];

  // 새 항목 추가 후 점수 기준 정렬
  bestScores.unshift(newEntry);
  bestScores.sort((a, b) => b.score - a.score);
  bestScores.splice(5);

  localStorage.setItem(localKey, JSON.stringify(bestScores));

  saveScorePopup.classList.add('hidden');
  overlay.classList.remove('show');
  showToast('기록이 저장되었습니다!');
});

/**
 * 입력된 이름이 유효한지 검사
 */
function validateName(name: string): boolean {
  return /^[가-힣]{1,3}$|^[a-zA-Z]{1,3}$/.test(name);
}

/**
 * CANCEL 버튼 -> 점수 저장 취소 후 게임 초기화
 */
const cancelSaveButton = document.getElementById('cancelSaveButton') as HTMLButtonElement;
cancelSaveButton.addEventListener('click', () => {
  overlay.classList.remove('show');
  saveScorePopup.classList.add('hidden');
  resetGame();
});

/**
 * 하단에 짧게 메시지를 보여준 후 게임을 초기화
 */
function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
    resetGame(); // 인트로 화면으로 초기화
  }, 1000);
}

/**
 * 게임 전체를 초기화하고 인트로 화면으로 복귀
 */
function resetGame(): void {
  score = 0;
  characterX = (920 - 90) / 2;
  gameActive = false;

  gameScreen.classList.add('hidden');
  introScreen.classList.remove('hidden');
  gameOverPopup.classList.add('hidden');
  saveScorePopup.classList.add('hidden');
  bestScorePopup.classList.add('hidden');
  overlay.classList.remove('show');

  // 캐릭터 상태 초기화 (정면 대기 상태 이미지로 복원)
  character.src = '/src/assets/images/animal-img/chick-idle-front.png';
  character.style.left = `${characterX}px`;
  character.style.width = '90px';
  character.style.height = '110px';

  // 방향, 진화 단계 초기화
  characterDirection = 'right';
  evolutionStage = 0;
  character.src = '/src/assets/images/animal-img/chick-idle-front.png';

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
    cloud.style.opacity = '1';
  });
}
