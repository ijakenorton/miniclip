// Small set of shared utils
// To use:
//     import * as utils from "../../utils/utils.js" or actual relative path from source file
//     and in the game html 
//     <script type="module" src="../../utils/utils.js"></script> or actual relative path from source file

// Returns true if any of the two provided rectangles overlap
// Duck typing approach, just requires objects with:
// x
// y
// width
// height
function rectRectCollision(r1, r2) {
    if (r1.x + r1.width >= r2.x && // r1 right edge past r2 left
        r1.x <= r2.x + r2.width && // r1 left edge past r2 right
        r1.y + r1.height >= r2.y && // r1 top edge past r2 bottom
        r1.y <= r2.y + r2.height) { // r1 bottom edge past r2 top
        return true
    }

    return false
}

// Returns random number between low and high
function randomRange(low, high) {
    return Math.random() * (high - low) + low
}

// Linear interpolation from `from` to `to` using weight to scale the speed of the interpolation
function lerp(from, to, weight) {
    return from + (to - from) * weight
}

// Function to handle weird float edge cases where due to floating point representation 
// there may be slight differences in numbers
function floatEquals(x, y, EPSILON = 0.000001) {
    return Math.abs(x - y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))));
}

function clearScreen(ctx, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, width, height)
}

// Draw fps counter, default is top left in black
function drawFps(ctx, deltaTime, colour = "black", font = "16px Arial", x = 10, y = 30) {
    const fps = Math.round(1 / deltaTime)
    ctx.fillStyle = colour
    ctx.font = font
    ctx.fillText(`FPS: ${fps}`, x, y)
}


function drawText(ctx, fillStyle, font, text, x, y) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = fillStyle
    ctx.fillStyle = fillStyle
    ctx.font = font
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y)
    ctx.shadowBlur = 0;
}


const colours = {
    ROSE_PINK:       	      getComputedStyle(document.documentElement).getPropertyValue("--rose-pink").trim(),
    DARK_GREY:       	      getComputedStyle(document.documentElement).getPropertyValue("--dark-grey").trim(),
    BLUE_GREY:       	      getComputedStyle(document.documentElement).getPropertyValue("--blue-grey").trim(),
    DARK_BLUE:       	      getComputedStyle(document.documentElement).getPropertyValue("--dark-blue").trim(),
    MID_ORANGE:               getComputedStyle(document.documentElement).getPropertyValue("--mid-orange").trim(),
    PASTEL_GREEN:             getComputedStyle(document.documentElement).getPropertyValue("--pastel-green").trim(),
    FROGGER_BLACK:            getComputedStyle(document.documentElement).getPropertyValue("--frogger-black").trim(),
    FROGGER_RED:              getComputedStyle(document.documentElement).getPropertyValue("--frogger-red").trim(),
    FROGGER_LOG:              getComputedStyle(document.documentElement).getPropertyValue("--frogger-log").trim(),
    FROGGER_FROG:             getComputedStyle(document.documentElement).getPropertyValue("--frogger-frog").trim(),
    FROGGER_PAUSE_BACKGROUND: getComputedStyle(document.documentElement).getPropertyValue("--frogger-pause-background").trim(),
    FROGGER_RIVER_BACKGROUND: getComputedStyle(document.documentElement).getPropertyValue("--frogger-river-background").trim(),
}

export { 
    rectRectCollision, 
    randomRange, 
    lerp, 
    floatEquals, 
    clearScreen,
    drawFps,
    drawText,
    colours,
}
