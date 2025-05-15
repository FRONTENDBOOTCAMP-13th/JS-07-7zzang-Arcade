document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const cols = 17;
  const rows = 10;
  const numWidth = canvas.width / cols;
  const numHeight = canvas.height / rows;

  const currTimeBar = document.querySelector('.curr') as HTMLDivElement;
  const timeLimit = 10;
  let timeLeft = timeLimit;

  const tomatoImage = new Image();
  tomatoImage.src = '/src/assets/images/tomato-img/tomato-empty.png';

  // 랜덤 숫자 생성
  Promise.all([document.fonts.ready, new Promise(resolve => (tomatoImage.onload = resolve))]).then(() => {
    ctx.font = `${numHeight * 0.6}px DungGeunMo`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * numWidth;
        const y = row * numHeight;

        ctx.drawImage(tomatoImage, x, y, numWidth, numHeight);

        const randomNum = Math.floor(Math.random() * 9) + 1;
        const centerX = x + numWidth / 2;
        const centerY = y + numHeight / 1.85;

        ctx.fillText(randomNum.toString(), centerX, centerY);
      }
    }
  });

  // 시간 제한
  function startTimer() {
    const timer = setInterval(() => {
      timeLeft--;

      const per = (timeLeft / timeLimit) * 70;
      currTimeBar.style.height = `${per}%`;

      if (timeLeft <= 0) {
        clearInterval(timer);

        setTimeout(() => {
          currTimeBar.style.height = `0%`;
          gameOver();
        }, 1000);
      }
    }, 1000);
  }

  // 개임 오버
  function gameOver() {
    const gameOverScreen = document.querySelector('.gameover') as HTMLDivElement;
    if (gameOverScreen) {
      gameOverScreen.classList.add('show');
    }
  }

  // 점수확인
  const saveBtn = document.querySelector('.savebtn');
  const saveScore = document.querySelector('.savescore') as HTMLElement;

  let isVisible = false;

  saveBtn?.addEventListener('click', () => {
    saveToggle(saveScore);
  });

  function saveToggle(saveEl: HTMLElement) {
    if (!isVisible) {
      saveEl.classList.remove('hide');
      saveEl.classList.add('show');
    } else {
      saveEl.classList.remove('show');
      saveEl.classList.add('hide');
    }
    isVisible = !isVisible;
  }
  startTimer();
});
