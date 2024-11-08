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
        
        detector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                delegate: "GPU"
            },
            scoreThreshold: 0.1,
            maxResults: 10
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
                width: 640,
                height: 480,
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

async function detectFrame() {
    if (!webcamRunning) return;

    try {
        const detections = await detector.detect(video);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.detections.forEach(detection => {
            if (detection.categories[0].categoryName.toLowerCase() !== "cloud") {
                const box = detection.boundingBox;
                const label = detection.categories[0].categoryName;
                const score = detection.categories[0].score;

                if (score > 0.1) {
                    drawBox(box, label, score);
                }
            }
        });

        requestAnimationFrame(detectFrame);
    } catch (error) {
        console.error("偵測錯誤:", error);
        requestAnimationFrame(detectFrame);
    }
}

function drawBox(box, label, score) {
    // 繪製邊界框
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);

    // 繪製標籤背景
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(box.originX, box.originY, box.width, box.height);

    // 繪製標籤文字
    const text = `${label}: ${(score * 100).toFixed(1)}%`;
    ctx.font = "16px Arial";
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 25, textWidth + 10, 25);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 7);
}

// 在頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', setupMediaPipe);

// 加入錯誤處理的全局監聽器
window.addEventListener('error', function(error) {
    console.error('全局錯誤:', error);
});