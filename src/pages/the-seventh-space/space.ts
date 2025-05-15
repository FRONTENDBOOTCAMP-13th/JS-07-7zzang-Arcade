import '../../style.css';
import './space.css';
import * as SAT from 'sat';

// ─── 캔버스 & 컨텍스트 ──────────────────────────────────────────
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
// ─── 캔버스 & 컨텍스트 ──────────────────────────────────────────

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

interface IBullet extends IGameObject {
  speedY: number;
  sprite: HTMLImageElement;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
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

interface BulletOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  sprite: HTMLImageElement;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
}
// ─── 인터페이스 정의 ────────────────────────────────────────────

// ─── 전역 상태 ──────────────────────────────────────────────────
const enemyBullets: IBullet[] = [];
const Explosions: IExplosion[] = [];

// ─── 플레이어 정의 ──────────────────────────────────────────────
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 2.5,
  isAlive: true,
  sprite: new Image(),
  bullets: [],

  // ── 화면 업데이트 ──────────────────────────────────────────────
  update() {
    if (!this.isAlive) return;
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
    if (keys.ArrowRight && this.x + this.width < canvas.width) this.x += this.speed;
    this.updateBullets();
  },

  // ── 화면 그리기 ────────────────────────────────────────────────
  draw(ctx) {
    if (this.isAlive) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
    this.bullets.forEach(b => b.draw(ctx));
  },

  // ── 총알 발사 함수 ──────────────────────────────────────────────
  shoot() {
    const bx = this.x + this.width / 2 - 10;
    const by = this.y;
    const bullet = createBullet({
      x: bx,
      y: by,
      width: 20,
      height: 20,
      speedY: -2.5,
      sprite: bulletImg,
      hitboxWidth: 5,
      hitboxHeight: 5,
      hitboxOffsetX: 8,
      hitboxOffsetY: 5,
    });
    this.bullets.push(bullet);
  },

  // ── 폭발 함수 ─────────────────────────────────────────────────────
  explode() {
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, explosionPlayer, 2000, 48);
    this.isAlive = false;
    this.bullets = [];
    setTimeout(() => this.respawn(), 3000);
  },

  // ── 부활 함수 ──────────────────────────────────────────────────────
  respawn() {
    // 부활 위치
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 20;
    this.isAlive = true;
  },

  // ── 총알 업데이트 ───────────────────────────────────────────────────
  updateBullets() {
    this.bullets.forEach(b => b.update());
    // 밖으로 나간 총알 제거
    this.bullets = this.bullets.filter(b => b.y + b.height > 0);
  },
};

// ─── 적 매니저 정의 ───────────────────────────────────────────────────
const EnemyManager = {
  round: 1,
  enemies: [] as IEnemy[],
  fireCooldown: 0,
  fireInterval: 1000,

  configs: {
    1: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy1.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    2: { rows: 3, cols: 7, spriteSrc: '../../assets/images/space-img/enemy2.png', paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 0, descentY: 40 },
    3: { rows: 3, cols: 6, spriteSrc: '../../assets/images/space-img/enemy3.png', paddingX: 50, paddingY: 40, offsetX: 0, offsetY: 0, descentY: 50 },
  } as Record<number, IEnemyConfig>,

  // ── 적 스폰 함수(gpt code) ────────────────────────────────────────────
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

  //  ── 적 배열 한칸 아래로 이동 시키는 함수  ──────────────────────────────────────────
  updateAll(delta: number) {
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

    // 적 총알 업데이트 & 제거
    this.updateEnemyBullets();

    // 발사 쿨다운
    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      // fireCooldown 0 에서 1000(1초)로 변경
      this.fireCooldown = this.fireInterval;
      // 랜덤으로 적 배열중 공격
      this.fireFromRandomEnemy();
    }
  },

  // 총알 제거하기(업데이트)
  updateEnemyBullets() {
    // 모든 총알 위치 업데이트하기
    enemyBullets.forEach(b => b.update());

    // 화면 밖으로 나간 총알 제거 (canvas.height 보다 작아지면 삭제)
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }
  },

  // 랜덤으로 총 쏠 적 고르기
  fireFromRandomEnemy() {
    // [0, length] 사이로 랜덤 enemies[0~length] 들어가게 되서 슈터를 결정
    const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
    // 총알 생성
    const bullet = createBullet({
      x: shooter.x + shooter.width / 2 - 15,
      y: shooter.y + shooter.height,
      width: 30,
      height: 30,
      speedY: 3,
      sprite: enemyBulletImg,
      hitboxWidth: 5,
      hitboxHeight: 5,
      hitboxOffsetX: 12,
      hitboxOffsetY: 15,
    });
    enemyBullets.push(bullet);
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

// ─── 총알 생성 함수 ───────────────────────────────────────────────────
function createBullet(opts: BulletOptions): IBullet {
  return {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    speedY: opts.speedY,
    sprite: opts.sprite,
    hitboxWidth: opts.hitboxWidth,
    hitboxHeight: opts.hitboxHeight,
    hitboxOffsetX: opts.hitboxOffsetX,
    hitboxOffsetY: opts.hitboxOffsetY,
    update() {
      this.y += this.speedY;
    },
    draw(ctx) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    },
  };
}

// ─── 충돌 처리(gpt code) ───────────────────────────────────────────────────
function handleCollisions() {
  const enemyHit = new Set<IEnemy>();
  const bulletHit = new Set<IBullet>();

  EnemyManager.enemies.forEach(enemy => {
    Player.bullets.forEach(bullet => {
      // 1) Bullet 히트박스 위치 & 크기
      const bx = bullet.x + bullet.hitboxOffsetX;
      const by = bullet.y + bullet.hitboxOffsetY;
      const bw = bullet.hitboxWidth;
      const bh = bullet.hitboxHeight;

      // 히트박스가 없으면 검사 건너뛰기
      if (bw <= 0 || bh <= 0) return;

      // 폴리곤 생성
      const bPoly = new SAT.Box(new SAT.Vector(bx, by), bw, bh).toPolygon();
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();

      // 충돌 검사
      if (SAT.testPolygonPolygon(bPoly, ePoly)) {
        enemy.explode(); // 적 폭발
        enemyHit.add(enemy); // 적 제거
        bulletHit.add(bullet); // 총알제거
      }
    });
  });

  // 플레이어가 살아있는지 먼저 검사, 이후 플레이어의 이미지를 크기로 박스를 만들고 적과 충돌 시 explode() 호출
  if (Player.isAlive) {
    const pPoly = new SAT.Box(new SAT.Vector(Player.x, Player.y), Player.width, Player.height).toPolygon();
    EnemyManager.enemies.forEach(enemy => {
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();
      if (SAT.testPolygonPolygon(pPoly, ePoly)) Player.explode();
    });
  }

  // 배열에서 제거 시키기 (enemyHit에 기록된 총알)
  EnemyManager.enemies = EnemyManager.enemies.filter(e => !enemyHit.has(e));
  Player.bullets = Player.bullets.filter(b => !bulletHit.has(b));
}

// ─── 충돌 처리(gpt code) ───────────────────────────────────────────────────
function handleEnemyBulletCollisions() {
  // 플레이어 살아있는지 확인 먼저
  if (!Player.isAlive) return;

  // 플레이어 전체 스프라이트로 체크 점(x, y) 점(width, height) 크기의 사각형 생성 -> 영역을 폴리곤으로 변환
  const pPoly = new SAT.Box(new SAT.Vector(Player.x, Player.y), Player.width, Player.height).toPolygon();

  // 총알 검사하기 ( - 순환 splice로 잘랐을 때 인덱스가 안꼬이도록 )
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    // 적 총알 히트박스 (b.x b.y) -> 이미지 위치, (bw, bh)히트박스 시작 위치(좌상단)
    const bx = b.x + b.hitboxOffsetX;
    const by = b.y + b.hitboxOffsetY;
    const bw = b.hitboxWidth;
    const bh = b.hitboxHeight;

    //
    if (bw <= 0 || bh <= 0) continue;

    // 총알 히트박스도 마찬가지고 사각형 생성 후 영역을 폴리곤으로 변환
    const bPoly = new SAT.Box(new SAT.Vector(bx, by), bw, bh).toPolygon();

    // SAT 충돌 검사 true 시 플레이어 폭발과 함께 적 총알 제거
    if (SAT.testPolygonPolygon(pPoly, bPoly)) {
      Player.explode();
      enemyBullets.splice(i, 1);
    }
  }
}

// ─── 애셋 로딩 & 키 바인딩 ────────────────────────────────────────
// ─── 플레이어 이미지 생성
const playerImg = new Image();
playerImg.src = '../../assets/images/space-img/player.png';
Player.sprite = playerImg;

// ─── 총알 이미지 생성
const bulletImg = new Image();
bulletImg.src = '../../assets/images/space-img/player-bullet.png';
const enemyBulletImg = new Image();
enemyBulletImg.src = '../../assets/images/space-img/enemy-bullet.png';

// ─── 배경 이미지 생성
const backgroundImg = new Image();
backgroundImg.src = '../../assets/images/space-img/background.png';

// ─── 폭발 이미지 생성
const explosionPlayer = new Image();
explosionPlayer.src = '../../assets/images/space-img/explosion-player.png';
const explosionEnemy = new Image();
explosionEnemy.src = '../../assets/images/space-img/explosion-enemy.png';

// ─── 키버튼
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
  lastTs = 0;
const assets = [playerImg, bulletImg, enemyBulletImg, backgroundImg, explosionPlayer, explosionEnemy];
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

function gameLoop(ts: number) {
  const delta = ts - lastTs;
  lastTs = ts;

  // ─── 배경
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  // ─── 상태 업데이트
  Player.update();
  EnemyManager.updateAll(delta);

  // ─── 충돌처리
  handleCollisions();
  handleEnemyBulletCollisions();

  // ─── 렌더링
  Player.draw(ctx);
  enemyBullets.forEach(b => b.draw(ctx));

  // ─── 폭발 이펙트
  for (const ex of Explosions) {
    ex.update();
    ex.draw(ctx);
  }
  // ─── 폭발 이펙트 제거
  for (let i = Explosions.length - 1; i >= 0; i--) {
    if (Explosions[i].done) Explosions.splice(i, 1);
  }

  // ─── 적군 그리기
  EnemyManager.drawAll(ctx);

  // ─── 라운드 전환
  if (EnemyManager.enemies.length === 0) {
    const next = ++EnemyManager.round;
    if (EnemyManager.configs[next]) EnemyManager.spawn(EnemyManager.configs[next]);
    else console.log('게임 클리어!');
  }

  requestAnimationFrame(gameLoop);
}
