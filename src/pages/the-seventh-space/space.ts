import '../../style.css';
import './space.css';

// ─── 1. 인터페이스 정의 ────────────────────────────────────────
interface IGameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  update(): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

interface IPlayer extends IGameObject {
  speed: number;
  sprite: HTMLImageElement;
}

// ─── 2. 에셋 로딩 ───────────────────────────────────────────────
const playerImg = new Image();
playerImg.src = '../../assets/images/space-img/player.png';

const backgroundImg = new Image();
backgroundImg.src = '../../assets/images/space-img/background.png';

let assetsLoaded = 0;
const totalAssets = 2;
[playerImg, backgroundImg].forEach(img => {
  img.onload = () => {
    if (++assetsLoaded === totalAssets) init();
  };
});

// ─── 3. 플레이어 객체 ───────────────────────────────────────────
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 4,
  sprite: playerImg,

  update() {
    if (keys.ArrowLeft && this.x > 0) {
      this.x -= this.speed;
    }
    if (keys.ArrowRight && this.x + this.width < canvas.width) {
      this.x += this.speed;
    }
  },

  draw(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  },
};

// ─── 4. 입력 처리 ───────────────────────────────────────────────
const keys: Record<'ArrowLeft' | 'ArrowRight', boolean> = {
  ArrowLeft: false,
  ArrowRight: false,
};

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = true;
  }
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = false;
  }
});

// ─── 5. 캔버스 & 게임 루프 ─────────────────────────────────────
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function gameLoop() {
  // 배경 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  // 플레이어 업데이트 & 렌더링
  Player.update();
  Player.draw(ctx);

  requestAnimationFrame(gameLoop);
}

// ─── 6. 초기화 ──────────────────────────────────────────────────
function init() {
  // 플레이어 시작 위치 설정
  Player.x = (canvas.width - Player.width) / 2;
  Player.y = canvas.height - Player.height - 20;

  // 게임 루프 시작
  gameLoop();
}
