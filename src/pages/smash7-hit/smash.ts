import mole1Img from '../../assets/images/smash-img/smash-mole1.png';
import mole2Img from '../../assets/images/smash-img/smash-mole2.png';
import twinkleImg from '../../assets/images/smash-img/smash-twinkle.png';

// 파이어 베이스 파일 import (매우 중요)
import { fireScore, getTopScores } from '../../utilits/scoreService';

class MoleGame {
  // 상태 및 리소스 변수
  private score = 0;
  private timeLeft = 30;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private moleImages: HTMLImageElement[] = [new Image(), new Image()];
  private gameLoop: any;
  private timerLoop: any;
  private bat: HTMLImageElement;
  private bgm: HTMLAudioElement | null = null;
  private molePositions = [
    // 9개 두더지 등장 위치
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
    // smash-play 화면의 캔버스 요소 및 뿅망치 이미지 참조
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.bat = document.getElementById('bat') as HTMLImageElement;

    // 두더지 이미지 (1번, 2번)
    this.moleImages[0].src = mole1Img;
    this.moleImages[1].src = mole2Img;

    // 트로피 팝업 열기 + 효과음 재생
    document.getElementById('trophyIcon')?.addEventListener('click', () => {
      this.playEffect('/sounds/smash-trophy-bgm.mp3'); // 효과음 추가!
      this.renderScoreList();
      this.show('scorePopup');
    });

    // 홈 아이콘 클릭 시
    document.getElementById('homeIcon')?.addEventListener('click', () => {
      this.playEffect('/sounds/smash-home.mp3'); // 효과음만 재생됨!
    });

    // score 팝업 닫기
    document.getElementById('closeScore')?.addEventListener('click', () => this.hide('scorePopup'));

    // 게임 오버 후 다시 시작
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      this.hide('gameOverPopup');
      this.gotoIntro();
    });

    // 게임 오버 → 닉네임 저장 팝업으로 전환
    document.getElementById('save-btn')?.addEventListener('click', () => {
      this.hide('gameOverPopup');
      this.show('savePopup');
      document.getElementById('bat')!.style.display = 'none'; // 뿅망치 숨기기
      // 닉네임 입력창 초기화 + 자동 포커스
      setTimeout(() => {
        const input = document.getElementById('playerName') as HTMLInputElement;
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 0);
    });

    // 저장 팝업에서 점수 저장 버튼 클릭
    document.getElementById('saveButton')?.addEventListener('click', () => {
      this.saveScore();
      // document.getElementById('savePopup')?.classList.add('hidden');
    });

    // 저장 팝업에서 게임 나가기 → 인트로 화면
    document.getElementById('exitGame')?.addEventListener('click', () => {
      this.gotoIntro();
      window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');
    });

    // 닉네임 입력 시: 한글 + 영어만 허용하고 3글자까지 제한
    const nicknameInput = document.getElementById('playerName') as HTMLInputElement;

    let isComposing = false;

    // 한글 입력 조합 시작
    nicknameInput?.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    // 한글 입력 조합 종료
    nicknameInput?.addEventListener('compositionend', () => {
      isComposing = false;
      if (nicknameInput.value.length > 3) {
        nicknameInput.value = nicknameInput.value.slice(0, 3);
        nicknameInput.setSelectionRange(3, 3);
      }
      limitNickname();
    });

    // 일반 입력 처리 (한글 입력 조합)
    nicknameInput?.addEventListener('input', () => {
      if (!isComposing) {
        limitNickname();
      } else if (nicknameInput.value.length > 3) {
        nicknameInput.value = nicknameInput.value.slice(0, 3);
        nicknameInput.setSelectionRange(3, 3);
      }
    });

    function limitNickname() {
      const rawValue = nicknameInput.value;
      const filtered = [...rawValue]
        .filter(char => /[가-힣a-zA-Z]/.test(char))
        .slice(0, 3)
        .join('');
      if (nicknameInput.value !== filtered) {
        nicknameInput.value = filtered;
      }
    }

    // 게임 캔버스 클릭 시 두더지 맞추기 처리
    this.canvas.addEventListener('click', e => this.handleClick(e));

    // 마우스 이동 시 뿅망치 따라다니기
    document.addEventListener('mousemove', e => this.moveBat(e));

    // 키보드 Enter 누르면 게임 시작
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter') this.startGame();
    });
  }

  public playBgm(path: string): void {
    if ((window as any).soundMuted) {
      console.log('음소거 상태 — BGM 재생 안 함');
      return;
    }

    if (this.bgm && !this.bgm.paused) return;

    this.bgm = new Audio(path);
    this.bgm.loop = true;
    this.bgm.volume = 0.1;
    this.bgm.play().catch(err => {
      console.warn('BGM 재생 실패:', err);
    });
  }

  public stopBgm(): void {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  // 뿅망치 따라다니는 위치 조정 (smash-hat.png 위치 설정)
  private moveBat(event: MouseEvent): void {
    const gameScreen = document.getElementById('gameScreen');
    const rect = gameScreen?.getBoundingClientRect();
    const offsetX = rect ? event.clientX - rect.left : event.clientX;
    const offsetY = rect ? event.clientY - rect.top : event.clientY;
    this.bat.style.left = `${offsetX - 122}px`; // 중심 보정
    this.bat.style.top = `${offsetY - 107}px`;
  }

  // 게임 시작 로직
  public startGame(): void {
    if (this.gameActive) return;

    this.gameActive = true;
    window.parent.postMessage({ type: 'STOP_BGM' }, '*');

    if (!(window as any).soundMuted) {
      this.playBgm('/sounds/smash-bgm.mp3');
    }
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

    // 게임 시작 시 뿅망치 보이기
    const bat = document.getElementById('bat');
    if (bat) bat.style.display = '';

    clearInterval(this.gameLoop);
    clearInterval(this.timerLoop);

    // 두더지 등장 주기
    this.gameLoop = setInterval(() => this.spawnMole(), 800);
    // 타이머 감소
    this.timerLoop = setInterval(() => this.countdown(), 1000);
  }

  // 타이머 감소 처리
  private countdown(): void {
    if (!this.gameActive) return;
    this.timeLeft--;
    this.updateTimer();
    if (this.timeLeft === 10) {
      clearInterval(this.gameLoop); // 기존 루프 제거
      this.gameLoop = setInterval(() => this.spawnMole(), 600); // 더 빠르게
    }

    if (this.timeLeft <= 0) {
      this.gameActive = false;
      clearInterval(this.gameLoop);
      clearInterval(this.timerLoop);

      this.stopBgm(); // 배경음 정지

      this.playEffect('/sounds/smash-the-end.mp3');

      this.show('gameOverPopup');
      document.getElementById('score-display')!.textContent = `${this.score}`;
    }
  }

  // 두더지 등장 (확률적으로 1번/2번 두더지)
  private spawnMole(): void {
    if (!this.gameActive) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const idx = Math.floor(Math.random() * 9);
    this.currentMoleIdx = idx;
    const type = Math.random() < 0.8 ? 0 : 1;
    const pos = this.molePositions[idx];
    this.ctx.drawImage(this.moleImages[type], pos.x, pos.y, 200, 200);
  }

  private playEffect(path: string): void {
    const effect = new Audio(path);
    effect.volume = 0.1;
    effect.play().catch(err => {
      console.warn('🔇 효과음 재생 실패:', err);
    });
  }

  // 두더지 맞췄는지 확인하고 점수 증가
  private handleClick(e: MouseEvent): void {
    if (!this.gameActive || this.currentMoleIdx === null) return;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pos = this.molePositions[this.currentMoleIdx];

    if (clickX >= pos.x && clickX <= pos.x + 200 && clickY >= pos.y && clickY <= pos.y + 200) {
      this.score += 10;
      this.updateScore();

      // 망치 애니메이션 추가
      this.bat.style.transition = 'transform 0.05s ease';
      this.bat.style.transform = 'rotate(-40deg) scale(0.95)';
      setTimeout(() => {
        this.bat.style.transform = 'rotate(0deg) scale(1)';
      }, 50);

      // 트윙클 효과 발생 위치
      this.spawnStarEffect(clickX - 40, clickY - 56);

      // 두더지 한번 이상 맞출시 점수 없음
      this.currentMoleIdx = null;
    }
  }

  // 두더지 맞췄을 때 트윙클 임팩트 애니메이션
  private spawnStarEffect(x: number, y: number): void {
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const angle = (2 * Math.PI * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const radius = 40 + Math.random() * 60;
      const scale = 1 + Math.random();
      const star = document.createElement('img');
      star.src = twinkleImg;
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

  // 닉네임 입력 후 점수 저장 → Firestore 저장 (5명까지)
  private async saveScore() {
    const name = (document.getElementById('playerName') as HTMLInputElement).value.trim().slice(0, 3);
    if (!/^([가-힣]{3}|[A-Z]{3})$/.test(name)) {
      alert('한글 또는 영문으로 3글자 입력 해주세요!');
      return;
    }

    try {
      await fireScore(name, this.score, 'mole-game'); // Firestore에 저장, 해당 파라미터로
      document.getElementById('savePopup')?.classList.add('hidden');
      this.gotoIntro();
      showToast('저장되었습니다!');
    } catch (err) {
      showToast('이미 존재하는 닉네임입니다.', false);
    }
  }
  // async api 저장 관련 코드
  private async renderScoreList() {
    const list = document.getElementById('scoreList')!;
    list.innerHTML = '';

    try {
      // firestore 접근, mole-game 값 가진 데이터들 중 상위 5개 가져옴
      const scores = await getTopScores('mole-game');

      scores.forEach((entry: any) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="name">${entry.nickname}</span><span class="score">${entry.score}</span>`;
        list.appendChild(li);
      });
    } catch (err) {
      list.innerHTML = '<li>점수 불러오기 실패</li>';
    }
  }

  // 화면 숨기기/보이기 공통 처리
  public hide(id: string): void {
    document.getElementById(id)?.classList.add('hidden');
  }

  public show(id: string): void {
    document.getElementById(id)?.classList.remove('hidden');
  }

  // 남은 시간 표시 및 경고 처리
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

  // 현재 점수 표시
  private updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `🏆 점수: ${this.score}`;
    }
  }

  // 저장 후 인트로 화면으로 복귀
  private gotoIntro(): void {
    this.stopBgm();
    this.hide('savePopup');
    this.hide('gameOverPopup');
    this.hide('scorePopup');
    this.hide('gameScreen');
    this.show('introScreen');
    window.parent.postMessage({ type: 'PLAY_MAIN_BGM' }, '*');

    // 인트로에서는 뿅망치 숨기기
    const bat = document.getElementById('bat');
    if (bat) bat.style.display = 'none';
  }
}

function showToast(message: string, _shouldReset: boolean = true) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden'); // 숨김 해제
  toast.classList.add('show'); // 표시

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden'); // 다시 숨김 처리
  }, 2000);
}

// DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const game = new MoleGame();
  const infoPopup = document.getElementById('infoPopup');

  // clickStart 버튼 클릭 시 팝업 띄우기 + 버튼 바인딩
  document.getElementById('clickStart')?.addEventListener('click', () => {
    window.parent.postMessage({ type: 'STOP_BGM' }, '*');
    game.hide('introScreen');
    game.show('gameScreen');
    infoPopup?.classList.remove('hidden');

    if (!(window as any).soundMuted) {
      game.playBgm('/sounds/smash-bgm.mp3');
    }

    setTimeout(() => {
      const bgmOffBtn = document.getElementById('bgmOffBtn');
      const bgmOnBtn = document.getElementById('bgmOnBtn');

      bgmOffBtn?.addEventListener('click', () => {
        (window as any).soundMuted = true;
        game.stopBgm();
      });

      bgmOnBtn?.addEventListener('click', () => {
        (window as any).soundMuted = false;
        game.playBgm('/sounds/smash-bgm.mp3');
      });
    }, 0);
  });

  // ESC 키로 팝업 닫기 + 게임 시작
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !infoPopup?.classList.contains('hidden')) {
      infoPopup?.classList.add('hidden');
      game.startGame();
    }
  });
});
