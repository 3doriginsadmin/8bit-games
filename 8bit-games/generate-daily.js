// generate-daily.js (free version – no API needed)
const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, 'games');
if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR, { recursive: true });

// Game mechanics
const mechanics = [
  {
    name: 'tap-enemy',
    desc: 'Tap the enemies before they escape!',
    emoji: '👾',
    start: `gameData.enemies=[];gameData.killed=0;gameData.spawnTimer=0;`,
    update: `d.spawnTimer++;let lim=Math.max(15,40-Math.min(gameTime*0.3,30));if(d.spawnTimer>lim){d.spawnTimer=0;d.enemies.push({x:Math.random()*W,y:-20,vy:1+Math.random()*2,alive:true,r:12+Math.random()*8});}
d.enemies.forEach(e=>{if(e.alive){e.y+=e.vy;if(e.y>H+20){e.alive=false;loseLife();}}});
clks.forEach(c=>{d.enemies.forEach(e=>{if(e.alive&&Math.hypot(c.x-e.x,c.y-e.y)<e.r+5){e.alive=false;d.killed++;addScore(1);if(d.killed>=15)endGame(true);}})});
d.enemies=d.enemies.filter(e=>e.alive||e.y<H+30);`,
    draw: `ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,W,H);
d.enemies.forEach(e=>{if(e.alive){ctx.fillStyle='#ff3b3b';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();}});
ctx.fillStyle='#fff';ctx.font='bold 14px "Courier New"';ctx.fillText('Killed: '+d.killed+'/15',15,25);`
  },
  {
    name: 'catch-falling',
    desc: 'Catch the falling items!',
    emoji: '🍎',
    start: `gameData.items=[];gameData.caught=0;`,
    update: `if(Math.random()<0.04)d.items.push({x:Math.random()*W,y:-10,vy:2+Math.random()*2,good:Math.random()>0.3,r:12,caught:false});
d.items.forEach(it=>{if(!it.caught){it.y+=it.vy;if(it.y>H+20){it.caught=true;if(it.good)loseLife();}}});
clks.forEach(c=>{d.items.forEach(it=>{if(!it.caught&&Math.hypot(c.x-it.x,c.y-it.y)<it.r+5){it.caught=true;if(it.good){d.caught++;addScore(1);if(d.caught>=15)endGame(true);}else{loseLife();}}}});
d.items=d.items.filter(it=>!it.caught||it.y<H+30);`,
    draw: `ctx.fillStyle='#2a1a3a';ctx.fillRect(0,0,W,H);
d.items.forEach(it=>{if(!it.caught){ctx.fillStyle=it.good?'#3bd96b':'#ff3b3b';ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,Math.PI*2);ctx.fill();}});
ctx.fillStyle='#fff';ctx.font='bold 14px "Courier New"';ctx.fillText('Caught: '+d.caught+'/15',15,25);`
  },
  {
    name: 'dodge-blocks',
    desc: 'Drag the player to dodge blocks!',
    emoji: '🏃',
    start: `gameData.player={x:190,y:350,r:14};gameData.blocks=[];gameData.survived=0;`,
    update: `if(touchActive){let nx=mx,ny=my;if(nx>14&&nx<W-14&&ny>14&&ny<H-14){gameData.player.x=nx;gameData.player.y=ny;}}
if(Math.random()<0.04)gameData.blocks.push({x:Math.random()*W,y:-20,vy:2+Math.random()*2,size:20+Math.random()*20,alive:true});
gameData.blocks.forEach(b=>{if(b.alive){b.y+=b.vy;if(b.y>H+30){b.alive=false;gameData.survived++;addScore(1);if(gameData.survived>=15)endGame(true);}}});
gameData.blocks.forEach(b=>{if(b.alive&&Math.hypot(gameData.player.x-b.x,gameData.player.y-b.y)<gameData.player.r+b.size/2){loseLife();gameData.blocks=[];}});
gameData.blocks=gameData.blocks.filter(b=>b.alive||b.y<H+40);`,
    draw: `ctx.fillStyle='#1a1a3a';ctx.fillRect(0,0,W,H);
ctx.fillStyle='#00d4ff';ctx.beginPath();ctx.arc(gameData.player.x,gameData.player.y,gameData.player.r,0,Math.PI*2);ctx.fill();
gameData.blocks.forEach(b=>{if(b.alive){ctx.fillStyle='#ff3b3b';ctx.fillRect(b.x-b.size/2,b.y-b.size/2,b.size,b.size);}});
ctx.fillStyle='#fff';ctx.font='bold 14px "Courier New"';ctx.fillText('Survived: '+gameData.survived+'/15',15,25);`
  }
];

// Themes (colors & style)
const themes = [
  { name:'Space', bgColor:'#0a0a2e', accentColor:'#f0c040', emoji:'🚀', canvasBg:'#0a0a2e', fontColor:'#f0c040' },
  { name:'Jungle', bgColor:'#0a3a0a', accentColor:'#7fff00', emoji:'🌴', canvasBg:'#0a3a0a', fontColor:'#7fff00' },
  { name:'Underwater', bgColor:'#003366', accentColor:'#00d4ff', emoji:'🐠', canvasBg:'#003366', fontColor:'#00d4ff' },
  { name:'Desert', bgColor:'#8b4513', accentColor:'#ff8c42', emoji:'🏜️', canvasBg:'#8b4513', fontColor:'#ff8c42' }
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateGame() {
  const mechanic = pickRandom(mechanics);
  const theme = pickRandom(themes);
  const title = `${theme.name} ${mechanic.name.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}`;
  const filename = `game-${Date.now()}.html`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover"><title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;touch-action:manipulation}
body{background:#0a0a14;font-family:'Courier New',monospace;display:flex;justify-content:center;align-items:center;min-height:100vh}
.game-container{background:#111128;border:4px solid ${theme.accentColor};border-radius:12px;padding:10px;text-align:center;max-width:420px;position:relative}
.logo{font-size:3rem}h1{color:${theme.accentColor};font-size:1.5rem;margin:5px 0;text-shadow:2px 2px 0 #000}
.desc{color:#ccc;font-size:0.9rem;margin-bottom:8px}
canvas{border:2px solid ${theme.accentColor};image-rendering:pixelated;background:${theme.canvasBg};display:block;margin:0 auto}
.info-bar{display:flex;gap:10px;justify-content:center;margin:8px 0;color:#fff;font-size:13px}
.info-bar span{background:#1a1a35;padding:3px 8px;border-radius:4px}
.controls{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
button,.btn{font-family:'Courier New',monospace;font-weight:bold;font-size:14px;padding:10px 16px;border:3px solid #555;border-radius:6px;cursor:pointer;background:#2a2a45;color:#fff;min-width:44px;min-height:44px;box-shadow:0 3px 0 #1a1a2e;transition:0.08s}
button:active{transform:translateY(2px);box-shadow:0 1px 0 #1a1a2e;border-color:${theme.accentColor}}
.btn-red{background:#cc2a2a;border-color:#ff5555}.btn-green{background:#2a7a2a;border-color:#55ff55}.btn-blue{background:#2a3a8a;border-color:#5588ff}.btn-yellow{background:#8a7a2a;border-color:#ffcc44;color:#000}.btn-pink{background:#8a2a5a;border-color:#ff66aa}.btn-purple{background:#5a2a8a;border-color:#b44dff}
.back-link{display:inline-block;margin-top:8px;color:${theme.accentColor};font-size:13px;text-decoration:none}
.start-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);z-index:5}
.start-overlay button{font-size:24px;padding:16px 32px;background:${theme.accentColor};color:#000;border-color:#fff}
</style></head>
<body>
<div class="game-container">
  <div class="logo">${mechanic.emoji}</div><h1>${title}</h1><p class="desc">${mechanic.desc}</p>
  <canvas id="gc" width="380" height="380"></canvas>
  <div class="info-bar"><span>⭐ Score: <span id="score">0</span></span><span>❤️ Lives: <span id="lives">3</span></span><span>⏱ <span id="timer">0</span>s</span></div>
  <div class="controls" id="controls"><button class="btn-green" onclick="restartGame()">🔄 New</button></div>
  <a class="back-link" href="../index.html">← Back to All Games</a>
  <div class="start-overlay" id="startOverlay"><button id="startBtn">▶ START</button></div>
</div>
<script>
const canvas=document.getElementById('gc'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const W=380,H=380;let score=0,lives=3,gameTime=0,gameRunning=false,awaitingStart=true;let gameData={};let timerInterval,clicks=[],touchActive=false,mouseX=W/2,mouseY=H/2;
let audioCtx;function initAudio(){if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume()}
function beep(f=440,d=0.1,t='square',v=0.08){if(!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.setValueAtTime(f,audioCtx.currentTime);g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(e){}}
function sfxScore(){beep(880,0.08);beep(1100,0.1)}function sfxFail(){beep(150,0.2,'sawtooth')}function sfxWin(){beep(523,0.08);beep(659,0.08);beep(784,0.12)}function sfxPop(){beep(300,0.05)}
function addScore(n=1){score+=n;sfxScore();updateUI()}function loseLife(){lives--;sfxFail();updateUI();if(lives<=0)endGame()}
function updateUI(){document.getElementById('score').textContent=score;document.getElementById('lives').textContent=lives;document.getElementById('timer').textContent=gameTime}
function resetState(){score=0;lives=3;gameTime=0;gameData={};clicks=[];if(timerInterval)clearInterval(timerInterval);updateUI()}
function startTimer(){if(timerInterval)clearInterval(timerInterval);gameTime=0;updateUI();timerInterval=setInterval(()=>{gameTime++;updateUI()},1000)}
function endGame(won=false){gameRunning=false;if(timerInterval)clearInterval(timerInterval);if(won)sfxWin();document.getElementById('controls').innerHTML='<button class="btn-green" onclick="restartGame()">🔄 Play Again</button><a class="back-link" href="../index.html">← Menu</a>';document.getElementById('startOverlay').style.display='none'}
function restartGame(){resetState();start();gameRunning=false;awaitingStart=true;document.getElementById('startOverlay').style.display='flex';document.getElementById('controls').innerHTML='<button class="btn-green" onclick="restartGame()">🔄 New</button>';updateUI()}
document.getElementById('startBtn').addEventListener('click',()=>{if(awaitingStart){awaitingStart=false;gameRunning=true;startTimer();document.getElementById('startOverlay').style.display='none'}});
function getPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)}}
canvas.addEventListener('mousedown',e=>{initAudio();const p=getPos(e);mouseX=p.x;mouseY=p.y;touchActive=true;clicks.push({x:p.x,y:p.y,type:'down'})});
canvas.addEventListener('mousemove',e=>{const p=getPos(e);mouseX=p.x;mouseY=p.y});
canvas.addEventListener('mouseup',()=>{touchActive=false});canvas.addEventListener('mouseleave',()=>{touchActive=false});
canvas.addEventListener('touchstart',e=>{e.preventDefault();initAudio();const p=getPos(e.touches[0]);mouseX=p.x;mouseY=p.y;touchActive=true;clicks.push({x:p.x,y:p.y,type:'down'})},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();const p=getPos(e.touches[0]);mouseX=p.x;mouseY=p.y},{passive:false});
canvas.addEventListener('touchend',()=>{touchActive=false});

function start(){ ${mechanic.start} }
function update(d,W,H,mx,my,clks){ ${mechanic.update} }
function draw(ctx,W,H,d){ ${mechanic.draw} }

function gameLoop(){if(!gameRunning||awaitingStart){draw(ctx,W,H,gameData);requestAnimationFrame(gameLoop);return}update(gameData,W,H,mouseX,mouseY,clicks);ctx.clearRect(0,0,W,H);draw(ctx,W,H,gameData);clicks=[];requestAnimationFrame(gameLoop)}
start();gameLoop();
<\/script></body></html>`;

  return { filename, html };
}

async function run() {
  try {
    const { filename, html } = generateGame();
    fs.writeFileSync(path.join(GAMES_DIR, filename), html);
    console.log(`Created ${filename}`);
  } catch (err) {
    console.error('Error generating game:', err);
    process.exit(1);
  }
}

run();