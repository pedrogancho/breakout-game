const GAME_LIVES = 3;

class GameObject {
  constructor(color) {
    this.color = color;
  }

  draw() {
    game.context.fillStyle = this.color;
  }
}

class Vec {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Rect extends GameObject {
  constructor(x, y, w, h, color) {
    super(color);
    this.pos = new Vec(x, y);
    this.size = new Vec(w, h);
  }

  get left() {
    return this.pos.x - this.size.x / 2;
  }

  get right() {
    return this.pos.x + this.size.x / 2;
  }

  get top() {
    return this.pos.y - this.size.y / 2;
  }

  get bottom() {
    return this.pos.y + this.size.y / 2;
  }

  draw() {
    super.draw();
    game.context.fillRect(this.left, this.top, this.size.x, this.size.y);
  }
}

class Circle extends GameObject {
  constructor(x, y, radius, color) {
    super(color);
    this.pos = new Vec(x, y);
    this.radius = radius;
  }

  draw() {
    super.draw();
    game.context.beginPath();
    game.context.arc(
      this.pos.x,
      this.pos.y,
      this.radius,
      0,
      Math.PI * 2,
      false
    );
    game.context.fill();
  }
}

class Ball extends Circle {
  constructor(x, y, radius, color, speed = 300) {
    super(x, y, radius, color);
    this.speed = speed;
    this.vel = new Vec();
  }
  update() {
    // Motion equation
    this.pos.x += this.vel.x * deltaTime;
    this.pos.y += this.vel.y * deltaTime;

    // good collistion
    this.collisionWalls();

    //bad collision
    this.collisionBottomWall();

    // Collision ball & player
    if (collisionCheckCircleRect(this, game.player)) {
      game.hitPlayer.play();  // sound
       
      // check where the collision took place at player bar
      let collidePoint =
        this.pos.x - (game.player.pos.x + game.player.pos.x / 2);

      // normalization
      collidePoint = collidePoint / (game.player.size.x / 2);

      let angleRad = collidePoint * (Math.PI / 4);

      this.vel.x = this.speed * Math.cos(angleRad);
      this.vel.y = this.speed * Math.sin(angleRad);

      // 5% increment per hit
      this.speed *= 1.05;
    }
  }

  collisionBottomWall() {
    if (this.pos.y + this.radius > game.canvas.height) {
      this.vel.y = -this.vel.y;
      game.lives -= 1;

      if (game.lives >= 1) {
        game.resetBall();
      }
    }
  }

  collisionWalls() {
    // left and right wall
    if (this.pos.x - this.radius < 0 ||
      this.pos.x + this.radius > game.canvas.width) {
      this.vel.x = -this.vel.x;
      game.ballhit.play();
    }
    // top wall
    if (this.pos.y - this.radius < 0) {
      this.vel.y = -this.vel.y;
      game.ballhit.play();
    }
  }
}

class Player extends Rect {
  constructor(x, y, w, h, color) {
    super(x, y, w, h, color);
    this.vel = new Vec();
  }

  init() {
    game.canvas.addEventListener("mousemove", (event) => {
      console.log( this.x, this.w)
        this.pos.x = event.offsetX;
      }
    );
  }
}

class Enemy extends Rect {
  constructor(x, y, w = 50, h = 10, color = "white") {
    super(x, y, w, h, color);
  }
}

class EnemyWeak extends Rect {
  constructor(x, y, w = 50, h = 10, color = "white") {
    super(x, y, w, h, color);
    this.hp = 1;
  }
}

class EnemyStrong extends Rect {
  constructor(x, y, w = 50, h = 10, color = "red") {
    super(x, y, w, h, color);
    this.hp = 2;
  }
}

let deltaTime = 0;
class Game {
  constructor(canvas, scoreEl, livesEl, endScreenEl, finalScoreEl) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game state logic
    this.gameStarted;
    this.gamePaused;
    this.gameOver;

    // Game stats
    this.score;
    this.lives;

    //HTML UI Elements
    this.scoreEl = scoreEl;
    this.livesEl = livesEl;
    this.endScreenEl = endScreenEl;
    this.finalScoreEl = finalScoreEl;

    this.gameLoops;

    // Audio
    this.ballhit = new Audio('./audio/ball-hit.wav')
    this.hitPlayer = new Audio('./audio/player-hit.wav')
    this.hitEnemy = new Audio('./audio/enemy-hit.wav')
    this.destroyStrong = new Audio('./audio/destroy-strong.wav')
  }

  init() {
    this.score = 0;
    this.lives = GAME_LIVES;

    this.gameLoops = 0;

    this.gameStarted = false;
    this.gamePaused = false;
    this.gameOver = false;

    // ball init
    this.ball = new Ball(
      this.canvas.width / 2,
      this.canvas.height / 2,
      5,
      "white"
    );

    // Random initial ball angle
    let angleRad = (Math.random() * Math.PI * 2) / 2;
    this.ball.vel.x = this.ball.speed * Math.cos(angleRad);
    this.ball.vel.y = this.ball.speed * Math.sin(angleRad);

    // init player
    this.player = new Player(
      this.canvas.width / 2,
      this.canvas.height - 30,
      100,
      20,
      "blue"
    );

    // array enemies
    this.enemies = [];

    this.spawnEnemies();

    this.player.init();
  }

  spawnEnemies() {
    if (this.gameLoops === 0) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const enemy = new EnemyWeak(60 * i + 50, 20 * j + 100);
          this.enemies.push(enemy);
        }
      }
    } else {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const enemy = new EnemyStrong(60 * i + 50, 20 * j + 100);
          this.enemies.push(enemy);
        }
      }
    }
  }

  resetBall() {
    this.ball.draw();

    this.ball.pos.x = this.canvas.width / 2;
    this.ball.pos.y = this.canvas.height / 2;

    this.ball.vel.x = 0;
    this.ball.vel.y = 0;

    this.ball.speed = 300;

    this.gamePaused = true;
  }

  goBall() {
    let angleRad = (Math.random() * Math.PI * 2) / 2;

    this.ball.vel.x = this.ball.speed * Math.cos(angleRad);
    this.ball.vel.y = this.ball.speed * Math.sin(angleRad);

    this.ball.speed = 300;
  }

  draw() {
    this.player.draw();
    this.ball.draw();
    this.enemies.forEach((e) => e.draw());
  }

  start() {
    let lastTime;
    const callback = (ms) => {
      if (lastTime) {
        deltaTime = (ms - lastTime) / 1000;
        this.update((ms - lastTime) / 1000);
      }
      lastTime = ms;

      if (this.gameOver) {
        return;
      }
      requestAnimationFrame(callback);
    };

    callback();
  }

  update() {
    // re-draw screen
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.player.draw();
    this.ball.draw();
    this.ball.update();

    this.enemies.forEach((e) => e.draw());
    // collision for each enemy
    this.enemies.forEach((e, index) => {
      if (collisionCheckCircleRect(this.ball, e)) {
        game.hitEnemy.play();
        this.ball.vel.y = -this.ball.vel.y;
        e.hp -= 1;

        // if enemy dies
        if (e.hp <= 0) {
          if (e instanceof EnemyWeak) {
            this.score += 10;
          }

          if (e instanceof EnemyStrong) {
            game.destroyStrong.play();
            this.score += 100;
          }
          
          // remove enemy from array
          this.enemies.splice(index, 1);
        } else {
          e.color = "yellow";
          e.draw();
        }
        
        // respawn enemies if all dead
        if (this.enemies.length === 0) {
          this.gameLoops += 1;
          this.spawnEnemies();
        }
      }
    });

    // game over logic
    if (this.lives <= 0) {
      this.finalScoreEl.innerHTML = this.score;
      this.endScreenEl.style.display = "block";
      this.gameOver = true;
    }

    //update UI elements
    this.scoreEl.innerHTML = this.score;
    this.livesEl.innerHTML = this.lives;
  }
}

// Game
const game = new Game(
  document.getElementById("game"),
  document.getElementById("scoreEl"),
  document.getElementById("livesEl"),
  document.getElementById("endScreenEl"),
  document.getElementById("finalScoreEl")
);
game.init();
game.draw();

game.canvas.addEventListener("click", (_) => {
  // start game
  if (!game.gameStarted) {
    game.start();
    game.gameStarted = true;
  }

  if (!game.gameOver && game.gameStarted && game.gamePaused) {
    game.goBall();
    game.gamePaused = false;
  }
});

document.getElementById("restartGameBtn").addEventListener("click", () => {
  game.init();
  game.draw();
  game.start();

  // Hide restart screen
  document.getElementById("endScreenEl").style.display = "none";
});

// Identify collision between circle and rectangle
function collisionCheckCircleRect(circle, rect) {
  var distx = Math.abs(circle.pos.x - rect.pos.x);
  var disty = Math.abs(circle.pos.y - rect.pos.y);

  if (distx > rect.size.x / 2 + circle.radius) {
    return false;
  }
  if (disty > rect.size.y / 2 + circle.radius) {
    return false;
  }

  if (distx <= rect.size.x / 2) {
    return true;
  }
  if (disty <= rect.size.y / 2) {
    return true;
  }

  var hypot =
    (distx - rect.size.x / 2) * (distx - rect.size.x / 2) +
    (disty - rect.size.y / 2) * (disty - rect.size.y / 2);

  return hypot <= circle.radius * circle.radius;
}
