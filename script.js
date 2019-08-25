// DOM elements
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var containerDiv = document.getElementById("container");
var menuDiv = document.getElementById("menu");
var leadersDiv = document.getElementById("leadersBoard");
var startButton = document.getElementById("start");
var leftButton = document.getElementById("left");
var rightButton = document.getElementById("right");
var rotateButton = document.getElementById("rotate");
var downButton = document.getElementById("down");
var infoDiv = document.getElementById("info");
var scoreSpan = document.getElementById("score");
var lineSpan = document.getElementById("line");
var levelSpan = document.getElementById("level");

// Settings
var displayWidth = 10;
var displayHeight = 20;
var pixelSize = 30;
var colors = ["red", "aqua", "magenta", "green", "blue", "orange", "brown"];
var fillColor = "black";
var gridOn = false;
var totalLevel = 15;
//The screen will be refreshed in this time interval(ms).
var refreshRate = 50;

// Internals
var pixels = [];
var shapes = [];
var vLines = [];

var currentX;
var currentY;
var currentShape;
var currentRotation;
var currentColor;

var gravityCycle;
var loopCount;
var gameLoop;

var score;
var totalLine;

init();
startButton.addEventListener('click', function (event) {
    startGame();
});

function startGame() {
    // Initialize game variables
    score = 0;
    totalLine = 0;
    // Current level(decreasing), it means each block will drop for every (totalLevel*refreshRate)ms.
    gravityCycle = totalLevel;

    // Initialize shape variables
    currentX = displayWidth / 2 - 2;
    currentY = 0;
    currentShape = Math.floor(Math.random() * 10) % 7;
    currentRotation = 0;
    currentColor = Math.floor(Math.random() * 10) % 7;

    document.onkeydown = keyHandler;
    leftButton.onclick = keyHandler;
    rightButton.onclick = keyHandler;
    downButton.onclick = keyHandler;
    rotateButton.onclick = keyHandler;

    loopCount = 0;
    gameLoop = setInterval(function () {
        loop();
    }, refreshRate);

    hideMenu();
}

function finishGame() {
    clearInterval(gameLoop);
    clearCanvas();
    // Clear canvas items
    for (var x = 0; x < pixels.length; x++) {
        pixels[x] = 0;
    }
    document.onkeydown = null;
    leftButton.onclick = null;
    rightButton.onclick = null;
    downButton.onclick = null;
    rotateButton.onclick = null;

    if(isHighScore(score)) {
        var name = prompt("yeeyy high score");
        name && setHighScore(name, score);
    }

    showMenu();
}

function keyHandler(e) {
    if (e.code == 'ArrowUp' || e.target.id == 'rotate') {
        currentRotation += doesFit(currentShape, currentRotation + 1, currentX, currentY) ? 1 : 0;
    } else if (e.code == 'ArrowDown' || e.target.id == 'down') {
        currentY += doesFit(currentShape, currentRotation, currentX, currentY + 1) ? 1 : 0;
    } else if (e.code == 'ArrowLeft' || e.target.id == 'left') {
        currentX -= doesFit(currentShape, currentRotation, currentX - 1, currentY) ? 1 : 0;
    } else if (e.code == 'ArrowRight' || e.target.id == 'right') {
        currentX += doesFit(currentShape, currentRotation, currentX + 1, currentY) ? 1 : 0;
    }
}

function loop() {
    loopCount++;
    if (loopCount == gravityCycle) {
        loopCount = 0;
        // let the gravity rocks
        if (!isCollision(currentShape, currentRotation, currentX, currentY + 1)) {
            currentY++;
        } else {
            // lock tiles
            for (var x = 0; x < 4; x++) {
                for (var y = 0; y < 4; y++) {
                    if (shapes[currentShape][rotate(x, y, currentRotation)])
                        pixels[(currentY + y) * displayWidth + currentX + x] = 1;
                }
            }

            // Give 1 point for each lock
            score += 1;

            // check lines
            for (var y = 0; y < 4; y++) {
                // checking only last 4 line is enough
                yLine = currentY + y;

                var allFilled = true
                for (var x = 0; x < displayWidth; x++) {
                    if (!pixels[yLine * displayWidth + x]) {
                        allFilled = false;
                        break;
                    }
                }
                if (allFilled) {
                    // clear this line
                    for (var x = 0; x < displayWidth; x++) {
                        pixels[yLine * displayWidth + x] = 0;
                    }
                    vLines.push(yLine);
                }
            }

            // create new shape
            currentX = displayWidth / 2 - 2;
            currentY = 0;
            currentShape = Math.floor(Math.random() * 10) % 7;
            currentRotation = Math.floor(Math.random() * 10) % 4;
            currentColor = Math.floor(Math.random() * 10) % 7;

            if (!doesFit(currentShape, currentRotation, currentX, currentY + 1)) {
                // if new shape doesn't fit, then it means GAME OVER!
                finishGame();
            }
        }
    }
    syncScreen();
    // sync current shape
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (shapes[currentShape][rotate(x, y, currentRotation)])
                fillPoint(currentX + x, currentY + y, colors[currentColor]);
        }
    }

    // stack lines together 
    for (var i = 0; i < vLines.length; i++) {
        // give 10 for each line plus bonus for multiple lines: 2->40, 3->90, 4->160
        score += 10 * ((i + 1) ** 2);
        totalLine += 1;
        if (totalLine % 5 == 0) {
            // increase level for every 5 line completion
            if (gravityCycle != 0)
                gravityCycle--;
        }

        yLine = vLines[i];
        console.log("removed: " + yLine);
        for (var y = yLine; y > 0; y--) {
            for (var x = 0; x < displayWidth; x++) {
                pixels[y * displayWidth + x] = pixels[(y - 1) * displayWidth + x];
            }
        }
    }
    vLines = [];
}

function isCollision(shape, rotation, nx, ny) {
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            si = rotate(x, y, rotation);
            fi = (ny + y) * displayWidth + nx + x;
            if (shapes[shape][si]) {
                if (y + ny >= displayHeight || pixels[fi]) {
                    console.log("collision");
                    return true;
                }
            }
        }
    }
    return false;
}

function doesFit(shape, rotation, nx, ny) {
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            si = rotate(x, y, rotation);
            fi = (ny + y) * displayWidth + nx + x;
            if (shapes[shape][si]) {
                if (nx + x < 0 || x + nx >= displayWidth || y + ny >= displayHeight || pixels[fi]) {
                    console.log("hit boundry");
                    return false;
                }
            }
        }
    }
    return true;
}

function init() {
    //Set canvas size
    canvas.width = pixelSize * displayWidth;
    canvas.height = pixelSize * displayHeight;

    shapes[0] = [
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0
    ];
    shapes[1] = [
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0
    ];
    shapes[2] = [
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 1, 1, 0,
        0, 0, 0, 0
    ];
    shapes[3] = [
        0, 0, 0, 0,
        0, 1, 1, 0,
        0, 1, 1, 0,
        0, 0, 0, 0
    ];
    shapes[4] = [
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 1, 0,
        0, 0, 0, 0
    ];
    shapes[5] = [
        0, 0, 1, 0,
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0
    ];
    shapes[6] = [
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0
    ];

    showMenu();
}

function rotate(x, y, rotation) {
    switch (rotation % 4) {
        case 0: // 0 degrees			
            // 0  1  2  3
            // 4  5  6  7
            // 8  9 10 11
            //12 13 14 15
            return 0 + y * 4 + x;
        case 1: // 90 degrees			
            //12  8  4  0
            //13  9  5  1
            //14 10  6  2
            //15 11  7  3
            return 12 + y - x * 4;
        case 2: // 180 degrees				
            //15 14 13 12
            //11 10  9  8
            // 7  6  5  4
            // 3  2  1  0
            return 15 - y * 4 - x;
        case 3: // 270 degrees			
            // 3  7 11 15
            // 2  6 10 14
            // 1  5  9 13
            // 0  4  8 12
            return 3 - y + x * 4;
    }
}

function syncScreen() {
    for (var x = 0; x < displayWidth; x++) {
        for (var y = 0; y < displayHeight; y++) {
            if (pixels[x + y * displayWidth]) {
                fillPoint(x, y, fillColor);
            } else {
                clearPoint(x, y);
            }
        }
    }
    scoreSpan.textContent = score;
    lineSpan.textContent = totalLine;
    levelSpan.textContent = totalLevel - gravityCycle + 1;

    if (gridOn)
        drawGrid();
}

function fillPoint(x, y, color) {
    context.fillStyle = color;
    context.fillRect(pixelSize * x + 1, pixelSize * y + 1, pixelSize - 1, pixelSize - 1);
}

function clearPoint(x, y) {
    context.clearRect(pixelSize * x + 1, pixelSize * y + 1, pixelSize - 1, pixelSize - 1);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    for (var x = 0.5; x < canvas.width; x += pixelSize) {
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
    }

    for (var y = 0.5; y < canvas.height; y += pixelSize) {
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
    }

    context.strokeStyle = "#ddd";
    context.stroke();
}

function showMenu() {
    menuDiv.style.width = (canvas.width - 6) + 'px';
    //menuDiv.style.height = '90px';
    menuDiv.style.marginTop = (canvas.height / 2 - 150) + 'px';
    menuDiv.style.display = "block";

    //it is unrelated but I really don't care. Just to overcome of absolute positioning of all elements.
    containerDiv.style.height = (canvas.height+5) + 'px';

    generateLeadersBoard();
}

function isHighScore(score) {
    var leadersData = JSON.parse(localStorage.getItem("leaders")) || [];
    if (leadersData.length < 5 || score > (leadersData[4][1] || 0)) {
        return true
    }
    return false;
}

function setHighScore(name, score) {
    var leadersData = JSON.parse(localStorage.getItem("leaders")) || [];
    var no = 0;
    for (var i = 0; i < 5; i++) {
        record = leadersData[i] || ['-----', 0];
        if(score > record[1]){
            no = i;
            break;
        }
    }
    leadersData.splice(no, 0, [name, score]);
    localStorage.setItem("leaders", JSON.stringify(leadersData));
}

function generateLeadersBoard() {
    var leadersData = JSON.parse(localStorage.getItem("leaders")) || [];

    var inner = "<table>";
    for(var i=0; i < 5; i++){
        record = leadersData[i] || ['-----', 0];
        inner += "<tr><td>" + (i+1) + ". " + record[0].slice(0,5) + "</td><td>" + record[1] + "</td></tr>";
    }
    inner += "</table>"
    leadersDiv.innerHTML = inner;
}

function hideMenu() {
    menuDiv.style.display = "none";
}
