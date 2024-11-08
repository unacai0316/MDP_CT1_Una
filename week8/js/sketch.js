let classifier;
let video;
let currentWeather = '';
let currentOutfit = null;
let likedOutfits = [];
let dislikedOutfits = [];
let statusText = 'Waiting to load the model...';
let regenerateButton;
let clothingImages = {};
let classifierReady = false;
let lastClassificationTime = 0;

// 衣物資料庫
const clothingItems = [
  // Bottom
  { filename: 'images/Bottom_Long_Warm_Thick_Dark_Casual_Modern.png', tags: ['Bottom', 'Long', 'Warm', 'Thick', 'Dark', 'Casual', 'Modern'] },
  { filename: 'images/Bottom_Long_Warm_Thick_Dark_Modern_Vintage.png', tags: ['Bottom', 'Long', 'Warm', 'Thick', 'Dark', 'Modern', 'Vintage'] },
  { filename: 'images/Bottom_Long_Warm_Thick_Neutral_Vintage_Casual.png', tags: ['Bottom', 'Long', 'Warm', 'Thick', 'Neutral', 'Vintage', 'Casual'] },
  { filename: 'images/Bottom_Short_Cool_Dark_Casual_Vintage.png', tags: ['Bottom', 'Short', 'Cool', 'Dark', 'Casual', 'Vintage'] },
  { filename: 'images/Bottom_Short_Cool_Light_Casual_Modern.png', tags: ['Bottom', 'Short', 'Cool', 'Light', 'Casual', 'Modern'] },
  { filename: 'images/Bottom_Short_Cool_Neutral_Casual.png', tags: ['Bottom', 'Short', 'Cool', 'Neutral', 'Casual'] },
  { filename: 'images/Bottom_Short_Thick_Dark_Vintage_Casual.png', tags: ['Bottom', 'Short', 'Thick', 'Dark', 'Vintage', 'Casual'] },
  
  // Dress
  { filename: 'images/Dress_Long_Cool_Dark_Formal_Modern.png', tags: ['Dress', 'Long', 'Cool', 'Dark', 'Formal', 'Modern'] },
  { filename: 'images/Dress_Long_Cool_Light_Formal_Modern_Vintage.png', tags: ['Dress', 'Long', 'Cool', 'Light', 'Formal', 'Modern', 'Vintage'] },
  { filename: 'images/Dress_Long_Thick_Dark_Casual.png', tags: ['Dress', 'Long', 'Thick', 'Dark', 'Casual'] },
  { filename: 'images/Dress_Medium_Cool_Neutral_Formal.png', tags: ['Dress', 'Medium', 'Cool', 'Neutral', 'Formal'] },
  
  // Top
  { filename: 'images/Top_Long_Warm_Hot_Waterproof_Thick_Neutral_Casual.png', tags: ['Top', 'Long', 'Warm', 'Hot', 'Waterproof', 'Thick', 'Neutral', 'Casual'] },
  { filename: 'images/Top_Long_Warm_Thick_Dark_Casual_Athletic.png', tags: ['Top', 'Long', 'Warm', 'Thick', 'Dark', 'Casual', 'Athletic'] },
  { filename: 'images/Top_Long_Warm_Thick_Light_Casual_Athletic.png', tags: ['Top', 'Long', 'Warm', 'Thick', 'Light', 'Casual', 'Athletic'] },
  { filename: 'images/Top_Medium_Breathable_Dark_Athletic.png', tags: ['Top', 'Medium', 'Breathable', 'Dark', 'Athletic'] },
  { filename: 'images/Top_Medium_Breathable_Light_Casual.png', tags: ['Top', 'Medium', 'Breathable', 'Light', 'Casual'] }
];

// 天氣需求對照表
const weatherRequirements = {
    'Sunny': {
        top: ['Top', 'Medium', 'Breathable'],
        bottom: ['Bottom', 'Short', 'Cool'],
        dress: ['Dress', 'Medium', 'Cool'],
        allowDress: true
    },
    'Cloudy': {
        top: ['Top', 'Medium', 'Breathable'],
        bottom: ['Bottom', 'Long', 'Warm'],
        dress: ['Dress', 'Long', 'Cool'],
        allowDress: true
    },
    'Rainy': {
        top: ['Top', 'Long', 'Waterproof'],
        bottom: ['Bottom', 'Long', 'Warm'],
        allowDress: false
    },
    'Night': {
        top: ['Top', 'Long', 'Warm'],
        bottom: ['Bottom', 'Long', 'Warm'],
        dress: ['Dress', 'Long', 'Thick'],
        allowDress: true
    }
};

// 預載圖片
// 在 preload 中添加更多檢查
function preload() {
    clothingItems.forEach(item => {
      loadImage(item.filename, 
        (img) => {
          console.log(`Successfully loaded image ${item.filename}, size: ${img.width}x${img.height}`);
          clothingImages[item.filename] = img;
        },
        (err) => {
          console.error(`Failed to load image ${item.filename}:`, err);
        }
      );
    });
  }
function checkImagePaths() {
    console.log('Checking image paths...');
    clothingItems.forEach(item => {
        console.log(`Checking path: ${item.filename}`);
        if (clothingImages[item.filename]) {
            console.log(`Image loaded: ${item.filename}`);
        } else {
            console.log(`Image not loaded: ${item.filename}`);
        }
    });
}


function setup() {
    // 獲取 sketch-holder 的寬度來設置畫布
    let sketchHolder = document.getElementById('sketch-holder');
    let canvas = createCanvas(800, 600);
    canvas.parent('sketch-holder');
    
    // 檢查視訊支援
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText = 'Your browser does not support camera access.';
        return;
    }
    
    video = createCapture(VIDEO, videoReady);
    video.size(320, 240);
    video.hide();
    
    // 使用 async/await 初始化分類器
    initClassifier();
    
    // 修改按鈕創建和定位
    regenerateButton = createButton('Re-recommend the matching');
    regenerateButton.parent('sketch-holder');
    regenerateButton.class('regenerate-button');
    // 移除 position 設置，讓 CSS 來控制
}
  
// 新增分類器初始化函數
async function initClassifier() {
  try {
    classifier = await ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/I4iZW3tM1/model.json');
    console.log('The classifier is loaded');
    classifierReady = true;
    statusText = 'The model is ready.！';
  } catch (error) {
    console.error('Failed to load the classifier:', error);
    statusText = 'Model loading failed';
  }
}


function videoReady() {
  console.log('The video is ready.');
}

// 修改 draw 函數中的分類調用
function draw() {
  background(240);
  
  // 顯示視訊畫面
  image(video, 10, 10, 320, 240);
  
  // 顯示狀態文字
  fill(0);
  noStroke();
  textSize(16);
  text(statusText, 10, 280);
  text(`當前天氣: ${currentWeather}`, 10, 310);
  
  // 顯示當前搭配
  if (currentOutfit) {
    displayOutfit();
  }
  
  // 顯示使用說明
  textSize(12);
  text('Please use gestures.：', 10, height - 80);
  text('👊 I like this combination.', 10, height - 60);
  text('🖐️ I dont like this outfit.', 10, height - 40);

  // 限制分類頻率並添加額外的檢查
  if (classifierReady && video.loadedmetadata && millis() - lastClassificationTime > 1000) {
    classifyVideo();
    lastClassificationTime = millis();
  }
}

function displayOutfit() {
    let y = 340;
    let x = 350;
    textSize(14);
    fill(0);
    
    text('Current Outfit：', x, y);
    y += 30;
  
    // 添加除錯信息
    console.log('Current outfit:', currentOutfit);
    
    if (currentOutfit && currentOutfit.type === 'dress') {
      text('Dress：', x, y);
      if (currentOutfit.dress && clothingImages[currentOutfit.dress.filename]) {
        let img = clothingImages[currentOutfit.dress.filename];
        console.log('Dress image:', img);
        // 確保圖片已經載入
        if (img && img.width > 0) {
          // 在顯示圖片前保存當前的 imageMode
          imageMode(CORNER);
          // 添加圖片尺寸的除錯信息
          console.log('Displaying dress image:', currentOutfit.dress.filename, 'size:', img.width, 'x', img.height);
          image(img, x + 200, y - 30, 150, 150);
        }
      }
      y += 20;
      if (currentOutfit.dress && currentOutfit.dress.tags) {
        text(currentOutfit.dress.tags.join(', '), x + 70, y);
      }
    } else if (currentOutfit) {
      // 顯示上衣
      text('Top：', x, y);
      if (currentOutfit.top && clothingImages[currentOutfit.top.filename]) {
        let img = clothingImages[currentOutfit.top.filename];
        console.log('Top image:', img);
        if (img && img.width > 0) {
          imageMode(CORNER);
          console.log('Displaying top image:', currentOutfit.top.filename, 'size:', img.width, 'x', img.height);
          image(img, x + 200, y - 30, 150, 150);
        }
      }
      y += 20;
      if (currentOutfit.top && currentOutfit.top.tags) {
        text(currentOutfit.top.tags.join(', '), x + 70, y);
      }
  
      // 顯示下著
      y += 160;
      text('Bottom：', x, y);
      if (currentOutfit.bottom && clothingImages[currentOutfit.bottom.filename]) {
        let img = clothingImages[currentOutfit.bottom.filename];
        console.log('Bottom image:', img);
        if (img && img.width > 0) {
          imageMode(CORNER);
          console.log('Displaying bottom image:', currentOutfit.bottom.filename, 'size:', img.width, 'x', img.height);
          image(img, x + 200, y - 30, 150, 150);
        }
      }
      y += 20;
      if (currentOutfit.bottom && currentOutfit.bottom.tags) {
        text(currentOutfit.bottom.tags.join(', '), x + 70, y);
      }
    }
  }

// 檢查衣物是否符合標籤要求
function matchesRequirements(item, requiredTags) {
  return requiredTags.every(tag => item.tags.includes(tag));
}

// 從符合條件的衣物中隨機選擇
function getRandomItem(items, requiredTags) {
  const matching = items.filter(item => matchesRequirements(item, requiredTags));
  return matching.length > 0 ? matching[Math.floor(Math.random() * matching.length)] : null;
}

// 生成新搭配
function generateNewOutfit() {
  if (!currentWeather || !weatherRequirements[currentWeather]) {
    statusText = 'Please let the system detect the weather first!';
    return;
  }

  const requirements = weatherRequirements[currentWeather];
  let newOutfit;
  
  console.log('The current weather：', currentWeather);
  console.log('Weather demand：', requirements);

  const useDress = requirements.allowDress && Math.random() > 0.5;
  console.log('Whether to use a jumpsuit：', useDress);

  if (useDress) {
    const dress = getRandomItem(clothingItems, requirements.dress);
    console.log('The Dress found：', dress);
    if (dress) {
      newOutfit = { type: 'dress', dress: dress };
    }
  } else {
    const top = getRandomItem(clothingItems, requirements.top);
    const bottom = getRandomItem(clothingItems, requirements.bottom);
    console.log('The top found：', top);
    console.log('The bottom found：', bottom);
    if (top && bottom) {
      newOutfit = { type: 'separates', top: top, bottom: bottom };
    }
  }

  if (newOutfit && !isOutfitDisliked(newOutfit)) {
    currentOutfit = newOutfit;
    statusText = 'A new outfit has been generated.';
    console.log('New Outfit：', newOutfit);
  } else {
    statusText = 'Cant find a suitable outfit, please try again.';
    console.log('Unable to generate outfit');
  }
}

// 檢查是否為不喜歡的搭配
function isOutfitDisliked(outfit) {
  return dislikedOutfits.some(disliked => {
    if (outfit.type !== disliked.type) return false;
    
    if (outfit.type === 'dress') {
      return outfit.dress.filename === disliked.dress.filename;
    } else {
      return outfit.top.filename === disliked.top.filename && 
             outfit.bottom.filename === disliked.bottom.filename;
    }
  });
}

// 修改分類函數
function classifyVideo() {
  try {
    // 確保視訊和分類器都已就緒
    if (!video.loadedmetadata || !classifierReady) {
      return;
    }
    
    // 修改分類方式
    classifier.classify(video).then(results => {
      // 確保結果有效
      if (results && results.length > 0 && results[0].confidence > 0.8) {
        console.log('Classification results:', results[0].label, results[0].confidence);
        handleResult(results[0].label);
      }
    }).catch(error => {
      console.error('Classification errors:', error);
    });
  } catch (error) {
    console.error('An error occurred in the classification process.:', error);
  }
}


// 處理手勢結果
function handleResult(result) {
  switch (result) {
    case 'Like':
      if (currentOutfit) {
        const outfitCopy = JSON.parse(JSON.stringify(currentOutfit));
        if (!likedOutfits.some(outfit => JSON.stringify(outfit) === JSON.stringify(outfitCopy))) {
          likedOutfits.push(outfitCopy);
          statusText = 'Liked outfit has been recorded!';
          setTimeout(() => statusText = 'The model is in operation', 2000);
        }
      }
      break;
      
    case 'Dislike':
      if (currentOutfit) {
        const outfitCopy = JSON.parse(JSON.stringify(currentOutfit));
        if (!dislikedOutfits.some(outfit => JSON.stringify(outfit) === JSON.stringify(outfitCopy))) {
          dislikedOutfits.push(outfitCopy);
          statusText = 'The outfit you dont like has been noted!';
          setTimeout(() => statusText = 'The model is in operation', 2000);
        }
      }
      break;
      
    case 'Sunny':
    case 'Cloudy':
    case 'Rainy':
    case 'Night':
      if (result !== currentWeather) {
        currentWeather = result;
        generateNewOutfit();
      }
      break;
  }
}