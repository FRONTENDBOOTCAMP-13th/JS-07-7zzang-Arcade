import '../../style.css';
import './space.css';
import * as SAT from 'sat';
import playerImgSrc from '../../assets/images/space-img/player.png';
import bulletImgSrc from '../../assets/images/space-img/player-bullet.png';
import enemyBulletImgSrc from '../../assets/images/space-img/enemy-bullet.png';
import backgroundImgSrc from '../../assets/images/space-img/background.png';
import explosionPlayerSrc from '../../assets/images/space-img/explosion-player.png';
import explosionEnemySrc from '../../assets/images/space-img/explosion-enemy.png';
import lifeIconSrc from '../../assets/images/space-img/heart.png';
import bossImgSrc from '../../assets/images/space-img/boss.png';
import enemy1ImgSrc from '../../assets/images/space-img/enemy1.png';
import enemy2ImgSrc from '../../assets/images/space-img/enemy2.png';
import enemy3ImgSrc from '../../assets/images/space-img/enemy3.png';
import alienIconSrc from '../../assets/images/space-img/alien-icon.png';

// 파이어 베이스 파일 import
import { fireScore, getTopScores } from '../../utilits/scoreService';

// ─── 타입 가드 헬퍼 ────────────────────────────────────────
function assertInstance<T>(el: any, constructor: { new (...args: any[]): T }, name: string): asserts el is T {
  if (!(el instanceof constructor)) {
    throw new Error(`${name} 엘리먼트를 찾을 수 없거나 올바른 타입이 아닙니다.`);
  }
}

// ─── HTML 요소 가져오기 ───────────────────────────────────
const introElRaw = document.getElementById('intro');
assertInstance(introElRaw, HTMLDivElement, 'intro');
const introEl = introElRaw;

const startBtnRaw = document.getElementById('startBtn');
assertInstance(startBtnRaw, HTMLButtonElement, 'startBtn');
const startBtn = startBtnRaw;

const canvasElRaw = document.getElementById('gameCanvas');
assertInstance(canvasElRaw, HTMLCanvasElement, 'gameCanvas');
const canvasEl = canvasElRaw;

const scoreModalRaw = document.getElementById('scoreModal');
assertInstance(scoreModalRaw, HTMLDivElement, 'scoreModal');
const scoreModal = scoreModalRaw;

const trophyIconRaw = document.getElementById('trophyIcon');
assertInstance(trophyIconRaw, HTMLImageElement, 'trophyIcon');
const trophyIcon = trophyIconRaw;

const nameModalRaw = document.getElementById('nameModal');
assertInstance(nameModalRaw, HTMLDivElement, 'nameModal');
const nameModal = nameModalRaw;

const cancelBtnRaw = document.getElementById('cancelBtn');
assertInstance(cancelBtnRaw, HTMLButtonElement, 'cancelBtn');
const cancleBtn = cancelBtnRaw;

const saveBtnRaw = document.getElementById('saveBtn');
assertInstance(saveBtnRaw, HTMLButtonElement, 'saveBtn');
const saveBtn = saveBtnRaw;

const gameOverModalRaw = document.getElementById('gameOverModal');
assertInstance(gameOverModalRaw, HTMLDivElement, 'gameOverModal');
const gameOverModal = gameOverModalRaw;

const restartBtnRaw = document.getElementById('restartBtn');
assertInstance(restartBtnRaw, HTMLButtonElement, 'restartBtn');
const restartBtn = restartBtnRaw;

const openSaveBtnRaw = document.getElementById('openSave');
assertInstance(openSaveBtnRaw, HTMLButtonElement, 'openSave');
const openSaveBtn = openSaveBtnRaw;

const nicknameInputRaw = document.getElementById('nicknameInput');
assertInstance(nicknameInputRaw, HTMLInputElement, 'nicknameInput');
const nicknameInput = nicknameInputRaw;

const gameScoreElRaw = document.getElementById('gameScore');
assertInstance(gameScoreElRaw, HTMLHeadingElement, 'gameScore');
const gameScoreEl = gameScoreElRaw;

const gameResultElRaw = document.getElementById('gameResult');
assertInstance(gameResultElRaw, HTMLHeadingElement, 'gameResult');
const gameResultEl = gameResultElRaw;

const scoreListElRaw = document.querySelector('#scoreModal ul');
assertInstance(scoreListElRaw, HTMLUListElement, 'scoreModal ul');
const scoreListEl = scoreListElRaw;

// ─── 사운드 로드 ─────────────────────────
const bgm = new Audio('/sounds/space-bgm.mp3');
const bossBgm = new Audio('/sounds/space-boss.mp3');
const gameOverSound = new Audio('/sounds/space-gameover.mp3');
const attackSound = new Audio('/sounds/space-attack.mp3');
bgm.loop = true;
bossBgm.loop = true;
bgm.volume = bossBgm.volume = gameOverSound.volume = attackSound.volume = 0.1;

// ──── 닉네임 패턴 && 스토리지 ────────────────────────────
const nickPattern = /^([가-힣]{3}|[A-Z]{3})$/;

// ─── overlay 클릭 시 닫기 ────────────
scoreModal.addEventListener('click', () => {
  scoreModal.classList.add('hidden');
});

// ─── 트로피 클릭 시 ──────────────────
trophyIcon.addEventListener('click', () => {
  renderScoreList();
  scoreModal.classList.remove('hidden');
});

// ─── 게임 시작 버튼 클릭 시 ────────────
startBtn.addEventListener('click', () => {
  window.parent.postMessage({ type: 'STOP_BGM' }, '*');

  if (!assetsLoaded) return;
  introEl.style.display = 'none';
  canvasEl.style.display = 'block';
  bgm.currentTime = 0;
  bgm.play().catch(() => {});
  init();
});

// ─── 취소 버튼 클릭 시 ──────────────────
cancleBtn.addEventListener('click', () => {
  window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
  canvasEl.style.display = 'none';
  introEl.style.display = 'flex';
  nameModal.classList.add('hidden');
});

// ─── 다시하기 버튼 클릭 시 ──────────────────
restartBtn.addEventListener('click', () => {
  window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
  gameOverModal.classList.add('hidden');
  canvasEl.style.display = 'none';
  introEl.style.display = 'flex';
});

// ─── 저장오픈버튼  클릭 시 ──────────────────
openSaveBtn.addEventListener('click', () => {
  nicknameInput.value = '';
  //  포커스
  nicknameInput.focus();

  nameModal.classList.remove('hidden');
  gameOverModal.classList.add('hidden');
});

// ─── SAVE 클릭 시 ───────────────────────────
saveBtn.addEventListener('click', async () => {
  const nickRaw = nicknameInput.value.trim().toUpperCase();

  // 빈 값 체크
  if (!nickRaw) {
    showToast('닉네임을 입력해주세요');
    nicknameInput.focus();
    return;
  }

  // 패턴 검사
  if (!nickPattern.test(nickRaw)) {
    showToast('한글 3글자 또는 영어 3글자(영어는 대문자)만 입력 가능합니다.');
    nicknameInput.focus();
    return;
  }

  try {
    await fireScore(nickRaw, Score.score, 'seven-space'); // Firestore에 저장, 해당 파라미터로
    showToast(`${nickRaw}님, ${Score.score}점이 저장되었습니다!`);
  } catch {
    showToast('점수 저장에 실패했습니다.');
  }

  // 모달 닫기 및 화면 전환
  nameModal.classList.add('hidden');
  canvasEl.style.display = 'none';
  introEl.style.display = 'flex';
});

// <ul>에 렌더링
async function renderScoreList() {
  scoreListEl.innerHTML = '';

  try {
    // firestore 접근, seven-space 값 가진 데이터들 중 상위 5개 가져옴
    const top5 = await getTopScores('seven-space');

    scoreListEl.innerHTML = top5
      .map(
        (entry: any) => `
        <li>
          <div>
            <img src="${alienIconSrc}" alt="alien icon" class="alien-icon" />
            ${entry.nickname}
          </div>
          <div>${entry.score}</div>
        </li>
      `,
      )
      .join('');
  } catch {
    scoreListEl.innerHTML = '<li>점수 불러오기 실패</li>';
  }
}

function showToast(message: string, duration = 2000) {
  const container = document.getElementById('toast-container')!;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // 애니메이션 트리거
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // duration 후 페이드아웃 및 제거
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, duration);
}

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
  isInvincible: boolean;
  invincibleTime: number;
  canShoot: boolean;
  shoot(): void;
  updateBullets(): void;
  explode(): void;
  respawn(): void;
  invincibility(duration: number): void;
}

interface IEnemy extends IGameObject {
  sprite: HTMLImageElement;
  speedX: number;
  descentY: number;
  direction: 1 | -1;
  scoreValue: number;
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

interface ILife {
  lives: number;
  icon: HTMLImageElement;
  draw(ctx: CanvasRenderingContext2D): void;
}

interface IScore {
  score: number;
  draw(ctx: CanvasRenderingContext2D): void;
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
const bossBullets: IBullet[] = [];
const Explosions: IExplosion[] = [];
let roundPoint = false; // 이번 라운드 클리어 보너스 지급 여부
let bossPhase = false; // 보스 전투 중인지
let bgOffset = 0;
const bgSpeed = 1.5; // 원하는 스크롤 속도
let lives = 3;
let score = 0;

// ─── 라이프 정의 ─────────────────────────────────────────────
const Life: ILife = {
  lives,
  icon: new Image(),

  draw(ctx) {
    const iconSize = 35;
    const padding = 15;
    for (let i = 0; i < this.lives; i++) {
      ctx.drawImage(lifeIcon, padding + i * (iconSize + padding / 2), padding, iconSize, iconSize);
    }
  },
};

// ─── 스코어 정의 ─────────────────────────────────────────────
const Score: IScore = {
  score,
  draw(ctx) {
    const padding = 20;
    ctx.save();
    ctx.fillStyle = 'yellow';
    ctx.font = '25px DungGeunMo, sans-serif';
    const text = `Score: ${this.score}`;
    const textWidth = ctx.measureText(text).width + 20;

    ctx.fillText(text, canvas.width - textWidth - padding, padding + 20);
    ctx.restore();
  },
};

// ─── 플레이어 정의 ──────────────────────────────────────────────
const Player: IPlayer = {
  x: 0,
  y: 0,
  width: 70,
  height: 60,
  speed: 2.5,
  invincibleTime: 0,
  isAlive: true,
  canShoot: true,
  isInvincible: false,
  sprite: new Image(),
  bullets: [],

  // ── 화면 업데이트 ───────────────
  update() {
    if (!this.isAlive) return;
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
    if (keys.ArrowRight && this.x + this.width < canvas.width) this.x += this.speed;
    if (keys.Space) this.shoot();
    this.updateBullets();
  },

  // ── 화면 그리기 ───────────────
  draw(ctx) {
    if (!this.isAlive) return;

    ctx.save();

    // 무적 중일 때 200ms 주기로 반투명 ↔ 불투명 토글 (gpt code)
    if (this.isInvincible) {
      const invinciMotion = performance.now() % 200;
      ctx.globalAlpha = invinciMotion < 100 ? 0.5 : 1;
    }

    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    ctx.restore();

    this.bullets.forEach(b => b.draw(ctx));
  },

  // ── 총알 발사 함수 ────────────────
  shoot() {
    if (!this.canShoot || !this.isAlive) return;

    attackSound.currentTime = 0;
    attackSound.play().catch(() => {});

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

    this.canShoot = false;
    setTimeout(() => {
      this.canShoot = true;
    }, 700);
  },

  // ── 폭발 함수 ─────────────────────────
  explode() {
    lives--;
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, explosionPlayer, 2000, 48);
    this.isAlive = false;
    this.bullets = [];
    setTimeout(() => {
      this.respawn();
      this.invincibility(2000);
    }, 2000);
  },

  // ── 부활 함수 ──────────────────────────
  respawn() {
    // 부활 위치
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 20;
    this.isAlive = true;
  },

  // ── 총알 업데이트 ──────────────────────
  updateBullets() {
    this.bullets.forEach(b => b.update());
    // 밖으로 나간 총알 제거
    this.bullets = this.bullets.filter(b => b.y + b.height > 0);
  },

  // ── 부활 후 무적 ────────────────────────
  invincibility(duration) {
    this.isInvincible = true;
    setTimeout(() => {
      this.isInvincible = false;
    }, duration);
  },
};
// ─── 플레이어 정의 ──────────────────────────────────────────────────

// ─── 적 매니저 정의 ──────────────────────────────────────────────────
const EnemyManager = {
  round: 1,
  enemies: [] as IEnemy[],
  fireCooldown: 0,
  fireInterval: 1000,

  configs: {
    1: { rows: 3, cols: 7, spriteSrc: enemy1ImgSrc, paddingX: 20, paddingY: 10, offsetX: 0, offsetY: 30, descentY: 60 },
    2: { rows: 3, cols: 7, spriteSrc: enemy2ImgSrc, paddingX: 30, paddingY: 20, offsetX: 0, offsetY: 30, descentY: 70 },
    3: { rows: 3, cols: 6, spriteSrc: enemy3ImgSrc, paddingX: 40, paddingY: 30, offsetX: 0, offsetY: 35, descentY: 80 },
  } as Record<number, IEnemyConfig>,

  // ── 적 스폰 함수(gpt code) ──────────────────────
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
          scoreValue: 5 * this.round,
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

  // ──── 적 배열 한칸 아래로 이동 시키는 함수  ───────
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

  // ─── 총알 제거하기(업데이트) ───────────────
  updateEnemyBullets() {
    // 모든 총알 위치 업데이트하기
    enemyBullets.forEach(b => b.update());

    // 화면 밖으로 나간 총알 제거 (canvas.height 보다 작아지면 삭제)
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (enemyBullets[i].y > canvas.height) {
        enemyBullets.splice(i, 1);
      }
    }
  },

  // ─── 랜덤으로 총 쏠 적 고르기 ───────────────
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
// ─── 적 매니저 정의 ──────────────────────────────────────────────────

// ─── 보스 정의 ──────────────────────────────────────────────────────
const boss = {
  x: canvas.width / 2 - 120,
  y: 50,
  width: 240,
  height: 80,
  sprite: new Image(),
  speedX: 3,
  direction: 1,
  hitCount: 0,
  hitPoint: 30,
  fireCooldown: 0,
  fireInterval: 700,

  update() {},

  updateBoss(delta: number) {
    this.x += this.speedX * this.direction;
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.direction = -this.direction as 1 | -1;
    }
    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      this.shoot();
      this.fireCooldown = this.fireInterval;
    }

    this.updateBossBullets();
  },

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  },

  shoot() {
    // 보스 총알 생성 (아래로 떨어지도록)
    const cx = this.x + this.width / 2;
    const sy = this.y + this.height;
    const bullet = createBullet({
      x: cx - 5,
      y: sy,
      width: 30,
      height: 30,
      speedY: 3,
      sprite: enemyBulletImg,
      hitboxWidth: 5,
      hitboxHeight: 5,
      hitboxOffsetX: 12,
      hitboxOffsetY: 15,
    });
    bossBullets.push(bullet);
  },

  updateBossBullets() {
    bossBullets.forEach(b => b.update());
    for (let i = bossBullets.length - 1; i >= 0; i--) {
      if (bossBullets[i].y > canvas.height) bossBullets.splice(i, 1);
    }
  },
};
// ─── 보스 정의 ──────────────────────────────────────────────────────

// ─── 폭발 이펙트 생성 ────────────────────────────────────────────────
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
function createBullet(bullet: BulletOptions): IBullet {
  return {
    x: bullet.x,
    y: bullet.y,
    width: bullet.width,
    height: bullet.height,
    speedY: bullet.speedY,
    sprite: bullet.sprite,
    hitboxWidth: bullet.hitboxWidth,
    hitboxHeight: bullet.hitboxHeight,
    hitboxOffsetX: bullet.hitboxOffsetX,
    hitboxOffsetY: bullet.hitboxOffsetY,
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
  // 일반 적 vs 플레이어 총알 충돌
  const enemyHit = new Set<IEnemy>();
  const bulletHit = new Set<IBullet>();

  EnemyManager.enemies.forEach(enemy => {
    Player.bullets.forEach(bullet => {
      const bx = bullet.x + bullet.hitboxOffsetX;
      const by = bullet.y + bullet.hitboxOffsetY;
      const bw = bullet.hitboxWidth;
      const bh = bullet.hitboxHeight;
      if (bw <= 0 || bh <= 0) return;

      const bPoly = new SAT.Box(new SAT.Vector(bx, by), bw, bh).toPolygon();
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();

      if (SAT.testPolygonPolygon(bPoly, ePoly)) {
        enemy.explode();
        enemyHit.add(enemy);
        bulletHit.add(bullet);
      }
    });
  });

  // 몬스터 제거 및 점수 추가
  enemyHit.forEach(e => {
    score += e.scoreValue;
  });
  EnemyManager.enemies = EnemyManager.enemies.filter(e => !enemyHit.has(e));
  Player.bullets = Player.bullets.filter(b => !bulletHit.has(b));

  // 플레이어 vs 일반 적 충돌
  if (Player.isAlive && !Player.isInvincible) {
    const pPoly = new SAT.Box(new SAT.Vector(Player.x, Player.y), Player.width, Player.height).toPolygon();
    EnemyManager.enemies.forEach(enemy => {
      const ePoly = new SAT.Box(new SAT.Vector(enemy.x, enemy.y), enemy.width, enemy.height).toPolygon();
      if (SAT.testPolygonPolygon(pPoly, ePoly)) {
        Player.explode();
      }
    });
  }

  // 보스 vs 플레이어 총알 충돌 (웨이브 클리어 후)
  if (EnemyManager.enemies.length === 0 && boss.hitPoint > 0) {
    Player.bullets.forEach((bullet, idx) => {
      const bx = bullet.x + bullet.hitboxOffsetX;
      const by = bullet.y + bullet.hitboxOffsetY;
      const bw = bullet.hitboxWidth;
      const bh = bullet.hitboxHeight;
      if (bw <= 0 || bh <= 0) return;

      const bPoly = new SAT.Box(new SAT.Vector(bx, by), bw, bh).toPolygon();
      const bossPoly = new SAT.Box(new SAT.Vector(boss.x, boss.y), boss.width, boss.height).toPolygon();
      if (SAT.testPolygonPolygon(bPoly, bossPoly)) {
        // 보스 피격
        boss.hitPoint--;
        spawnExplosion(bullet.x, bullet.y, explosionEnemy, 200, 20);

        // 한 대당 점수 +4
        score += 3;

        // 총알 제거
        Player.bullets.splice(idx, 1);
      }
    });

    // 보스 체력 0 이하시 대폭발
    if (boss.hitPoint <= 0) {
      spawnExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, explosionEnemy, 2000, boss.width * 1.2);
    }
  }

  // 적(및 보스) 총알 vs 플레이어 충돌
  handleEnemyBulletCollisions();
}

// ─── 충돌 처리(gpt code) ───────────────────────────────────────────────────
function handleEnemyBulletCollisions() {
  if (!Player.isAlive) return;
  const pPoly = new SAT.Box(new SAT.Vector(Player.x, Player.y), Player.width, Player.height).toPolygon();

  // 검사할 총알 배열을 하나로 묶어서 처리
  const allBullets = [enemyBullets, bossBullets];
  for (const bulletArr of allBullets) {
    for (let i = bulletArr.length - 1; i >= 0; i--) {
      if (Player.isInvincible) break;
      const b = bulletArr[i];
      const bx = b.x + b.hitboxOffsetX;
      const by = b.y + b.hitboxOffsetY;
      const bw = b.hitboxWidth;
      const bh = b.hitboxHeight;
      if (bw <= 0 || bh <= 0) continue;

      const bPoly = new SAT.Box(new SAT.Vector(bx, by), bw, bh).toPolygon();
      if (SAT.testPolygonPolygon(pPoly, bPoly)) {
        Player.explode();
        bulletArr.splice(i, 1);
      }
    }
  }
}

// ─── 애셋 로딩 & 키 바인딩 ────────────────────────────────────────
// ─── 플레이어 이미지 생성
const playerImg = new Image();
playerImg.src = playerImgSrc;
Player.sprite = playerImg;

// ─── 총알 이미지 생성
const bulletImg = new Image();
bulletImg.src = bulletImgSrc;
const enemyBulletImg = new Image();
enemyBulletImg.src = enemyBulletImgSrc;

// ─── 배경 이미지 생성
const backgroundImg = new Image();
backgroundImg.src = backgroundImgSrc;

// ─── 폭발 이미지 생성
const explosionPlayer = new Image();
explosionPlayer.src = explosionPlayerSrc;
const explosionEnemy = new Image();
explosionEnemy.src = explosionEnemySrc;

// ─── 생명 이미지 생성
const lifeIcon = new Image();
lifeIcon.src = lifeIconSrc;

// ─── 보스 이미지 생성
const bossImg = new Image();
bossImg.src = bossImgSrc;

// ─── 키버튼
const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Space') keys[e.key] = true;
  if (e.code === 'Space') Player.shoot();
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Space') keys[e.key] = false;
});

// ─── 에셋 로드 ───────────────────────────────────────────
let loaded = 0,
  lastTs = 0;
const assets = [playerImg, bulletImg, enemyBulletImg, backgroundImg, explosionPlayer, explosionEnemy, lifeIcon, bossImg];
let assetsLoaded = false;

assets.forEach(img => {
  img.onload = () => {
    if (++loaded === assets.length) {
      assetsLoaded = true;
      startBtn.disabled = false; // 버튼 활성화
    }
  };
});

// ─── 초기화 ──────────────────────────────────────────────────────
function init() {
  boss.sprite = bossImg;
  score = 0;
  lives = 3;
  roundPoint = false;
  bossPhase = false;
  Player.bullets = [];
  EnemyManager.round = 1;
  Explosions.length = 0;
  enemyBullets.length = 0;
  bossBullets.length = 0;
  gameResultEl.textContent = 'GAME OVER';
  gameResultEl.style.color = 'red';
  gameResultEl.style.fontSize = '7rem';
  Player.x = (canvas.width - Player.width) / 2;
  Player.y = canvas.height - Player.height - 20;
  EnemyManager.spawn(EnemyManager.configs[EnemyManager.round]);
  requestAnimationFrame(gameLoop);
}
// ─── 게임 루프 ──────────────────────────────────────────
function gameLoop(ts: number) {
  if (lives <= 0) {
    bgm.pause();
    bossBgm.pause();
    // game over 사운드
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});

    gameScoreEl.textContent = Score.score.toString();
    canvasEl.classList.add('hidden');
    gameOverModal.classList.remove('hidden');
    return;
  }

  const delta = ts - lastTs;
  lastTs = ts;

  // ─── 배경 업데이트 & 렌더링
  bgOffset = (bgOffset + bgSpeed) % canvas.height;

  // 배경 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, bgOffset, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, bgOffset - canvas.height, canvas.width, canvas.height);

  // ─── 상태 업데이트 & 나머지 렌더링
  Player.update();
  EnemyManager.updateAll(delta);

  // ─── 충돌처리
  handleCollisions();
  handleEnemyBulletCollisions();

  // ─── 플레이어
  Player.draw(ctx);

  // ─── 적 & 보스 총알
  enemyBullets.forEach(b => b.draw(ctx));
  bossBullets.forEach(b => b.draw(ctx));

  // ─── 라이프
  Life.lives = lives;
  Life.draw(ctx);

  // ─── 스코어
  Score.score = score;
  Score.draw(ctx);

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

  // ─── 적이 바닥에 닿았는지 체크
  if (EnemyManager.enemies.some(e => e.y + e.height >= canvas.height)) {
    lives = 0;
  }

  // ─── 라운드 전환
  if (EnemyManager.enemies.length === 0 && !bossPhase) {
    if (!roundPoint) {
      score += 23;
      roundPoint = true;
      Player.bullets = [];
      enemyBullets.length = 0;
    }

    // ─── 라운드 적 스폰 + 보스 조건 확인
    const next = ++EnemyManager.round;
    if (EnemyManager.configs[next]) {
      EnemyManager.spawn(EnemyManager.configs[next]);
      roundPoint = false;
    } else {
      bossPhase = true;
      boss.hitPoint = 30;

      // BGM 전환
      bgm.pause();
      bossBgm.currentTime = 0;
      bossBgm.play().catch(() => {});
    }
  }

  // ──── 보스 소환
  if (bossPhase) {
    boss.updateBoss(delta);
    boss.draw(ctx);

    if (boss.hitPoint == 1) {
      score = 774;
      Score.score = score;
      Score.draw(ctx);
    }

    // ─── 보스 격파
    if (boss.hitPoint <= 0) {
      spawnExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, explosionEnemy, 2000, boss.width * 1.2);
      bossPhase = false;

      gameScoreEl.textContent = Score.score.toString();
      gameResultEl.textContent = 'GAME CLEAR';
      gameResultEl.style.color = 'lime';
      gameResultEl.style.fontSize = '6rem';
      canvasEl.classList.add('hidden');
      gameOverModal.classList.remove('hidden');
      return;
    }
  }

  requestAnimationFrame(gameLoop);
}
