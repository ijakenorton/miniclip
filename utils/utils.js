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
function rect_rect_collision(r1, r2) {
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
function float_equals(x, y, EPSILON = 0.000001) {
    return Math.abs(x - y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))));
}

function clear_screen(ctx, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, width, height)
}

// Draw fps counter, default is top left in black
function draw_fps(ctx, deltaTime, colour = "black", font = "16px Arial", x = 10, y = 30) {
    const fps = Math.round(1 / deltaTime)
    ctx.fillStyle = colour
    ctx.font = font
    ctx.fillText(`FPS: ${fps}`, x, y)
}

// Draws text centred around the given x, y
function draw_text(ctx, fillStyle, font, text, x, y) {
    ctx.fillStyle = fillStyle
    ctx.font = font
    const textMetrics = ctx.measureText(text)
    ctx.fillText(text, x - textMetrics.width / 2, y)
}


const colours = {
    ROSE_PINK:       	      getComputedStyle(document.documentElement).getPropertyValue("--rose-pink"),
    DARK_GREY:       	      getComputedStyle(document.documentElement).getPropertyValue("--dark-grey"),
    BLUE_GREY:       	      getComputedStyle(document.documentElement).getPropertyValue("--blue-grey"),
    DARK_BLUE:       	      getComputedStyle(document.documentElement).getPropertyValue("--dark-blue"),
    MID_ORANGE:               getComputedStyle(document.documentElement).getPropertyValue("--mid-orange"),
    PASTEL_GREEN:             getComputedStyle(document.documentElement).getPropertyValue("--pastel-green"),
    FROGGER_BLACK:            getComputedStyle(document.documentElement).getPropertyValue("--frogger-black"),
    FROGGER_RED:              getComputedStyle(document.documentElement).getPropertyValue("--frogger-red"),
    FROGGER_LOG:              getComputedStyle(document.documentElement).getPropertyValue("--frogger-log"),
    FROGGER_FROG:             getComputedStyle(document.documentElement).getPropertyValue("--frogger-frog"),
    FROGGER_PAUSE_BACKGROUND: getComputedStyle(document.documentElement).getPropertyValue("--frogger-pause-background"),
    FROGGER_RIVER_BACKGROUND: getComputedStyle(document.documentElement).getPropertyValue("--frogger-river-background"),
}

getComputedStyle(document.documentElement).getPropertyValue('--rose-pink')

export { 
    rect_rect_collision, 
    randomRange, 
    lerp, 
    float_equals, 
    clear_screen, 
    draw_fps, 
    draw_text,
    colours,
}
