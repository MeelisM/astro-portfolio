export function TextGlitchAnimation() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  ("use strict");

  const canvas = document.getElementById("textGlitchCanvas");
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Unable to get 2D rendering context");
    return;
  }

  const fontSize = 16;
  let columns, rows;
  let grid = [];
  let dynamicValue = "VISITOR"; // Will be API value
  const words = ["WELCOME", dynamicValue.toString()];
  let wordPositions = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];

  let phase = "appearing-welcome";
  let letterIndex = 0;
  let animationStartTime = Date.now();
  const letterSpeed = 300;
  const wordStayDuration = 2000;

  const characterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*".split("");

  function randomChar() {
    return characterSet[Math.floor(Math.random() * characterSet.length)];
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    columns = Math.floor(canvas.width / fontSize);
    rows = Math.floor(canvas.height / fontSize);

    grid = grid.length === 0 ? setupGrid() : maintainGrid();

    applyWordPositions();
  }

  function maintainGrid() {
    return Array.from({ length: rows }, (_, y) =>
      Array.from({ length: columns }, (_, x) =>
        grid[y] && grid[y][x] ? grid[y][x] : { char: randomChar(), opacity: Math.random() }
      )
    );
  }

  function setupGrid() {
    const newGrid = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ({
        char: randomChar(),
        opacity: Math.random(),
      }))
    );

    if (wordPositions[0].x === 0 && wordPositions[0].y === 0) {
      randomizeWordPositions();
    }

    return newGrid;
  }

  function applyWordPositions() {
    wordPositions = wordPositions.map(({ x, y }, index) => ({
      x: Math.min(x, columns - words[index].length),
      y: Math.min(y, rows - 1),
    }));
  }

  function drawAnimation() {
    ctx.fillStyle = "#121314";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (Math.random() > 0.995) {
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
      let lettersToShow = getLettersToShow(word, index);

      for (let i = 0; i < lettersToShow.length; i++) {
        ctx.fillText(lettersToShow[i], (x + i) * fontSize + fontSize / 2, (y + 1) * fontSize);
      }
    });
  }

  function getLettersToShow(word, index) {
    switch (phase) {
      case "appearing-welcome":
        return index === 0 ? word.slice(0, letterIndex) : "";
      case "appearing-dynamic":
        return index === 0 ? words[0] : word.slice(0, letterIndex);
      case "visible":
        return word;
      case "disappearing-welcome":
        return index === 0 ? word.slice(0, letterIndex) : words[1];
      case "disappearing-dynamic":
        return index === 1 ? word.slice(0, letterIndex) : "";
      default:
        return "";
    }
  }

  function randomizeWordPositions() {
    const position1 = {
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
    const elapsed = Date.now() - animationStartTime;

    switch (phase) {
      case "appearing-welcome":
        if (elapsed > letterSpeed && letterIndex < words[0].length) {
          letterIndex++;
          animationStartTime = Date.now();
        } else if (letterIndex >= words[0].length) {
          phase = "appearing-dynamic";
          letterIndex = 0;
          animationStartTime = Date.now();
        }
        break;
      case "appearing-dynamic":
        if (elapsed > letterSpeed && letterIndex < words[1].length) {
          letterIndex++;
          animationStartTime = Date.now();
        } else if (letterIndex >= words[1].length) {
          phase = "visible";
          animationStartTime = Date.now();
        }
        break;
      case "visible":
        if (elapsed > wordStayDuration) {
          phase = "disappearing-welcome";
          letterIndex = words[0].length;
          animationStartTime = Date.now();
        }
        break;
      case "disappearing-welcome":
        if (elapsed > letterSpeed && letterIndex > 0) {
          letterIndex--;
          animationStartTime = Date.now();
        } else if (letterIndex === 0) {
          phase = "disappearing-dynamic";
          letterIndex = words[1].length;
          animationStartTime = Date.now();
        }
        break;
      case "disappearing-dynamic":
        if (elapsed > letterSpeed && letterIndex > 0) {
          letterIndex--;
          animationStartTime = Date.now();
        } else if (letterIndex === 0) {
          phase = "hidden";
          animationStartTime = Date.now();
        }
        break;
      case "hidden":
        if (elapsed > wordStayDuration) {
          phase = "appearing-welcome";
          letterIndex = 0;
          randomizeWordPositions();
          animationStartTime = Date.now();
        }
        break;
    }
  }

  function cleanup() {
    window.removeEventListener("resize", resizeCanvas);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  requestAnimationFrame(drawAnimation);

  function animationLoop() {
    updateAnimation();
    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  return cleanup;
}
