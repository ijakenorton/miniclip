const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const height = canvas.height;
const width = canvas.width;

const EPSILON = 0.000001;

let prevTimestamp = 0;
let deltaTime = 0;

const SEGMENTSIZE = 30;

const FOODCOLOUR = "#EF798A";
const TEXTCOLOUR = "#4F646F";
const PLAYER1COLOUR = "#86BBD8";
const PLAYER2COLOUR = "#BFFFBC";
const BGCOLOUR = "#120D31";

let movementTimer = 0;
let movementUpdateCap = 0.1; // in s
let collisionEnableTimer = 3;

let foodSpawnCap = 3.0;
let foodTimer = 0;

const state = {
  paused: false,
  foods: [],
};

const DEBUFFS = {
  NONE: 0,
  CONFUSE: 1,
  STUN: 2
}

class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = SEGMENTSIZE;
    this.height = SEGMENTSIZE;
    this.updateHitbox();
  }

  updateHitbox() {
    this.hitbox = findHitbox(this.x, this.y, this.width, this.height);
  }

  draw() {
    ctx.fillStyle = FOODCOLOUR;
    ctx.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
  }
}

class SnakePlayer {
  constructor(colour, startX, startY, startDirection, length) {
    this.length = length;
    this.segments = [];

    this.colour = colour;
    this.nextDirection = startDirection;

    let previousSegment = null;

    this.currentDebuff = DEBUFFS.NONE;
    this.debuffCounter = 0;

    for (let i = 0; i < this.length; i++) {
      let newSegment = new Segment(
        startX,
        startY,
        startDirection,
        previousSegment
      );
      this.segments.push(newSegment);
      previousSegment = newSegment;
    }
  }

  draw() {
    ctx.fillStyle = this.colour;

    this.segments.forEach((segment) => {
      ctx.fillRect(segment.hitbox.x, segment.hitbox.y, segment.hitbox.width, segment.hitbox.height);
    });
  }

  setNextDirection(dir) {
    if (this.currentDebuff === DEBUFFS.STUN) return;

    const effective = (this.currentDebuff === DEBUFFS.CONFUSE) ? invertDir(dir) : dir;

    const headDir = this.segments[0].currentDirection;
    if (isOpposite(effective, headDir)) return; //block 180

    this.nextDirection = effective;
  }

  move() {
    if (this.debuffCounter > 0) {
      this.debuffCounter -= 1;
      if (this.debuffCounter <= 0) this.currentDebuff = DEBUFFS.NONE;
    }

    if (this.currentDebuff === DEBUFFS.STUN) return;

    const head = this.segments[0];
    head.currentDirection = this.nextDirection;

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      if (!seg.previousSegment) {
        switch (seg.currentDirection) {
          case "UP": seg.y -= SEGMENTSIZE; break;
          case "DOWN": seg.y += SEGMENTSIZE; break;
          case "LEFT": seg.x -= SEGMENTSIZE; break;
          case "RIGHT": seg.x += SEGMENTSIZE; break;
        }
        if (seg.x < 0) seg.x = width - SEGMENTSIZE;
        else if (seg.x >= width) seg.x = 0;
        if (seg.y < 0) seg.y = height - SEGMENTSIZE;
        else if (seg.y >= height) seg.y = 0;
      } else {
        seg.x = seg.previousSegment.x;
        seg.y = seg.previousSegment.y;
        seg.currentDirection = seg.previousSegment.currentDirection;
      }
      seg.updateHitbox();
    }
  }
}

class Segment {
  constructor(startX, startY, startDirection, previousSegment) {
    this.x = startX;
    this.y = startY;
    this.currentDirection = startDirection;
    this.width = SEGMENTSIZE;
    this.height = SEGMENTSIZE;
    this.previousSegment = previousSegment;
    this.updateHitbox();
  }

  updateHitbox() {
    this.hitbox = findHitbox(this.x, this.y, this.width, this.height);
  }
}

function rectRectCollision(r1, r2) {
  if (
    r1.x + r1.width >= r2.x && // r1 right edge past r2 left
    r1.x <= r2.x + r2.width && // r1 left edge past r2 right
    r1.y + r1.height >= r2.y && // r1 top edge past r2 bottom
    r1.y <= r2.y + r2.height
  ) {
    // r1 bottom edge past r2 top
    return true;
  }
  return false;
}

function handle_movement_updates() {
  player1.move();
  player2.move();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnFood() {
  let x = getRandomInt(0, width / SEGMENTSIZE) * SEGMENTSIZE;
  let y = getRandomInt(0, height / SEGMENTSIZE) * SEGMENTSIZE;

  let newf = new Food(x, y);

  state.foods.push(newf);
}

function drawBackground(colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, width, height);
}

const loop = (timestamp) => {
  deltaTime = (timestamp - prevTimestamp) / 1000;
  prevTimestamp = timestamp;

  if (foodTimer >= foodSpawnCap && state.foods.length < 10) {
    spawnFood();
    foodTimer = 0;
  } else {
    foodTimer += deltaTime;
  }

  if (movementTimer >= movementUpdateCap) {
    if (collisionEnableTimer > 0) {
      collisionEnableTimer--;
    }

    updateCanvas(timestamp);
    requestAnimationFrame(loop);
    movementTimer = 0;
  } else {
    // worldTimer++;
    movementTimer += deltaTime;
    requestAnimationFrame(loop);
  }
};

function draw_text(textColour, font, text, x, y) {
  ctx.fillStyle = textColour;
  ctx.font = font;
  const textMetrics = ctx.measureText(text);
  ctx.fillText(text, x - textMetrics.width / 2, y);
}

function updateCanvas() {
  if (!state.paused) {
    handle_movement_updates();

    if (collisionEnableTimer == 0) {
      checkCollisions();
    }

    drawBackground(BGCOLOUR);
    const fps = Math.round(1 / deltaTime);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${fps}`, 10, 30);
    player1.draw();
    player2.draw();

    state.foods.forEach((food) => {
      food.draw();
    });
  } else {
    draw_text(TEXTCOLOUR, "50px Arial", "BONK", width / 2, height / 2);
  }
}


function applyDebuff(player) {
  option = getRandomInt(1, 2)

  switch (option) { // should make this clearer later...
    case DEBUFFS.CONFUSE:
      console.log("CONFUSE")
      player.currentDebuff = DEBUFFS.CONFUSE;
      player.debuffCounter = 10;
      break;
    case DEBUFFS.STUN:
      player.currentDebuff = DEBUFFS.STUN;
      player.debuffCounter = 10;
      break;
    default:
      console.log("ahh fuck.")
      break;
  }
}


function findHitbox(segmentX, segmentY, SegmentWidth, SegmentHeight) {
  let hitbox = {
    x: segmentX + 5,
    y: segmentY + 5,
    width: SegmentWidth - 10,
    height: SegmentHeight - 10,
  };
  return hitbox;
}

function invertDir(dir) {
  switch (dir) {
    case "UP": return "DOWN";
    case "DOWN": return "UP";
    case "LEFT": return "RIGHT";
    case "RIGHT": return "LEFT";
    default: return dir;
  }
}

function isOpposite(a, b) {
  return (
    (a === "UP" && b === "DOWN") || (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") || (a === "RIGHT" && b === "LEFT")
  );
}

function checkCollisions() {
  player1.segments.forEach((segment1) => {
    // bonk other player
    if (rectRectCollision(segment1.hitbox, player2.segments[0].hitbox)) {
      state.paused = true;
    }

    // self bonk
    if (segment1 != player1.segments[0]) {
      if (
        rectRectCollision(
          player1.segments[0].hitbox,
          segment1.hitbox
        )
      ) {
        state.paused = true;
      }
    }
  });

  player2.segments.forEach((segment2) => {
    // bonk other player
    if (
      rectRectCollision(
        player1.segments[0].hitbox,
        segment2.hitbox
      )
    ) {
      state.paused = true;
    }

    // self bonk
    if (segment2 != player2.segments[0]) {
      if (
        rectRectCollision(
          player2.segments[0].hitbox,
          segment2.hitbox
        )
      ) {
        state.paused = true;
      }
    }
  });

  // food collisisons
  for (let i = state.foods.length - 1; i >= 0; i--) {
    const food = state.foods[i];
    const foodHB = food.hitbox;
    const p1HB = player1.segments[0].hitbox;
    const p2HB = player2.segments[0].hitbox;

    if (rectRectCollision(foodHB, p1HB)) {
      state.foods.splice(i, 1);
      addTail(player1);
      applyDebuff(player2);
    } else if (rectRectCollision(foodHB, p2HB)) {
      state.foods.splice(i, 1);
      addTail(player2);
      applyDebuff(player1);
    }
  }
}

function addTail(player) {
  const tail = player.segments[player.segments.length - 1];
  const tailDirection = tail.currentDirection;

  let newX, newY;
  switch (tailDirection) {
    case "UP":
      newX = tail.x;
      newY = tail.y + SEGMENTSIZE;
      break;

    case "DOWN":
      newX = tail.x;
      newY = tail.y - SEGMENTSIZE;
      break;

    case "LEFT":
      newY = tail.y;
      newX = tail.x + SEGMENTSIZE;
      break;

    case "RIGHT":
      newY = tail.y;
      newX = tail.x - SEGMENTSIZE;
      break;

    default:
      console.assert(false, "unreachable")
      break;
  }
  player.segments.push(new Segment(newX, newY, tailDirection, tail));
}

function main() {
  document.addEventListener("keydown", (event) => {
    const key = event.key;
    switch (key) {
      case "ArrowUp": player1.setNextDirection("UP"); break;
      case "ArrowDown": player1.setNextDirection("DOWN"); break;
      case "ArrowLeft": player1.setNextDirection("LEFT"); break;
      case "ArrowRight": player1.setNextDirection("RIGHT"); break;

      case "w": player2.setNextDirection("UP"); break;
      case "s": player2.setNextDirection("DOWN"); break;
      case "a": player2.setNextDirection("LEFT"); break;
      case "d": player2.setNextDirection("RIGHT"); break;
    }
  });

  window.requestAnimationFrame((timestamp) => {
    prevTimestamp = timestamp;
    window.requestAnimationFrame(loop);
  });
}
let player1 = new SnakePlayer(PLAYER1COLOUR, 300, 300, "DOWN", 3);
let player2 = new SnakePlayer(PLAYER2COLOUR, 810, 600, "UP", 3);

main();
