let detector;
let video;
let canvas;
let ctx;
let webcamRunning = false;
let lockedTransforms = new Map(); // 儲存已鎖定的轉換結果

// use COCO objects instead
const COCO_OBJECTS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag',
    'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
    'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana',
    'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table',
    'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock',
    'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

// exclude unwanted objects（for person）
const EXCLUDED_OBJECTS = ['person'];
const VALID_OBJECTS = COCO_OBJECTS.filter(obj => !EXCLUDED_OBJECTS.includes(obj));

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
        lockedTransforms.clear();
        console.log("重置所有轉換");
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

function generateObjectId(box) {
    const gridSize = 500;
    const x = Math.floor(box.originX / gridSize);
    const y = Math.floor(box.originY / gridSize);
    return `${x}-${y}`;
}

// 修改 getTransformedObject 函數使用 COCO 物件
function getTransformedObject(objectId) {
    if (!lockedTransforms.has(objectId)) {
        const randomIndex = Math.floor(Math.random() * VALID_OBJECTS.length);
        const selectedObject = VALID_OBJECTS[randomIndex];
        lockedTransforms.set(objectId, selectedObject);
        console.log(`新轉換: ${selectedObject}`); // 用於除錯
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
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
    
    ctx.fillStyle = `${color}33`;
    ctx.fillRect(box.originX, box.originY, box.width, box.height);
    
    const text = `${label}: ${(score * 100).toFixed(1)}%`;
    ctx.font = "bold 18px Arial";
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 30, textWidth + 10, 30);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 8);
}

document.addEventListener('DOMContentLoaded', setupMediaPipe);

window.addEventListener('error', function(error) {
    console.error('全局錯誤:', error);
});