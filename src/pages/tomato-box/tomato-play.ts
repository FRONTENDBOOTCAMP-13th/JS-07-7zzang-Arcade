document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const cols = 17;
  const rows = 10;
  const numWidth = canvas.width / cols;
  const numHeight = canvas.height / rows;

  const tomatoImage = new Image();
  tomatoImage.src = '/src/assets/images/tomato-img/tomato-empty.png';

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
});
