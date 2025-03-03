export function initTextGlitchAnimation(canvasId: string) {
  if (typeof document === "undefined") return;

  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    const container = canvas?.parentElement;

    if (!canvas || !container) {
      console.error("Canvas or container not found.");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context.");
      return;
    }

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      setupAnimation();
    };

    let fontSize = 12;
    let columns = 0;
    let rows = 0;
    let grid: { char: string; opacity: number }[][] = [];

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

    function setupAnimation() {
      if (!canvas || !ctx) return;
      const remainingSpace = canvas.width % fontSize;
      columns = Math.floor(canvas.width / fontSize) + (remainingSpace > fontSize / 2 ? 1 : 0);
      rows = Math.floor(canvas.height / fontSize);

      grid = Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => ({
          char: characters[Math.floor(Math.random() * characters.length)],
          opacity: Math.random(),
        }))
      );
    }

    function drawAnimation() {
      if (!canvas || !ctx) return;

      ctx.fillStyle = "#121314";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          if (Math.random() > 0.98) {
            grid[y][x] = {
              char: characters[Math.floor(Math.random() * characters.length)],
              opacity: Math.random(),
            };
          }

          ctx.fillStyle = `rgba(28, 57, 142, ${grid[y][x].opacity})`;
          ctx.fillText(grid[y][x].char, x * fontSize + fontSize / 2, (y + 1) * fontSize);        }
      }

      requestAnimationFrame(drawAnimation);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(drawAnimation);
  });
}
