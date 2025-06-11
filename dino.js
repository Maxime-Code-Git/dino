/* =========================================================
   CONSTANTES & CANVAS
   ========================================================= */
const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");

const BASE_CANVAS_W = 600;      // largeur max « desktop »
const CANVAS_H = 200;
const GROUND_Y = 160;     // y du sol (là où posent les pieds)

/* Canvas responsive : on s’adapte à la taille de l’écran */
function resizeCanvas(){
  const w = Math.min(BASE_CANVAS_W, window.innerWidth * 0.9);
  cvs.width  = w;
  cvs.height = CANVAS_H;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* =========================================================
   ENTITÉS
   ========================================================= */
const dino = {
  x: 50,
  y: GROUND_Y - 40,      // 40 = hauteur du sprite
  w: 20,
  h: 40,
  vy: 0,
  jump(){
    if (state === 'PLAYING' && this.y >= GROUND_Y - this.h){
      this.vy = -12;      // impulsion (plus forte qu'avant)
    }
  }
};

const obstacles = [];
let spawnTimer   = 0;      // temps avant le prochain obstacle

/* =========================================================
   ÉTAT DU JEU
   ========================================================= */
let score = 0;
let scoreFrac = 0;
let hiScore = +localStorage.getItem("hi") || 0;
let speed = 6;           // vitesse de déplacement des obstacles

/* Boucle */
let last = 0, raf;
let state = 'MENU';        // MENU · PLAYING · PAUSED · GAMEOVER

/* =========================================================
   UI (DOM)
   ========================================================= */
const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const scoreTxt = document.getElementById("scoreTxt");
const hiTxt    = document.getElementById("hiTxt");
hiTxt.textContent = `(Hi ${hiScore})`;

btnStart.onclick = startGame;
btnPause.onclick = togglePause;

/* Contrôle clavier */
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); dino.jump(); }
  if (e.code === 'KeyR' && state === 'GAMEOVER') startGame();
});

/* =========================================================
   FONCTIONS DE CONTROLE
   ========================================================= */
function reset(){
  obstacles.length = 0;
  dino.y  = GROUND_Y - dino.h;
  dino.vy = 0;
  score   = 0;
  scoreFrac = 0;
  speed   = 6;
  spawnTimer = 0;
}

function startGame(){
  reset();
  state = 'PLAYING';
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function togglePause(){
  if (state === 'PLAYING'){
    state = 'PAUSED';
    cancelAnimationFrame(raf);
  } else if (state === 'PAUSED'){
    state = 'PLAYING';
    last = performance.now();
    loop();
  }
}

function gameOver(){
  state = 'GAMEOVER';
  cancelAnimationFrame(raf);
  if (score > hiScore){
    hiScore = score;
    localStorage.setItem('hi', hiScore);
  }
  hiTxt.textContent = `(Hi ${hiScore})`;
}

/* =========================================================
   LOGIQUE OBSTACLES
   ========================================================= */
function spawnObstacle(){
  const h = 20 + Math.random() * 20;   // hauteur : 20 → 40 px
  obstacles.push({
    x: cvs.width,
    y: GROUND_Y - h,
    w: 20,
    h
  });
}

/* =========================================================
   BOUCLE UPDATE + RENDER
   ========================================================= */
function update(dt){
  /* PHYSIQUE DINO */
  dino.vy += 0.6;          // gravité
  dino.y  += dino.vy;
  if (dino.y > GROUND_Y - dino.h){
    dino.y = GROUND_Y - dino.h;
    dino.vy = 0;
  }

  /* SPAWN OBSTACLE */
  spawnTimer -= dt;
  if (spawnTimer <= 0){
    spawnObstacle();
    /* Plus le jeu va vite, plus on spawn court */
    spawnTimer = 1.2 / Math.min(3, speed / 6);
  }

  /* UPDATE OBSTACLES */
  obstacles.forEach(o => o.x -= speed);
  if (obstacles[0] && obstacles[0].x < -30) obstacles.shift();

  /* DIFFICULTÉ PROGRESSIVE */
  if (score % 500 === 0 && score !== 0){
    speed = 6 + Math.floor(score / 500) * 0.8;
  }

  /* COLLISION (marge : -4 px) */
  for (let o of obstacles){
    if (dino.x < o.x + o.w &&
        dino.x + dino.w > o.x &&
        dino.y + dino.h - 4 > o.y){
      gameOver();
      break;
    }
  }

  /* SCORE */
  scoreFrac += Math.max(0, dt) * 10;
  const inc = Math.floor(scoreFrac);
  if (inc) {
    score     += inc;
    scoreFrac -= inc;
  }
  scoreTxt.textContent = `Score ${score}`;

}

function render(){
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  /* SOL */
  ctx.fillStyle = "#888";
  ctx.fillRect(0, GROUND_Y, cvs.width, 4);

  /* DINO */
  ctx.fillStyle = "#0cf";
  ctx.fillRect(dino.x, dino.y, dino.w, dino.h);

  /* OBSTACLES */
  ctx.fillStyle = "#f55";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  /* GAME OVER TEXTE */
  if (state === 'GAMEOVER'){
    ctx.fillStyle = "#fff";
    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`GAME OVER | Score ${score}`, cvs.width / 2, cvs.height / 2);
    ctx.fillText("Press R to Restart", cvs.width / 2, cvs.height / 2 + 24);
  }
}

function loop(t = 0){
  if (state !== 'PLAYING') return;
  const dt = (t - last) / 1000;
  last = t;

  update(dt);
  render();
  raf = requestAnimationFrame(loop);
}

/* Rendu du menu initial */
render();
