import { FilesetResolver, ObjectDetector } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

let objectDetector;  // MediaPipe object detector
let classifier;      // MobileNet classifier
let imageLoader;     // Image loader
let video;
let canvas;
let ctx;
let webcamRunning = false;
let lockedTransforms = new Map();

// add ImageLoader class
class ImageLoader {
    constructor() {
        this.UNSPLASH_ACCESS_KEY = 'gNUJ04Jv9x2YQJjTHhV_7OBnYtapAgtt_KuQEbxFr5I';
        this.imageCache = new Map();
    }

    async getImage(label) {
        if (this.imageCache.has(label)) {
            return this.imageCache.get(label);
        }

        try {
            const imageUrl = await this.fetchImageUrl(label);
            if (!imageUrl) return null;

            const img = await this.loadImage(imageUrl);
            this.imageCache.set(label, img);
            return img;
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    }

    async fetchImageUrl(label) {
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${label}&per_page=1`,
                {
                    headers: {
                        'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
                    }
                }
            );
            const data = await response.json();
            return data.results[0]?.urls.regular;
        } catch (error) {
            console.error('Error fetching from Unsplash:', error);
            return null;
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

async function setupModels() {
    try {
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

        classifier = await mobilenet.load();
        imageLoader = new ImageLoader(); // Initialize image loader
        
        console.log("Models loaded");
        await setupCamera();
        setupResetButton();
    } catch (error) {
        console.error("Model initialization error:", error);
    }
}

function setupResetButton() {
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', () => {
        lockedTransforms.clear();
        console.log("Reset all transformations");
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
        console.error("Camera access error:", error);
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
        const detections = await objectDetector.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        
        const minSize = 100;
        const filteredDetections = detections.detections.filter(detection => {
            const box = detection.boundingBox;
            return box.width > minSize && box.height > minSize;
        });

        for (const detection of filteredDetections) {
            if (detection.categories[0].categoryName.toLowerCase() === "person") {
                const box = detection.boundingBox;
                const objectId = generateObjectId(box);
                
                try {
                    if (!lockedTransforms.has(objectId)) {
                        const personCanvas = document.createElement('canvas');
                        personCanvas.width = box.width;
                        personCanvas.height = box.height;
                        const personCtx = personCanvas.getContext('2d');
                        personCtx.drawImage(
                            video, 
                            box.originX, box.originY, box.width, box.height,
                            0, 0, box.width, box.height
                        );
                        
                        const predictions = await classifier.classify(personCanvas);
                        console.log("MobileNet predictions:", predictions);
                        
                        const alternativePrediction = predictions.find(p => 
                            !p.className.toLowerCase().includes('person') &&
                            !p.className.toLowerCase().includes('face')
                        );
                        
                        if (alternativePrediction) {
                            const simplifiedLabel = alternativePrediction.className.split(',')[0].trim();
                            lockedTransforms.set(objectId, {
                                label: simplifiedLabel,
                                confidence: alternativePrediction.probability
                            });
                        }
                    }

                    const transform = lockedTransforms.get(objectId);
                    if (transform) {
                        await drawBoxWithImage(box, transform.label, transform.confidence, "#00FF00");
                        resultsDiv.innerHTML = `Detected As：${transform.label}`;
                    }
                } catch (error) {
                    console.error("Error processing prediction:", error);
                }
            }
        }
        
        requestAnimationFrame(detectFrame);
    } catch (error) {
        console.error("Detection error:", error);
        requestAnimationFrame(detectFrame);
    }
}

// modify drawBox function to support image
async function drawBoxWithImage(box, label, confidence, color) {
    try {
        const img = await imageLoader.getImage(label);
        if (img) {
            // maintain aspect ratio
            const scale = Math.min(
                box.width / img.width,
                box.height / img.height
            );
            const newWidth = img.width * scale;
            const newHeight = img.height * scale;
            
            // center align
            const x = box.originX + (box.width - newWidth) / 2;
            const y = box.originY + (box.height - newHeight) / 2;

            // draw image
            ctx.drawImage(img, x, y, newWidth, newHeight);
        } else {
            // use original box if no img
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(box.originX, box.originY, box.width, box.height);
        }

        // draw label
        const text = label;
        ctx.font = "bold 18px Arial";
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(box.originX, box.originY - 30, textWidth + 10, 30);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(text, box.originX + 5, box.originY - 8);
    } catch (error) {
        console.error('Error in drawBoxWithImage:', error);
        // use original box if error
        drawBox(box, label, confidence, color);
    }
}


function drawBox(box, label, confidence, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
    
    // Draw label text
    const text = `${label}`;
    ctx.font = "bold 18px Arial";
    const textWidth = ctx.measureText(text).width;
    
    // Label background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(box.originX, box.originY - 30, textWidth + 10, 30);
    
    // Label text
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, box.originX + 5, box.originY - 8);
}

document.addEventListener('DOMContentLoaded', setupModels);

window.addEventListener('error', function(error) {
    console.error('Global error:', error);
});