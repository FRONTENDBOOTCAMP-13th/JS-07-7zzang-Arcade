class MoleGame {
  // 🎯 상태 및 리소스 변수
  private score = 0;
  private timeLeft = 30;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private moleImages: HTMLImageElement[] = [new Image(), new Image()];
  private gameLoop: any;
  private timerLoop: any;
  private bat: HTMLImageElement;
  private molePositions = [
    // 🕳️ 9개 두더지 등장 위치
    { x: 120, y: 90 },
    { x: 350, y: 90 },
    { x: 570, y: 90 },
    { x: 120, y: 240 },
    { x: 360, y: 240 },
    { x: 580, y: 230 },
    { x: 120, y: 340 },
    { x: 350, y: 340 },
    { x: 580, y: 340 },
  ];
  private currentMoleIdx: number | null = null;
  private gameActive = false;

  constructor() {
    // ✅ smash-play 화면의 캔버스 요소 및 뿅망치 이미지 참조
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.bat = document.getElementById('bat') as HTMLImageElement;

    // 🐹 두더지 이미지 로딩 (1번, 2번 타입)
    this.moleImages[0].src = '/src/assets/images/smash-img/smash-mole1.png';
    this.moleImages[1].src = '/src/assets/images/smash-img/smash-mole2.png';

    // ▶️ intro 화면의 "시작 버튼" 클릭 → 게임 시작
    document.getElementById('clickStart')?.addEventListener('click', () => this.startGame());

    // 🏆 트로피 팝업 열기/닫기
    document.getElementById('trophyIcon')?.addEventListener('click', () => {
      this.renderScoreList(); // 점수 리스트 로컬스토리지에서 불러오기
      this.show('scorePopup'); // ✅ scorePopup을 보여줘야 해!!
    });

    // 🏠 홈 아이콘 클릭 시 (향후 기능 추가 예정)
    document.getElementById('homeIcon')?.addEventListener('click', () => alert('🏠 홈 이동 (나중에 연결 예정)'));

    // 📋 score 팝업 닫기
    document.getElementById('closeScore')?.addEventListener('click', () => this.hide('scorePopup'));

    // 🔁 게임 오버 후 다시 시작
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      this.hide('gameOverPopup');
      this.gotoIntro();
    });

    // 💾 게임 오버 → 닉네임 저장 팝업으로 전환
    document.getElementById('save-btn')?.addEventListener('click', () => {
      this.hide('gameOverPopup');
      this.show('savePopup');
    });

    // ✅ 저장 팝업에서 점수 저장 버튼 클릭
    document.getElementById('saveButton')?.addEventListener('click', () => this.saveScore());

    // ⛔ 저장 팝업에서 게임 나가기 → 인트로 화면
    document.getElementById('exitGame')?.addEventListener('click', () => this.gotoIntro());

    // 💾 게임 오버 → 닉네임 저장 팝업으로 전환
    document.getElementById('save-btn')?.addEventListener('click', () => {
      this.hide('gameOverPopup');
      this.show('savePopup');
      document.getElementById('bat')!.style.display = 'none'; // 뿅망치 숨기기
    });

    // ✅ 저장 팝업에서 점수 저장 버튼 클릭
    document.getElementById('saveButton')?.addEventListener('click', () => {
      this.saveScore();
      document.getElementById('savePopup')?.classList.add('hidden');
      document.getElementById('bat')!.style.display = ''; // 뿅망치 다시 보이기
    });

    // ⛔ 저장 팝업에서 게임 나가기 → 인트로 화면
    document.getElementById('exitGame')?.addEventListener('click', () => {
      this.gotoIntro();
      document.getElementById('bat')!.style.display = ''; // 뿅망치 다시 보이기
    });
    // 🎯 게임 캔버스 클릭 시 두더지 맞추기 처리
    this.canvas.addEventListener('click', e => this.handleClick(e));

    // 🔨 마우스 이동 시 뿅망치 따라다니기
    document.addEventListener('mousemove', e => this.moveBat(e));

    // ⌨️ 키보드 Enter 누르면 게임 시작
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter') this.startGame();
    });
  }

  // 🔨 뿅망치 따라다니는 위치 조정 (smash-hat.png 위치 설정)
  private moveBat(event: MouseEvent): void {
    const gameScreen = document.getElementById('gameScreen');
    const rect = gameScreen?.getBoundingClientRect();
    const offsetX = rect ? event.clientX - rect.left : event.clientX;
    const offsetY = rect ? event.clientY - rect.top : event.clientY;
    this.bat.style.left = `${offsetX - 122}px`; // 중심 보정
    this.bat.style.top = `${offsetY - 107}px`;
  }

  // ▶️ 게임 시작 로직
  private startGame(): void {
    this.score = 0;
    this.timeLeft = 30;
    this.gameActive = true;
    this.hide('introScreen');
    this.hide('scorePopup');
    this.hide('gameOverPopup');
    this.hide('savePopup');
    this.show('gameScreen');
    this.updateTimer();
    this.updateScore();

    clearInterval(this.gameLoop);
    clearInterval(this.timerLoop);

    // 🐹 두더지 등장 주기
    this.gameLoop = setInterval(() => this.spawnMole(), 800);
    // ⏳ 타이머 감소
    this.timerLoop = setInterval(() => this.countdown(), 1000);
  }

  // ⏳ 타이머 감소 처리
  private countdown(): void {
    if (!this.gameActive) return;
    this.timeLeft--;
    this.updateTimer();
    if (this.timeLeft <= 0) {
      this.gameActive = false;
      clearInterval(this.gameLoop);
      clearInterval(this.timerLoop);
      this.show('gameOverPopup');
      document.getElementById('score-display')!.textContent = `${this.score}`;
    }
  }

  // 🐹 두더지 등장 (확률적으로 1번/2번 두더지)
  private spawnMole(): void {
    if (!this.gameActive) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const idx = Math.floor(Math.random() * 9);
    this.currentMoleIdx = idx;
    const type = Math.random() < 0.8 ? 0 : 1;
    const pos = this.molePositions[idx];
    this.ctx.drawImage(this.moleImages[type], pos.x, pos.y, 200, 200);
  }

  // 🎯 두더지 맞췄는지 확인하고 점수 증가
  private handleClick(e: MouseEvent): void {
    if (!this.gameActive || this.currentMoleIdx === null) return;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pos = this.molePositions[this.currentMoleIdx];

    if (clickX >= pos.x && clickX <= pos.x + 200 && clickY >= pos.y && clickY <= pos.y + 200) {
      this.score += 10;
      this.updateScore();
      // ✨ 트윙클 효과 발생 위치
      this.spawnStarEffect(clickX + 50, clickY - 16);

      // 두더지 맞춘 후에는 더 이상 클릭해도 점수 안 오르게!
      this.currentMoleIdx = null;
    }
  }

  // ✨ 두더지 맞췄을 때 트윙클 임팩트 애니메이션
  private spawnStarEffect(x: number, y: number): void {
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const angle = (2 * Math.PI * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const radius = 40 + Math.random() * 60;
      const scale = 1 + Math.random();
      const star = document.createElement('img');
      star.src = '/src/assets/images/smash-img/smash-twinkle.png';
      star.className = 'star';
      star.style.position = 'absolute';
      star.style.left = `${x - 16}px`;
      star.style.top = `${y - 16}px`;
      star.style.width = '32px';
      star.style.height = '32px';
      star.style.opacity = '1';
      star.style.pointerEvents = 'none';
      star.style.transition = 'transform 0.9s cubic-bezier(.5,1.8,.5,1), opacity 0.9s';
      document.getElementById('gameScreen')!.appendChild(star);

      setTimeout(() => {
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius - Math.random() * 40;
        star.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${Math.random() * 360}deg)`;
        star.style.opacity = '0';
      }, 10);

      setTimeout(() => star.remove(), 1000);
    }
  }

  // 💾 닉네임 입력 후 점수 저장 → localStorage 저장 (5명까지)
  private saveScore(): void {
    const name = (document.getElementById('playerName') as HTMLInputElement).value.trim().slice(0, 3);
    if (!name) return;
    const scores = JSON.parse(localStorage.getItem('moleScores') || '[]');
    scores.push({ name, score: this.score });
    scores.sort((a: any, b: any) => b.score - a.score || a.name.localeCompare(b.name, 'ko'));
    localStorage.setItem('moleScores', JSON.stringify(scores.slice(0, 5)));
    this.gotoIntro();
  }

  private renderScoreList(): void {
    const list = document.getElementById('scoreList')!;
    list.innerHTML = '';
    const scores = JSON.parse(localStorage.getItem('moleScores') || '[]');
    scores.forEach((entry: { name: string; score: number }) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="name">${entry.name}</span><span class="score">${entry.score}</span>`;
      list.appendChild(li);
    });
  }

  // 📦 화면 숨기기/보이기 공통 처리
  private hide(id: string): void {
    document.getElementById(id)?.classList.add('hidden');
  }

  private show(id: string): void {
    document.getElementById(id)?.classList.remove('hidden');
  }

  // ⏳ 남은 시간 표시 및 경고 처리
  private updateTimer(): void {
    const timer = document.getElementById('timer');
    if (timer) {
      timer.textContent = `⏳ ${this.timeLeft}초`;
      if (this.timeLeft < 10) {
        timer.classList.add('warning');
      } else {
        timer.classList.remove('warning');
      }
    }
  }

  // 🏆 현재 점수 표시
  private updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `🏆 점수: ${this.score}`;
    }
  }

  // 🔁 저장 후 인트로 화면으로 복귀
  private gotoIntro(): void {
    this.hide('savePopup');
    this.hide('gameOverPopup');
    this.hide('scorePopup');
    this.hide('gameScreen'); // ✅ start 화면과 play 화면이 같이 붙어서 나오는 현상 방지
    this.show('introScreen');
  }
}

// 🔄 페이지 로딩 후 게임 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
  new MoleGame();
});
