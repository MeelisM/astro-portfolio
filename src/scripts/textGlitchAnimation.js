
if (typeof window !== "undefined") {
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("textGlitchCanvas");
    const ctx = canvas.getContext("2d");
  
    const fontSize = 16;
    let columns, rows;
    let grid = [];
    let dynamicValue = "VISITOR" // Will be API value
    const words = ["WELCOME", dynamicValue.toString()];
    let wordPositions = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
  
    let phase = "appearing-welcome";
    let letterIndex = 0;
    let animationStartTime = Date.now();
    let letterSpeed = 300;
    let wordStayDuration = 2000;
  
    function resizeCanvas() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      setupGrid();
    }
  
    function setupGrid() {
      columns = Math.floor(canvas.width / fontSize);
      rows = Math.floor(canvas.height / fontSize);
  
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => ({
          char: randomChar(),
          opacity: Math.random(),
        }))
      );
  
      randomizeWordPositions();
    }
  
    function drawAnimation() {
      ctx.fillStyle = "#121314";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
  
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          if (Math.random() > 0.99) {
            grid[y][x] = { char: randomChar(), opacity: Math.random() };
          }
          ctx.fillStyle = `rgba(28, 57, 142, ${grid[y][x].opacity})`;
          ctx.fillText(grid[y][x].char, x * fontSize + fontSize / 2, (y + 1) * fontSize);
        }
      }
  
      drawWords();
      requestAnimationFrame(drawAnimation);
    }
  
    function drawWords() {
      ctx.fillStyle = "#3c57a8";
  
      words.forEach((word, index) => {
        let { x, y } = wordPositions[index];
        let lettersToShow = "";
  
        if (phase === "appearing-welcome" && index === 0) {
          lettersToShow = word.slice(0, letterIndex);
        } else if (phase === "appearing-dynamic") {
          lettersToShow = words[0];
          if (index === 1) lettersToShow = word.slice(0, letterIndex);
        } else if (phase === "visible") {
          lettersToShow = word;
        } else if (phase === "disappearing-welcome") {
          if (index === 0) {
            lettersToShow = word.slice(0, letterIndex);
          } else {
            lettersToShow = words[1];
          }
        } else if (phase === "disappearing-dynamic") {
          if (index === 1) {
            lettersToShow = word.slice(0, letterIndex);
          }
        }
  
        for (let i = 0; i < lettersToShow.length; i++) {
          ctx.fillText(lettersToShow[i], (x + i) * fontSize + fontSize / 2, (y + 1) * fontSize);
        }
      });
    }
  
    function randomizeWordPositions() {
      let position1 = {
        x: Math.floor(Math.random() * (columns - words[0].length)),
        y: Math.floor(Math.random() * rows),
      };
  
      let position2;
      do {
        position2 = {
          x: Math.floor(Math.random() * (columns - words[1].length)),
          y: Math.floor(Math.random() * rows),
        };
      } while (
        position2.y === position1.y &&
        position2.x < position1.x + words[0].length &&
        position1.x < position2.x + words[1].length
      );
  
      wordPositions = [position1, position2];
    }
  
    function updateAnimation() {
      let elapsed = Date.now() - animationStartTime;
  
      if (phase === "appearing-welcome") {
        if (elapsed > letterSpeed && letterIndex < words[0].length) {
          letterIndex++;
          animationStartTime = Date.now();
        } else if (letterIndex >= words[0].length) {
          phase = "appearing-dynamic";
          letterIndex = 0;
          animationStartTime = Date.now();
        }
      } else if (phase === "appearing-dynamic") {
        if (elapsed > letterSpeed && letterIndex < words[1].length) {
          letterIndex++;
          animationStartTime = Date.now();
        } else if (letterIndex >= words[1].length) {
          phase = "visible";
          animationStartTime = Date.now();
        }
      } else if (phase === "visible") {
        if (elapsed > wordStayDuration) {
          phase = "disappearing-welcome";
          letterIndex = words[0].length;
          animationStartTime = Date.now();
        }
      } else if (phase === "disappearing-welcome") {
        if (elapsed > letterSpeed && letterIndex > 0) {
          letterIndex--;
          animationStartTime = Date.now();
        } else if (letterIndex === 0) {
          phase = "disappearing-dynamic";
          letterIndex = words[1].length;
          animationStartTime = Date.now();
        }
      } else if (phase === "disappearing-dynamic") {
        if (elapsed > letterSpeed && letterIndex > 0) {
          letterIndex--;
          animationStartTime = Date.now();
        } else if (letterIndex === 0) {
          phase = "hidden";
          animationStartTime = Date.now();
        }
      } else if (phase === "hidden") {
        if (elapsed > wordStayDuration) {
          phase = "appearing-welcome";
          letterIndex = 0;
          randomizeWordPositions();
          animationStartTime = Date.now();
        }
      }
    }
  
    function randomChar() {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      return characters[Math.floor(Math.random() * characters.length)];
    }
  
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(drawAnimation);
    setInterval(updateAnimation, 100);
  });
}