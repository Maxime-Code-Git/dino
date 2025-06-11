const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
let raf, running = false;

const dino = {x:50, y:150, w:20, h:40, vy:0, jump(){if(this.y>=150)this.vy=-12;}};
const obstacles = [];
let frame = 0, score = 0;

function reset(){
  obstacles.length=0;
  dino.y = 150; dino.vy = 0; frame = 0; score = 0;
}

function spawnObs(){
  const h = 20 + Math.random()*30;
  obstacles.push({x:600, y:170-h, w:20, h});
}

function update(){
  frame++; score++;
  // Dino physics
  dino.vy += 0.6; dino.y += dino.vy;
  if(dino.y>150){dino.y=150; dino.vy=0;}

  // Obstacles
  if(frame%90===0) spawnObs();
  obstacles.forEach(o=>o.x-=6);
  if(obstacles[0] && obstacles[0].x<-30) obstacles.shift();

  // Collision
  for(let o of obstacles){
    if(dino.x<o.x+o.w && dino.x+dino.w>o.x &&
       dino.y<o.y+o.h && dino.y+dino.h>o.y){
        gameOver(); return;
    }
  }
}

function render(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  // Ground
  ctx.fillStyle="#888"; ctx.fillRect(0,170,600,4);
  // Dino
  ctx.fillStyle="#0cf"; ctx.fillRect(dino.x,dino.y,dino.w,dino.h);
  // Obstacles
  ctx.fillStyle="#f55";
  obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
  // Score
  ctx.fillStyle="#fff"; ctx.fillText("Score: "+score,480,20);
}

function loop(){
  update(); render();
  if(running) raf = requestAnimationFrame(loop);
}

function startGame(){running=false; cancelAnimationFrame(raf); reset(); running=true; loop();}
function pauseGame(){running=!running; if(running) loop(); else cancelAnimationFrame(raf);}
function gameOver(){running=false; cancelAnimationFrame(raf); alert("Game Over! Score: "+score);}

document.addEventListener("keydown",e=>{if(e.code==="Space") dino.jump();});
