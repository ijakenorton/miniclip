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

class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = SEGMENTSIZE;
    this.height = SEGMENTSIZE;
    this.updateHitbox();
  }

  updateHitbox() {
    this.hitbox = find_hitbox(this.x, this.y, this.width, this.height);
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

    let previousSegment = null;

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

  move() {
    for (let i = this.segments.length - 1; i >= 0; i--) {
      let segment = this.segments[i];

      if (segment.previousSegment == null) {
        switch (segment.currentDirection) {
          case "UP":
            if (segment.y == 0) {
              segment.y = height;
            }
            segment.y -= SEGMENTSIZE;
            break;
          case "DOWN":
            if (segment.y == height - SEGMENTSIZE) {
              segment.y = -30;
            }
            segment.y += SEGMENTSIZE;
            break;
          case "LEFT":
            if (segment.x == 0) {
              segment.x = width;
            }
            segment.x -= SEGMENTSIZE;
            break;
          case "RIGHT":
            if (segment.x == width - SEGMENTSIZE) {
              segment.x = -30;
            }
            segment.x += SEGMENTSIZE;
            break;
        }
      } else {
        // if body piece
        segment.y = segment.previousSegment.y;
        segment.x = segment.previousSegment.x;
        segment.currentDirection = segment.previousSegment.currentDirection;
      }

      segment.updateHitbox();
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
    this.hitbox = find_hitbox(this.x, this.y, this.width, this.height);
  }
}

function rect_rect_collision(r1, r2) {
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

function draw_background(colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, width, height);
}

const loop = (timestamp) => {
  deltaTime = (timestamp - prevTimestamp) / 1000;
  prevTimestamp = timestamp;

  if (foodTimer >= foodSpawnCap) {
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
      check_collisisons();
    }

    draw_background(BGCOLOUR);
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

function find_hitbox(segmentX, segmentY, SegmentWidth, SegmentHeight) {
  let hitbox = {
    x: segmentX + 5,
    y: segmentY + 5,
    width: SegmentWidth - 10,
    height: SegmentHeight - 10,
  };
  return hitbox;
}

function check_collisisons() {
  player1.segments.forEach((segment1) => {
    // bonk other player
    if (rect_rect_collision(segment1.hitbox, player2.segments[0].hitbox)) {
      state.paused = true;
    }

    // self bonk
    if (segment1 != player1.segments[0]) {
      if (
        rect_rect_collision(
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
      rect_rect_collision(
        player1.segments[0].hitbox,
        segment2.hitbox
      )
    ) {
      state.paused = true;
    }

    // self bonk
    if (segment2 != player2.segments[0]) {
      if (
        rect_rect_collision(
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

    if (rect_rect_collision(foodHB, p1HB)) {
      state.foods.splice(i, 1);
      addTail(player1);
    } else if (rect_rect_collision(foodHB, p2HB)) {
      state.foods.splice(i, 1);
      addTail(player2);
    }
  }
}

function addTail(player) {
  player1Tail = player.segments[player.segments.length - 1];
  tailDirection = player1Tail.currentDirection;

  switch (tailDirection) {
    case "UP":
      newX = player1Tail.x;
      newY = player1Tail.y + SEGMENTSIZE;
      break;

    case "DOWN":
      newX = player1Tail.x;
      newY = player1Tail.y - SEGMENTSIZE;
      break;

    case "LEFT":
      newY = player1Tail.y;
      newX = player1Tail.x + SEGMENTSIZE;
      break;

    case "RIGHT":
      newY = player1Tail.y;
      newX = player1Tail.x - SEGMENTSIZE;
      break;

    default:
      newX = 0;
      newY = 0;
      break;
  }
  player.segments.push(new Segment(newX, newY, tailDirection, player1Tail));
}

function main() {
  document.addEventListener("keydown", (event) => {
    const key = event.key;
    switch (key) {
      case "ArrowUp":
        if (player1.segments[0].currentDirection != "DOWN") {
          player1.segments[0].currentDirection = "UP";
        }
        break;
      case "ArrowRight":
        if (player1.segments[0].currentDirection != "LEFT") {
          player1.segments[0].currentDirection = "RIGHT";
        }
        break;
      case "ArrowDown":
        if (player1.segments[0].currentDirection != "UP") {
          player1.segments[0].currentDirection = "DOWN";
        }
        break;
      case "ArrowLeft":
        if (player1.segments[0].currentDirection != "RIGHT") {
          player1.segments[0].currentDirection = "LEFT";
        }
        break;

      case "w":
        if (player2.segments[0].currentDirection != "DOWN") {
          player2.segments[0].currentDirection = "UP";
        }
        break;
      case "d":
        if (player2.segments[0].currentDirection != "LEFT") {
          player2.segments[0].currentDirection = "RIGHT";
        }
        break;
      case "s":
        if (player2.segments[0].currentDirection != "UP") {
          player2.segments[0].currentDirection = "DOWN";
        }
        break;
      case "a":
        if (player2.segments[0].currentDirection != "RIGHT") {
          player2.segments[0].currentDirection = "LEFT";
        }
        break;
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
