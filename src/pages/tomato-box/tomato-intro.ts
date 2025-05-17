window.addEventListener('DOMContentLoaded', () => {
  const trophyBtn = document.querySelector('.trophy');
  const bestScore = document.querySelector('.bestscore') as HTMLElement;
  const startBtn = document.querySelector('.start') as HTMLElement;

  let isVisible = false;

  trophyBtn?.addEventListener('click', () => {
    ScoreToggle(bestScore);
  });

  startBtn?.addEventListener('click', () => {
    window.location.href = '/src/pages/tomato-box/tomato-play.html';
  });

  function ScoreToggle(scoreEl: HTMLElement) {
    if (!isVisible) {
      scoreEl.classList.remove('hide');
      scoreEl.classList.add('show');
    } else {
      scoreEl.classList.remove('show');
      scoreEl.classList.add('hide');
    }
    isVisible = !isVisible;
  }
});
