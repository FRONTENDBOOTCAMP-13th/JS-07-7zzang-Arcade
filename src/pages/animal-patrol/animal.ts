import '../../style.css';
import './animal.css';

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

/**
 * 수정이 필요한 부분!!! ======== 단계 정하지 못함(임시)
 * 점수 또는 단계에 따라 배경 전환
 * @param step 현재 배경 단계 (0~5)
 */
function updateBackgroundByStep(step: number): void {
  const newIndex = step % gradients.length;
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

// 초기화 실행
initBackground();

// 테스트용: 일정 시간마다 배경 단계 전환
let step = 1;
setInterval(() => {
  updateBackgroundByStep(step++);
}, 4000);

/**
 * 인트로 전환, 캐릭터 배치
 */
let score = 0;
let gameActive = false;
let characterX = (920 - 90) / 2;

const introScreen = document.getElementById('intro')!;
const gameScreen = document.getElementById('game')!;
const character = document.getElementById('character') as HTMLImageElement;
const startButton = document.querySelector('.start-text') as HTMLDivElement;
const scoreUI = document.getElementById('score')!;

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

  character.style.left = `${characterX}px`;
  character.style.width = '90px';
  character.style.height = '110px';

  scoreUI.textContent = 'Score: 0';
});

/**
 * 방향키로 캐릭터 조작
 */
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!gameActive) return;

  const step = 20;
  const maxLeft = 920 - 90;

  if (e.key === 'ArrowLeft') {
    characterX = Math.max(0, characterX - step); // 왼쪽 이동, 경계 밖 못 나가게 제한
  } else if (e.key === 'ArrowRight') {
    characterX = Math.min(maxLeft, characterX + step); // 오른쪽 이동, 경계 밖 제한
  }

  character.style.left = `${characterX}px`;
});

const trophyButton = document.querySelector('.trophy-button') as HTMLImageElement;
const bestScorePopup = document.getElementById('bestScorePopup') as HTMLDivElement;

/**
 * 트로피 버튼 -> BEST SCORE 팝업
 */
trophyButton.addEventListener('click', () => {
  bestScorePopup.classList.remove('hidden');
});

/**
 * 팝업 외부 클릭 시 BEST SCORE 팝업 닫기
 */
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as Node;
  if (!bestScorePopup.contains(target) && !trophyButton.contains(target)) {
    bestScorePopup.classList.add('hidden');
  }
});

/**
 * 팝업 닫기 - ESC키
 */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !bestScorePopup.classList.contains('hidden')) {
    bestScorePopup.classList.add('hidden');
  }
});
