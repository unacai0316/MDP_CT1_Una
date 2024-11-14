let detector;
let video;
let canvas;
let ctx;
let webcamRunning = false;
let lockedTransforms = new Map(); // 儲存已鎖定的轉換結果

async function setupMediaPipe() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        detector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                delegate: "GPU"
            },
            scoreThreshold: 0.5,
            maxResults: 5
        });
        
        console.log("模型載入完成");
        await setupCamera();
        setupResetButton();
    } catch (error) {
        console.error("MediaPipe 初始化錯誤:", error);
    }
}

function setupResetButton() {
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', () => {
        lockedTransforms.clear(); // clear all locked transforms
        console.log("reset all transforms");
    });
}

async function setupCamera() {
    video = document.getElementById("webcam");
    canvas = document.getElementById("overlay");
    ctx = canvas.getContext("2d");
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720,
                facingMode: "environment"
            }
        });
        
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            webcamRunning = true;
            detectFrame();
        });
    } catch (error) {
        console.error("攝影機存取錯誤:", error);
    }
}

// Generate a unique identifier for the person
function generateObjectId(box) {
    // Generate a unique identifier using the position (tolerates slight movements)
    const gridSize = 500; // how tolerant to the position
    const x = Math.floor(box.originX / gridSize);
    const y = Math.floor(box.originY / gridSize);
    return `${x}-${y}`;
}

// Get the transformed object
function getTransformedObject(objectId) {
    if (!lockedTransforms.has(objectId)) {
        const alternativeObjects = [
            "giraffe", "elephant", "penguin", "dinosaur", 
            "robot", "unicorn", "dragon", "teddy bear",
            "spaceship", "submarine", "hot air balloon"
        ];
        const randomIndex = Math.floor(Math.random() * alternativeObjects.length);
        lockedTransforms.set(objectId, alternativeObjects[randomIndex]);
    }
    return lockedTransforms.get(objectId);
}

async function detectFrame() {
    if (!webcamRunning) return;
    
    try {
        const detections = await detector.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "轉換結果：<br>";
        
        detections.detections.forEach(detection => {
            const box = detection.boundingBox;
            let originalLabel = detection.categories[0].categoryName;
            const score = detection.categories[0].score;
            
            let displayLabel = originalLabel;
            let boxColor = "#FF0000";
            
            if (originalLabel.toLowerCase() === "person") {
                const objectId = generateObjectId(box);
                displayLabel = getTransformedObject(objectId);
                boxColor = "#00FF00";
                
                resultsDiv.innerHTML += `人物被轉換為：${displayLabel}<br>`;
            }
            
            drawBox(box, displayLabel, score, boxColor);
        });
        
        requestAnimationFrame(detectFrame);
    } catch (error) {
        console.error("偵測錯誤:", error);
        requestAnimationFrame(detectFrame);
    }
}

function drawBox(box, label, score, color) {
    // 繪製邊界框
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
    
    // 繪製半透明填充
    ctx.fillStyle = `${color}33`;
    ctx.fillRect(box.originX, box.originY, box.width, box.height);
    
    // 繪製標籤文字
    const text = `${label}: ${(score * 100).toFixed(1)}%`;
    ctx.font = "bold 18px Arial";
    const textWidth = ctx.measureText(text).width;
    
    // 標籤背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 30, textWidth + 10, 30);
    
    // 標籤文字
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 8);
}

document.addEventListener('DOMContentLoaded', setupMediaPipe);

window.addEventListener('error', function(error) {
    console.error('全局錯誤:', error);
});