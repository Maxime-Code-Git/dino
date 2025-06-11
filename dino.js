/* ===== CANVAS & CONTEXT ===== */
const cvs  = document.getElementById("game");
const ctx  = cvs.getContext("2d");

/* Responsive canvas */
function resizeCanvas(){
  const w = Math.min(600, window.innerWidth*0.9);
  cvs.width  = w;
  cvs.height = 200;
}
resizeCanvas(); window.addEventListener("resize", resizeCanvas);

/* ===== GAME ENTITIES ===== */
const dino = {x:50,y:150,w:20,h:40,vy:0,
  jump(){ if(state==='PLAYING' && this.y>=150){ this.vy=-16; } }
};

const obstacles = [];
let spawnTimer = 0;

/* ===== GAME VARIABLES ===== */
let score=0, hiScore = +localStorage.getItem("hi")||0;
let speed = 6;                 // base obstacle speed
let delta=0, last=0;
let state = 'MENU';            // MENU, PLAYING, PAUSED, GAMEOVER
let raf;

/* ===== HTML UI ===== */
const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const scoreTxt = document.getElementById("scoreTxt");
const hiTxt    = document.getElementById("hiTxt");
hiTxt.textContent = `(Hi ${hiScore})`;

btnStart.onclick = startGame;
btnPause.onclick = togglePause;

document.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault(); dino.jump();}
  if(e.code==='KeyR' && state==='GAMEOVER') startGame();
});

/* ===== CORE FUNCTIONS ===== */
function reset(){
  obstacles.length=0;
  dino.y=150; dino.vy=0;
  score=0; speed=6; spawnTimer=0;
}

function startGame(){
  reset();
  state='PLAYING';
  cancelAnimationFrame(raf);
  last = performance.now();
  loop();
}

function togglePause(){
  if(state==='PLAYING'){ state='PAUSED'; }
  else if(state==='PAUSED'){ state='PLAYING'; last=performance.now(); loop();}
}

function gameOver(){
  state='GAMEOVER';
  cancelAnimationFrame(raf);
  if(score>hiScore){hiScore=score; localStorage.setItem("hi",hiScore);}
  hiTxt.textContent=`(Hi ${hiScore})`;
}

function spawnObstacle(){
  const h = 20+Math.random()*30;
  obstacles.push({x:cvs.width, y:170-h, w:20, h});
}

function update(dt){
  /* Dino physics */
  dino.vy += 0.6;
  dino.y  += dino.vy;
  if(dino.y>150){dino.y=150; dino.vy=0;}

  /* Obstacle spawning */
  spawnTimer -= dt;
  if(spawnTimer<=0){
    spawnObstacle();
    spawnTimer = 1.2/Math.min(3, speed/6); // spawn faster as speed grows
  }

  /* Obstacles update */
  obstacles.forEach(o => o.x -= speed);
  if(obstacles[0] && obstacles[0].x < -30) obstacles.shift();

  /* Increase difficulty every 500 pts */
  if(score % 500 === 0 && score!==0) speed = 6 + Math.floor(score/500)*0.8;

  /* Collision check */
  for(let o of obstacles){
    if(dino.x < o.x+o.w && dino.x+dino.w > o.x &&
       dino.y < o.y+o.h && dino.y+dino.h > o.y){
      gameOver();
      break;
    }
  }

  score += Math.floor(dt*100);
  scoreTxt.textContent = `Score ${score}`;
}

/* ===== RENDER ===== */
function render(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  /* Ground */
  ctx.fillStyle="#888"; ctx.fillRect(0,170,cvs.width,4);
  /* Dino */
  ctx.fillStyle="#0cf"; ctx.fillRect(dino.x,dino.y,dino.w,dino.h);
  /* Obstacles */
  ctx.fillStyle="#f55";
  obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
  /* Game over text */
  if(state==='GAMEOVER'){
    ctx.fillStyle="#fff";
    ctx.font="20px monospace";
    ctx.textAlign='center';
    ctx.fillText(`GAME OVER  |  Score ${score}`, cvs.width/2, cvs.height/2);
    ctx.fillText('Press R to Restart', cvs.width/2, cvs.height/2+24);
  }
}

/* ===== MAIN LOOP ===== */
function loop(t=0){
  if(state!=='PLAYING'){ return; }
  delta = (t - last)/1000; last=t;
  update(delta);
  render();
  raf = requestAnimationFrame(loop);
}

/* ===== INITIAL MENU RENDER ===== */
render();
