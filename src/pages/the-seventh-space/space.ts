import '../../style.css';
import './space.css';
import * as SAT from 'sat';

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
  bullets: IBullet[];
  shoot(): void;
  updateBullets(): void;
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

interface IBullet extends IGameObject {
  speedY: number;
  sprite: HTMLImageElement;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
}

// ─── 객체 정의 ────────────────────────────────────────────────────
// 1) 플레이어
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 2.5,
  sprite: new Image(),
  bullets: [],

  update() {
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
    if (keys.ArrowRight && this.x + this.width < canvas.width) this.x += this.speed;

    this.updateBullets();
  },
  draw(ctx) {
    // ──Player 그리기 ─────────────────────────────────────────────────
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

    // ──Bullet 그리기 ─────────────────────────────────────────────────
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }
  },

  shoot() {
    // 1. 총알 좌표 잡기
    // x 좌표는 플레이어의 딱 중간 위치 따라서 width / 2 절반
    // y 좌표는 플레이어의 머리 위치 y
    const bulletX = this.x + this.width / 2 - 5;
    const bulletY = this.y;

    // 2. 총알 생성하기 x좌표, y좌표, 넓이, 높이, 스피드, 이미지, update, draw
    this.bullets.push({
      x: bulletX,
      y: bulletY,
      width: 20,
      height: 20,
      speedY: 2.5,
      sprite: bulletImg,

      // 히트박스 지정
      hitboxWidth: 2, // 실제 충돌로 감지할 폭
      hitboxHeight: 2, // 실제 충돌로 감지할 높이
      hitboxOffsetX: 10,
      hitboxOffsetY: 10,

      // update 함수에는 총알이 이동하는 모습을 구현
      update() {
        // 현재 y 위치에서 스피드 만큼 빼서 위로 올라가도록 구현
        this.y = this.y - this.speedY;
      },
      draw() {
        // ctx.drawImage(이미지, x, y, width, height);
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
      },
    });
  },

  updateBullets() {
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update();
    }
  },
};

// 2) 적
const EnemyManager = {
  round: 1,
  enemies: [] as IEnemy[],
  configs: {
    1: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy1.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    2: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy2.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    3: { rows: 3, cols: 6, spriteSrc: '../../assets/images/space-img/enemy3.png', paddingX: 50, paddingY: 40, offsetX: 0, offsetY: 0, descentY: 50 },
  } as Record<number, IEnemyConfig>,

  spawn(cfg: IEnemyConfig) {
    this.enemies = [];
    const img = new Image();
    img.src = cfg.spriteSrc;

    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        this.enemies.push({
          x: cfg.offsetX + c * (cfg.paddingX + 40),
          y: cfg.offsetY + r * (cfg.paddingY + 30),
          width: 80,
          height: 80,
          sprite: img,
          speedX: 2,
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
// 플레이어 이미지 생성
const playerImg = new Image();
playerImg.src = '../../assets/images/space-img/player.png';
Player.sprite = playerImg;

// 총알 이미지 생성
const bulletImg = new Image();
bulletImg.src = '../../assets/images/space-img/player-bullet.png';

// 배경 이미지 생성
const backgroundImg = new Image();
backgroundImg.src = '../../assets/images/space-img/background.png';

// 폭발 이미지 생성
const explosionImg = new Image();
explosionImg.src = '../../assets/images/space-img/explosion.png';

// 키버튼
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  if (e.code === 'Space') {
    Player.shoot();
  }
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
});

let loaded = 0;
const assets = [playerImg, backgroundImg, bulletImg, explosionImg];
assets.forEach(img => {
  img.onload = () => {
    if (++loaded === assets.length) init();
  };
});

// ─── 총알 대 적 전용 충돌 체크 ────────────────────────────────────
function isBulletColliding(b: IBullet, e: IEnemy): boolean {
  // 1) Bullet 히트박스 → SAT.Box → toPolygon()
  const bulletPoly = new SAT.Box(new SAT.Vector(b.x + b.hitboxOffsetX, b.y + b.hitboxOffsetY), b.hitboxWidth, b.hitboxHeight).toPolygon();

  // 2) Enemy 전체 박스 → SAT.Box → toPolygon()
  const enemyPoly = new SAT.Box(new SAT.Vector(e.x, e.y), e.width, e.height).toPolygon();

  // 3) 충돌 검사
  return SAT.testPolygonPolygon(bulletPoly, enemyPoly);
}

// ─── 초기화 & 루프 ───────────────────────────────────────────────
function init() {
  Player.x = (canvas.width - Player.width) / 2;
  Player.y = canvas.height - Player.height - 20;
  EnemyManager.spawn(EnemyManager.configs[EnemyManager.round]);
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  //  ───배경 그리기 ───────────────────────────────────────────────────
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  //  ───업데이트 ───────────────────────────────────────────────────────
  Player.update();
  EnemyManager.updateAll();

  // ───충돌 처리 <gpt code> (적·총알 모두 제거) ─────────────────────────
  // 원본 적 배열 복사
  const originalEnemies = EnemyManager.enemies.slice();

  // 적들 중, 어떤 총알에도 맞지 않은 적만 남김
  EnemyManager.enemies = originalEnemies.filter(enemy => !Player.bullets.some(bullet => isBulletColliding(bullet, enemy)));

  // 복사한 원본 적 배열을 기준으로 총알 걸러내기
  Player.bullets = Player.bullets.filter(bullet => !originalEnemies.some(enemy => isBulletColliding(bullet, enemy)));

  // ───렌더링 ─────────────────────────────────────────────────────────
  Player.draw(ctx);
  EnemyManager.drawAll(ctx);

  // ───라운드 전환 ─────────────────────────────────────────────────────
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
