let lastApiCall = 0;
const apiThrottleTime = 5000; // 5 seconds throttle

async function fetchVisitorCount() {
  const now = Date.now();
  const lastCount = localStorage.getItem("visitorCount") || "VISITOR";

  if (now - lastApiCall < apiThrottleTime) {
    console.warn("Throttled API request! Using cached value.");
    return lastCount;
  }
  lastApiCall = now;

  try {
    const response = await fetch("/api/count", { cache: "no-store" });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Too Many Requests! Using last known count.");
        return lastCount;
      }
      throw new Error("HTTP error!");
    }

    const data = await response.json();

    if (typeof data.visitors !== "number") {
      console.warn("Invalid visitor count received, using last known count.");
      return lastCount;
    }

    localStorage.setItem("visitorCount", data.visitors.toString());
    return data.visitors.toString();
  } catch (error) {
    console.error("Error fetching visitor count");
    return lastCount;
  }
}

export async function TextGlitchAnimation() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  ("use strict");

  const visitorCount = await fetchVisitorCount();

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
  let dynamicValue = "#" + visitorCount;
  const words = ["WELCOME", dynamicValue];

  let wordPositions = words.map(() => ({ x: 0, y: 0 }));

  let currentWordIndex = 0;
  let phase = "appearing";
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
      const { x, y } = wordPositions[index];
      let lettersToShow = getLettersToShow(word, index);

      for (let i = 0; i < lettersToShow.length; i++) {
        ctx.fillText(lettersToShow[i], (x + i) * fontSize + fontSize / 2, (y + 1) * fontSize);
      }
    });
  }

  function getLettersToShow(word, index) {
    switch (phase) {
      case "appearing":
        if (index < currentWordIndex) {
          return word;
        } else if (index === currentWordIndex) {
          return word.slice(0, letterIndex);
        } else {
          return "";
        }

      case "visible":
        return index <= currentWordIndex ? word : "";

      case "disappearing":
        if (index > currentWordIndex) {
          return "";
        } else if (index === currentWordIndex) {
          return word.slice(0, letterIndex);
        } else {
          return word;
        }

      case "hidden":
        return "";

      default:
        return "";
    }
  }

  function randomizeWordPositions() {
    let usedPositions = [];

    wordPositions = words.map((word) => {
      let position;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        position = {
          x: Math.floor(Math.random() * (columns - word.length)),
          y: Math.floor(Math.random() * rows),
        };

        attempts++;

        const overlaps = usedPositions.some(
          (usedPos) =>
            position.y === usedPos.y &&
            position.x < usedPos.x + words[usedPositions.indexOf(usedPos)].length &&
            usedPos.x < position.x + word.length
        );

        if (!overlaps || attempts >= maxAttempts) break;
      } while (true);

      usedPositions.push(position);
      return position;
    });
  }

  function updateAnimation() {
    const elapsed = Date.now() - animationStartTime;

    switch (phase) {
      case "appearing":
        if (elapsed > letterSpeed && letterIndex < words[currentWordIndex].length) {
          letterIndex++;
          animationStartTime = Date.now();
        } else if (letterIndex >= words[currentWordIndex].length) {
          if (currentWordIndex < words.length - 1) {
            currentWordIndex++;
            letterIndex = 0;
            animationStartTime = Date.now();
          } else {
            phase = "visible";
            animationStartTime = Date.now();
          }
        }
        break;

      case "visible":
        if (elapsed > wordStayDuration) {
          phase = "disappearing";
          currentWordIndex = words.length - 1;
          letterIndex = words[currentWordIndex].length;
          animationStartTime = Date.now();
        }
        break;

      case "disappearing":
        if (elapsed > letterSpeed && letterIndex > 0) {
          letterIndex--;
          animationStartTime = Date.now();
        } else if (letterIndex === 0) {
          if (currentWordIndex > 0) {
            currentWordIndex--;
            letterIndex = words[currentWordIndex].length;
            animationStartTime = Date.now();
          } else {
            phase = "hidden";
            animationStartTime = Date.now();
          }
        }
        break;

      case "hidden":
        if (elapsed > wordStayDuration) {
          phase = "appearing";
          currentWordIndex = 0;
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

TextGlitchAnimation();
