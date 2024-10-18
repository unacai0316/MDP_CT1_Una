let bees = []; // 儲存蜜蜂對象的陣列
let flower; // 花朵對象
let lastColorChangeTime = 0; // 上次顏色變化的時間戳
let colorChangeInterval = 2000; // 顏色變化的間隔時間（2秒）
let beeSpeed = 0.01; // 蜜蜂的初始速度

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('sketch-holder'); // 指定畫布的父元素

  flower = new Flower(width / 2, height / 2, 100); // 在畫布中心創建一朵花
  // 創建 50 隻蜜蜂
  for (let i = 0; i < 50; i++) {
    bees.push(new Bee(random(width), random(height))); // 在隨機位置創建蜜蜂
  }
  noStroke(); // 禁用形狀的描邊
}

function draw() {
  background(255, 255, 255, 90); // 半透明的白色背景，用於運動模糊效果

  flower.display(); // 顯示花朵

  // 更新並顯示每隻蜜蜂
  for (let bee of bees) {
    bee.update();
    bee.display();
  }

  // 在指定的間隔時間內改變蜜蜂和花朵的顏色
  if (millis() - lastColorChangeTime > colorChangeInterval) {
    for (let bee of bees) {
      bee.changeColors(); // 改變蜜蜂的顏色
    }
    flower.changeColors(); // 改變花朵的顏色
    lastColorChangeTime = millis(); // 更新上次顏色變化的時間戳
  }
}

class Flower {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.petalColor = color(255, 200, 200); // 花瓣顏色
    this.centerColor = color(255, 255, 0); // 花心顏色
    this.noiseOffsets = Array(6)
      .fill()
      .map(() => random(1000)); // 噪聲偏移量，用於生成有機形狀
  }
  
  changeColors() {
    this.petalColor = color(255, random(0, 255), 100); // 隨機改變花瓣顏色
    this.centerColor = color(255, random(0, 255), 0); // 隨機改變花心顏色
  }

  display() {
    push();
    translate(this.x, this.y);

    // 花瓣
    fill(this.petalColor);
    for (let i = 0; i < 5; i++) {
      this.drawOrganicShape(
        0,
        -this.size / 2,
        this.size / 2,
        this.size,
        this.noiseOffsets[i]
      );
      rotate(TWO_PI / 5);
    }

    // 花心
    fill(this.centerColor);
    this.drawOrganicShape(
      0,
      0,
      this.size / 2,
      this.size / 2,
      this.noiseOffsets[5]
    );

    pop();
  }

  drawOrganicShape(x, y, w, h, noiseOffset) {
    push();
    translate(x, y);
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let xoff = map(cos(a), -1, 1, 0, 1);
      let yoff = map(sin(a), -1, 1, 0, 1);
      let r = map(
        noise(xoff, yoff, frameCount * 0.02 + noiseOffset),
        0,
        1,
        0.5,
        1.2
      );
      let px = ((r * w) / 2) * cos(a);
      let py = ((r * h) / 2) * sin(a);
      vertex(px, py);
    }
    endShape(CLOSE);
    pop();
  }
}

class Bee {
  constructor(x, y) {
    this.center = createVector(width / 2, height / 2); // 蜜蜂繞著中心點飛行
    this.radius = dist(x, y, this.center.x, this.center.y); // 蜜蜂與中心點的距離
    this.angle = atan2(y - this.center.y, x - this.center.x); // 蜜蜂與中心點的角度
    this.speed = random(0.001, 0.008); // 蜜蜂的速度範圍
    this.bodyColor = color(255, random(100, 255), 0, 200); // 蜜蜂身體顏色
    this.wingColor = color(100, 100, random(150, 255), 50); // 蜜蜂翅膀顏色
    this.stingColor = color(random(), random(), random(), 50); // 蜜蜂尾刺顏色
    this.noiseOffsets = Array(6).fill().map(() => random(1000)); // 噪聲偏移量，用於生成有機形狀
  }

  update() {
    this.angle += this.speed; // 更新蜜蜂的角度
    this.radius += sin(frameCount * 0.1) * 0.5; // 增加半徑的“嗡嗡”效果
  }

  changeColors() {
    this.bodyColor = color(255, random(100, 255), 0, 200); // 隨機改變蜜蜂身體顏色
    this.wingColor = color(100, 100, random(100, 255), 80); // 隨機改變蜜蜂翅膀顏色
    this.stingColor = color(random(), random(), random(), 50); // 隨機改變蜜蜂尾刺顏色
  }

  display() {
    let x = this.center.x + cos(this.angle) * this.radius; // 計算蜜蜂的 x 坐標
    let y = this.center.y + sin(this.angle) * this.radius; // 計算蜜蜂的 y 坐標

    push();
    translate(x, y);
    rotate(this.angle + PI / 2);

    // 尾刺
    push();
    translate(-8, 0);
    rotate(radians(180)); 
    fill(this.stingColor);
    this.drawOrganicTriangle(0, 0, 10, 4, this.noiseOffsets[0]);
    pop();
    
    // 眼睛白色部分
    fill("lightgrey");
    this.drawOrganicShape(25, -3, 15, 15, this.noiseOffsets[0]);
    this.drawOrganicShape(25, 3, 15, 15, this.noiseOffsets[1]);

    // 眼睛黑色部分
    fill("black");
    this.drawOrganicShape(25, -3, 5, 5, this.noiseOffsets[0]);
    this.drawOrganicShape(25, 3, 5, 5, this.noiseOffsets[1]);
    
    // 身體
    fill(this.bodyColor);
    this.drawOrganicShape(3, 0, 30, 20, this.noiseOffsets[0]);
    this.drawOrganicShape(20, 0, 15, 15, this.noiseOffsets[1]);

    // 左上翅膀
    push();
    translate(10, -10);
    rotate(radians(40)); 
    fill(this.wingColor);
    this.drawOrganicShape(0, 0, 30, 15, this.noiseOffsets[3]);
    pop();

    // 右下翅膀
    push();
    translate(10, 10); 
    rotate(radians(-45)); 
    fill(this.wingColor);
    this.drawOrganicShape(0, 0, 30, 15, this.noiseOffsets[3]);
    pop(); 
    pop();
  }

  drawOrganicShape(x, y, w, h, noiseOffset) {
    push();
    translate(x, y);
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let xoff = map(cos(a), -1, 1, 0, 1);
      let yoff = map(sin(a), -1, 1, 0, 1);
      let r = map(
        noise(xoff, yoff, frameCount * 0.02 + noiseOffset),
        0,
        1,
        0.3,
        1.8
      );

      let px = ((r * w) / 2) * cos(a);
      let py = ((r * h) / 2) * sin(a);
      vertex(px, py);
    }
    endShape(CLOSE);
    pop();
  }
  
  drawOrganicTriangle(x, y, w, h, noiseOffset) {
    push();
    translate(x, y);
    beginShape();
    
    for (let i = 0; i < 3; i++) {
      let angle = TWO_PI / 3 * i; 
      let xoff = map(cos(angle), -1, 1, 0, 1);
      let yoff = map(sin(angle), -1, 1, 0, 1);
      
      let r = map(
        noise(xoff, yoff, frameCount * 0.02 + noiseOffset),
        0,
        1,
        0.8,
        1.2
      );
      
      let px = r * w * cos(angle); 
      let py = r * h * sin(angle); 
      vertex(px, py); 
    }
    
    endShape(CLOSE);
    pop();
  }
}
