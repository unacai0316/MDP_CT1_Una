let detector;
let video;
let canvas;
let ctx;
let webcamRunning = false;

async function setupMediaPipe() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        // 調整模型參數，降低偵測閾值以增加偵測靈敏度
        detector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                delegate: "GPU"
            },
            scoreThreshold: 0.3,  // 降低閾值
            maxResults: 5         // 減少最大結果數以提高效能
        });
        
        console.log("模型載入完成");
        await setupCamera();
    } catch (error) {
        console.error("MediaPipe 初始化錯誤:", error);
    }
}

async function setupCamera() {
    video = document.getElementById("webcam");
    canvas = document.getElementById("overlay");
    ctx = canvas.getContext("2d");
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,          // 增加解析度
                height: 720,
                facingMode: "environment",  // 確保使用後置鏡頭
                focusMode: "continuous"     // 自動對焦
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

async function detectFrame() {
    if (!webcamRunning) return;
    
    try {
        const detections = await detector.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 顯示所有偵測結果，包含信心度低的
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "偵測結果：<br>";
        
        detections.detections.forEach(detection => {
            const box = detection.boundingBox;
            const label = detection.categories[0].categoryName;
            const score = detection.categories[0].score;
            
            // 顯示所有偵測到的物體及其信心度
            resultsDiv.innerHTML += `${label}: ${(score * 100).toFixed(1)}%<br>`;
            
            // 繪製所有偵測框，使用不同顏色區分雲和其他物體
            if (label.toLowerCase() === "cloud") {
                drawBox(box, label, score, "#00FF00");  // 雲用綠色標示
            } else {
                drawBox(box, label, score, "#FF0000");  // 其他物體用紅色標示
            }
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
    ctx.fillStyle = `${color}33`;  // 33 為透明度
    ctx.fillRect(box.originX, box.originY, box.width, box.height);
    
    // 繪製標籤文字
    const text = `${label}: ${(score * 100).toFixed(1)}%`;
    ctx.font = "bold 16px Arial";
    const textWidth = ctx.measureText(text).width;
    
    // 標籤背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 25, textWidth + 10, 25);
    
    // 標籤文字
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 7);
}

// 在頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', setupMediaPipe);

// 加入錯誤處理的全局監聽器
window.addEventListener('error', function(error) {
    console.error('全局錯誤:', error);
});