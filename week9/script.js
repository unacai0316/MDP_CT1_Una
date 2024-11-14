import { FilesetResolver, ObjectDetector } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

let objectDetector;  // MediaPipe 物體偵測器
let classifier;      // MobileNet 分類器
let video;
let canvas;
let ctx;
let webcamRunning = false;
let lockedTransforms = new Map();

async function setupModels() {
    try {
        // 載入 MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                delegate: "GPU"
            },
            scoreThreshold: 0.5,
            maxResults: 5
        });

        // 載入 MobileNet
        classifier = await mobilenet.load();
        
        console.log("模型載入完成");
        await setupCamera();
        setupResetButton();
    } catch (error) {
        console.error("模型初始化錯誤:", error);
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

async function detectFrame() {
    if (!webcamRunning) return;
    
    try {
        // use media pipe to detect person position
        const detections = await objectDetector.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        
        // only process large enough objects
        const minSize = 100;
        const filteredDetections = detections.detections.filter(detection => {
            const box = detection.boundingBox;
            return box.width > minSize && box.height > minSize;
        });

        // Perform fine-grained classification for each detected person
        for (const detection of filteredDetections) {
            if (detection.categories[0].categoryName.toLowerCase() === "person") {
                const box = detection.boundingBox;
                const objectId = generateObjectId(box);
                
                try {
                   // in detectFrame function modify this part
                if (!lockedTransforms.has(objectId)) {
                    // get the person region
                    const personCanvas = document.createElement('canvas');
                    personCanvas.width = box.width;
                    personCanvas.height = box.height;
                    const personCtx = personCanvas.getContext('2d');
                    personCtx.drawImage(
                        video, 
                        box.originX, box.originY, box.width, box.height,
                        0, 0, box.width, box.height
                    );
                    
                    // use MobileNet to classify the person
                    const predictions = await classifier.classify(personCanvas);
                    console.log("MobileNet predictions:", predictions);
                    
                    // find the first prediction that is not a person or face
                    const alternativePrediction = predictions.find(p => 
                        !p.className.toLowerCase().includes('person') &&
                        !p.className.toLowerCase().includes('face')
                    );
                    
                    if (alternativePrediction) {
                        // only take the first word, remove anything after a comma
                        const simplifiedLabel = alternativePrediction.className.split(',')[0].trim();
                        lockedTransforms.set(objectId, {
                            label: simplifiedLabel,  // use the simplified label
                            confidence: alternativePrediction.probability
                        });
                    }
                }

                const transform = lockedTransforms.get(objectId);
                if (transform) {
                    drawBox(box, transform.label, transform.confidence, "#00FF00");
                    resultsDiv.innerHTML = `偵測為：${transform.label}`;
                }
                } catch (error) {
                    console.error("處理預測時發生錯誤:", error);
                }
            }
        }
        
        requestAnimationFrame(detectFrame);
    } catch (error) {
        console.error("偵測錯誤:", error);
        requestAnimationFrame(detectFrame);
    }
}

function drawBox(box, label, confidence, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
    
    // 繪製標籤文字
    const text = `${label}`;
    ctx.font = "bold 18px Arial";
    const textWidth = ctx.measureText(text).width;
    
    // 標籤背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 30, textWidth + 10, 30);
    
    // 標籤文字
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 8);
}

// 初始化
document.addEventListener('DOMContentLoaded', setupModels);

window.addEventListener('error', function(error) {
    console.error('全局錯誤:', error);
});