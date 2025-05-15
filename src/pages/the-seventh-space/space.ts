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
  isAlive: boolean;
  shoot(): void;
  updateBullets(): void;
  explode(): void;
  respawn(): void;
}

interface IEnemy extends IGameObject {
  sprite: HTMLImageElement;
  speedX: number;
  descentY: number;
  direction: 1 | -1;
  moveX(): void;
  explode(): void;
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

// ─── 폭발 이펙트용 인터페이스 ────────────────────────────────────
interface IExplosion {
  x: number;
  y: number;
  sprite: HTMLImageElement;
  startTime: number;
  duration: number;
  done: boolean;
  size: number;
  update(): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

// ─── 전역 상태 ───────────────────────────────────────────────────
const Explosions: IExplosion[] = [];

// ─── 플레이어 정의 ───────────────────────────────────────────────
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 2.5,
  isAlive: true,
  sprite: new Image(),
  bullets: [],

  update() {
    if (!this.isAlive) return;
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
    if (keys.ArrowRight && this.x + this.width < canvas.width) this.x += this.speed;
    this.updateBullets();
  },

  draw(ctx) {
    if (this.isAlive) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
    this.bullets.forEach(b => b.draw(ctx));
  },

  shoot() {
    const bx = this.x + this.width / 2 - 10;
    const by = this.y;
    this.bullets.push({
      x: bx,
      y: by,
      width: 20,
      height: 20,
      speedY: 2.5,
      sprite: bulletImg,
      hitboxWidth: 2,
      hitboxHeight: 2,
      hitboxOffsetX: 9,
      hitboxOffsetY: 9,
      update() {
        this.y -= this.speedY;
      },
      draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
      },
    });
  },

  explode() {
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, explosionPlayer, 2000, 48);
    this.isAlive = false; // 즉시 “사망” 처리
    setTimeout(() => this.respawn(), 3000); // 1초 후 재생성
  },

  respawn() {
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 20;
    this.isAlive = true;
  },

  updateBullets() {
    this.bullets.forEach(b => b.update());
  },
};

// ─── 적 매니저 정의 ─────────────────────────────────────────────
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
          explode() {
            spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, explosionEnemy, 300, 80);
          },
        });
      }
    }
  },

  updateAll() {
    // 히트영역 아님! 벽 히트 영역임 -> 좌우 중 맨 왼쪽, 맨 오른쪽 열이 닿았을 때를 판정
    // + 예상을 해야함 벽에 히트 예정인지를 계산해야함 따라서 벽 위치와 적 배열의 위치가 같이지는 지점을 예상
    // 같아지는 영역은 둘 사이의 거리가 0 이되는 부분이니 닿을지 계산
    // .some()으로 적 한마리라도 조건에 맞으면 willHit = true 반환
    if (!this.enemies.length) return;
    const willHit = this.enemies.some(e => e.x + e.speedX * e.direction <= 0 || e.x + e.speedX * e.direction + e.width >= canvas.width);
    if (willHit) {
      this.enemies.forEach(e => {
        e.direction = -e.direction as 1 | -1;
        e.y += e.descentY;
      });
    }
    this.enemies.forEach(e => e.moveX());
  },

  drawAll(ctx: CanvasRenderingContext2D) {
    this.enemies.forEach(e => e.draw(ctx));
  },
};

// ─── 폭발 이펙트 생성 ─────────────────────────────────────────────
function spawnExplosion(x: number, y: number, sprite: HTMLImageElement, duration: number, size: number) {
  const now = Date.now();
  Explosions.push({
    x,
    y,
    sprite,
    startTime: now,
    duration,
    size,
    done: false,
    update() {
      if (Date.now() - this.startTime > this.duration) this.done = true;
    },
    draw(ctx) {
      ctx.drawImage(this.sprite, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    },
  });
}

// ─── 충돌 처리(gpt code) ───────────────────────────────────────────────────
function handleCollisions() {
  // 총알↔적
  EnemyManager.enemies.forEach(enemy => {
    Player.bullets.forEach(bullet => {
      const bPoly = new SAT.Box(new SAT.Vector(bullet.x, bullet.y), bullet.width, bullet.height).toPolygon();
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();
      if (SAT.testPolygonPolygon(bPoly, ePoly)) {
        enemy.explode();
        enemyHit.add(enemy);
        bulletHit.add(bullet);
      }
    });
  });

  // 플레이어↔적
  if (!playerDead) {
    const pPoly = new SAT.Box(new SAT.Vector(Player.x, Player.y), Player.width, Player.height).toPolygon();
    EnemyManager.enemies.forEach(enemy => {
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();
      if (SAT.testPolygonPolygon(pPoly, ePoly)) {
        Player.explode();
        playerDead = true;
      }
    });
  }

  // 필터링
  EnemyManager.enemies = EnemyManager.enemies.filter(e => !enemyHit.has(e));
  Player.bullets = Player.bullets.filter(b => !bulletHit.has(b));
}

// ─── 애셋 로딩 & 키 바인딩 ────────────────────────────────────────
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
const explosionPlayer = new Image();
explosionPlayer.src = '../../assets/images/space-img/explosion-player.png';
const explosionEnemy = new Image();
explosionEnemy.src = '../../assets/images/space-img/explosion-enemy.png';

// 키버튼
const keys = { ArrowLeft: false, ArrowRight: false };
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  if (e.code === 'Space') Player.shoot();
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
});

// ─── 초기화 & 게임 루프 ───────────────────────────────────────────
let loaded = 0,
  playerDead = false;
const assets = [playerImg, bulletImg, backgroundImg, explosionPlayer, explosionEnemy];
assets.forEach(
  img =>
    (img.onload = () => {
      if (++loaded === assets.length) init();
    }),
);

function init() {
  Player.x = (canvas.width - Player.width) / 2;
  Player.y = canvas.height - Player.height - 20;
  EnemyManager.spawn(EnemyManager.configs[1]);
  requestAnimationFrame(gameLoop);
}

const enemyHit = new Set<IEnemy>();
const bulletHit = new Set<IBullet>();

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  Player.update();
  EnemyManager.updateAll();

  handleCollisions();

  // 폭발 업데이트·렌더
  Explosions.forEach(ex => {
    ex.update();
    ex.draw(ctx);
  });
  for (let i = Explosions.length - 1; i >= 0; i--) {
    if (Explosions[i].done) Explosions.splice(i, 1);
  }

  // ─── 렌더링 ─────────────────────────────────────────────────────
  Player.draw(ctx);
  EnemyManager.drawAll(ctx);

  // ─── 라운드 전환 ─────────────────────────────────────────────────
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
