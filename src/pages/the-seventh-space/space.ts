import '../../style.css';
import './space.css';

// ─── 캔버스 & 컨텍스트 ─────────────────────────────────────────
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// ─── 인터페이스 정의 ────────────────────────────────────────────
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

interface IEnemy extends IGameObject {
  sprite: HTMLImageElement;
  speedX: number;
  descentY: number;
  direction: 1 | -1;
  moveX(): void;
}

interface IEnemyConfig {
  rows: number;
  cols: number;
  spriteSrc: string;
  paddingX: number;
  paddingY: number;
  offsetX: number;
  offsetY: number;
  descentY: number;
}

// ─── 객체 정의 ────────────────────────────────────────────────────
// 1) 플레이어
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 4,
  sprite: new Image(),

  update() {
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
    if (keys.ArrowRight && this.x + this.width < canvas.width) this.x += this.speed;
  },
  draw(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  },
};

// 2) 적
const EnemyManager = {
  round: 1,
  enemies: [] as IEnemy[],
  configs: {
    1: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy1.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    2: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy2.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    3: { rows: 3, cols: 6, spriteSrc: '../../assets/images/space-img/enemy3.png', paddingX: 50, paddingY: 40, offsetX: 0, offsetY: 0, descentY: 60 },
  } as Record<number, IEnemyConfig>,

  spawn(cfg: IEnemyConfig) {
    this.enemies = [];
    const img = new Image();
    img.src = cfg.spriteSrc;

    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        this.enemies.push({
          x: cfg.offsetX + c * (cfg.paddingX + 30),
          y: cfg.offsetY + r * (cfg.paddingY + 20),
          width: 80,
          height: 80,
          sprite: img,
          speedX: 1,
          descentY: cfg.descentY,
          direction: 1,

          update() {
            // 비워둔 이유는 update() 내에서는 this.enemies 사용이 불가 난 사용해야해..
          },
          moveX() {
            this.x += this.speedX * this.direction;
          },
          draw(ctx) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
          },
        });
      }
    }
  },

  updateAll() {
    // 적이 없으면 패스
    if (!this.enemies.length) return;

    // 히트영역 아님! 벽 히트 영역임 -> 좌우 중 맨 왼쪽, 맨 오른쪽 열이 닿았을 때를 판정
    // + 예상을 해야함 벽에 히트 예정인지를 계산해야함 따라서 벽 위치와 적 배열의 위치가 같이지는 지점을 예상
    // 같아지는 영역은 둘 사이의 거리가 0 이되는 부분이니 닿을지 계산
    // .some()으로 적 한마리라도 조건에 맞으면 willHit = true 반환
    const willHit = this.enemies.some(e => e.x + e.speedX * e.direction <= 0 || e.x + e.speedX * e.direction + e.width >= canvas.width);

    // 벽 히트 시, 1. 방향전환 2. 한칸 아래로 이동
    if (willHit) {
      this.enemies.forEach(e => {
        e.direction = e.direction === 1 ? -1 : 1;
        e.y += e.descentY;
      });
    }
    this.enemies.forEach(e => e.moveX());
  },

  drawAll(ctx: CanvasRenderingContext2D) {
    this.enemies.forEach(e => e.draw(ctx));
  },
};

// ─── 에셋 로딩 & 키 바인딩 ──────────────────────────────────────
const playerImg = new Image();
playerImg.src = '../../assets/images/space-img/player.png';
Player.sprite = playerImg;

const backgroundImg = new Image();
backgroundImg.src = '../../assets/images/space-img/background.png';

const keys: Record<'ArrowLeft' | 'ArrowRight', boolean> = { ArrowLeft: false, ArrowRight: false };
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
});

let loaded = 0;
[playerImg, backgroundImg].forEach(img => {
  img.onload = () => {
    if (++loaded === 2) init();
  };
});

// ─── 초기화 & 루프 ───────────────────────────────────────────────
function init() {
  Player.x = (canvas.width - Player.width) / 2;
  Player.y = canvas.height - Player.height - 20;
  EnemyManager.spawn(EnemyManager.configs[EnemyManager.round]);
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  Player.update();
  Player.draw(ctx);
  EnemyManager.updateAll();
  EnemyManager.drawAll(ctx);

  // 라운드 전환
  if (EnemyManager.enemies.length === 0) {
    const next = ++EnemyManager.round;
    if (EnemyManager.configs[next]) {
      EnemyManager.spawn(EnemyManager.configs[next]);
    } else {
      console.log('게임 클리어!');
    }
  }
  requestAnimationFrame(gameLoop);
}
