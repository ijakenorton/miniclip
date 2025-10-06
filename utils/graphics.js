import { colours } from "./utils.js"

function drawScanLines(ctx, canvas, colour = 'rgba(0, 0, 0, 0.1)') {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawRadialGradient(ctx, canvas) {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCRTEffects(ctx, canvas) {
    drawScanLines(ctx, canvas)
    drawRadialGradient(ctx, canvas)
}

function drawButton(ctx, btn, state, textColours = { primary: colours.BLUE_GREY, secondary: colours.PASTEL_GREEN }) {
    const textColor = btn.hovered ? textColours.secondary : textColours.primary;
    // Glow effect
    ctx.shadowBlur = btn.hovered ? 30 : 15;
    ctx.shadowColor = colours.PASTEL_GREEN;

    // Button border
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    // Button background (subtle)
    ctx.fillStyle = btn.hovered ? 'rgba(191, 255, 188, 0.1)' : 'rgba(134, 187, 216, 0.05)';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Reset shadow for text
    ctx.shadowBlur = btn.hovered ? 20 : 10;

    // Button text
    ctx.fillStyle = textColor;
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 + state.flickerOffset);

    // Reset shadow
    ctx.shadowBlur = 0;
}

// TODO: Allow for passing in more colours
function drawGameFrame(ctx, canvas, currentViewport) {
    if (!currentViewport) return;

    // Draw frame border around the game viewport
    ctx.strokeStyle = colours.PASTEL_GREEN;
    ctx.shadowBlur = 20;
    ctx.shadowColor = colours.PASTEL_GREEN;
    ctx.lineWidth = 4;
    ctx.strokeRect(currentViewport.x - 10, currentViewport.y - 10,
        currentViewport.width + 20, currentViewport.height + 20);
    ctx.shadowBlur = 0;

    ctx.fillStyle = colours.DARK_BLUE;

    // Top
    ctx.fillRect(0,
        0,
        canvas.width,
        currentViewport.y - 10
    );
    // Bottom
    ctx.fillRect(0,
        currentViewport.y + currentViewport.height + 10,
        canvas.width,
        canvas.height - (currentViewport.y + currentViewport.height + 10)
    );
    // Left
    ctx.fillRect(
        0,
        currentViewport.y - 10,
        currentViewport.x - 10,
        currentViewport.height + 20
    );
    // Right
    ctx.fillRect(currentViewport.x + currentViewport.width + 10,
        currentViewport.y - 10,
        canvas.width - (currentViewport.x + currentViewport.width + 10),
        currentViewport.height + 20
    );
}

function drawTitle(ctx, fillStyle, font, text, x, y) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = fillStyle
    ctx.fillStyle = fillStyle
    ctx.font = font
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
}


export {
    drawScanLines,
    drawRadialGradient,
    drawCRTEffects,
    drawButton,
    drawGameFrame,
    drawTitle
}
