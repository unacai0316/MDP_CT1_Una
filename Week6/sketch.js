let game;
let weatherSlider;

function setup() {
  // 創建畫布並附加到指定的 div
  let canvas = createCanvas(800, 600);
  canvas.parent('gameCanvas');

  game = new Game();
  noStroke();
  
  // 創建天氣滑桿
  weatherSlider = createSlider(0, 100, 50);
  weatherSlider.position(20, 60);
  weatherSlider.style('width', '200px');
}

function draw() {
      // 設置背景顏色
      background(200);

      // 在畫布上繪製一個矩形，代表 Lucy the Dog
      fill(255, 0, 0);
      rect(50, height - 100, 50, 50);
  game.update();
  game.display();
}

function keyPressed() {
  if (key === "a") {
    game.jump();
  }
  if (key === "r" || key === "R") {
    game.restart();
  }
}

class Game {
  constructor() {
    this.lucy = { width: 50, height: 50 }; // 簡化的Lucy為一個長方形
    this.bones = [];
    this.obstacles = [];
    this.score = 0;
    this.lives = 5;
    this.lucyX = width / 2;
    this.lucyY = height - 10;  // 將Lucy位置調整到接近地板
    this.isJumping = false;
    this.jumpHeight = 0;  
    this.gravity = 0.5;
    this.jumpForce = -10;
    this.velocity = 0;
    this.gameOver = false;
    this.weatherEffect = 0.5;
    this.initializeObjects();
  }

  initializeObjects() {
    this.bones = [];
    this.obstacles = [];
    // 創建初始骨頭
    for (let i = 0; i < 3; i++) {
      this.bones.push({
        x: random(width + 50, width + 200),
        y: random(height - 200, height - 100),
      });
    }
    // 創建初始障礙物（貓屎）
    for (let i = 0; i < 2; i++) {
      this.obstacles.push({
        x: random(width + 100, width + 300),
        y: height - 30,  // 調整到接近草地
        size: random(20, 40),
        tastyLevel: random(1, 5)
      });
    }
  }

  update() {
    if (this.gameOver) return;

    // 更新天氣效果
    this.weatherEffect = weatherSlider.value() / 100;
    this.jumpForce = map(this.weatherEffect, 0, 1, -8, -12);

    // 更新Lucy的跳躍
    if (this.isJumping) {
      this.velocity += this.gravity;
      this.lucyY += this.velocity;

      // 著地檢測
      if (this.lucyY > height - 10) {
        this.lucyY = height - 10;  // 調整著地位置
        this.isJumping = false;
        this.velocity = 0;
      }
    }

    // 更新骨頭位置並檢測碰撞
    for (let bone of this.bones) {
      bone.x -= 3;
      if (bone.x < -20) {
        bone.x = width + random(50, 200);
        bone.y = random(height - 200, height - 100);
      }
      if (dist(this.lucyX, this.lucyY, bone.x, bone.y) < 40) {
        this.score += 10;
        bone.x = width + random(50, 200);
        bone.y = random(height - 200, height - 100);
      }
    }

    // 更新貓屎位置並檢測碰撞
    for (let obstacle of this.obstacles) {
      obstacle.x -= 4;
      if (obstacle.x < -30) {
        obstacle.x = width + random(100, 300);
        obstacle.y = height - 30;
        obstacle.tastyLevel = random(1, 5);
        obstacle.size = map(obstacle.tastyLevel, 1, 5, 20, 40);
      }
      if (this.checkCollision(obstacle)) {
        this.lives--;
        obstacle.x = width + random(100, 300);
        if (this.lives <= 0) {
          this.gameOver = true;
        }
      }
    }
  }

  checkCollision(obstacle) {
    return (
      this.lucyX + this.lucy.width > obstacle.x &&
      this.lucyX < obstacle.x + obstacle.size &&
      this.lucyY + this.lucy.height > obstacle.y - obstacle.size
    );
  }

  display() {
    // 根據天氣效果調整背景顏色
    let bgColor = map(this.weatherEffect, 0, 1, 150, 240);
    background(bgColor);

    // 繪製地面
    fill(150, 200, 50);
    rect(0, height - 20, width, 20);

    // 顯示分數
    fill(0);
    textSize(24);
    text(`Score: ${this.score}`, 20, 30);
    
    // 顯示天氣狀態
    text(`Weather: ${floor(this.weatherEffect * 100)}%`, 230, 30);

    // 顯示生命值
    this.displayLives();

    // 繪製Lucy為長方形
    fill(255, 0, 0);  // 設定Lucy的顏色
    rect(this.lucyX - this.lucy.width / 2, this.lucyY - this.lucy.height, this.lucy.width, this.lucy.height);

    // 繪製骨頭
    fill(255);
    for (let bone of this.bones) {
      this.drawBone(bone.x, bone.y);
    }

    // 繪製貓屎（障礙物）
    for (let obstacle of this.obstacles) {
      this.drawPoop(obstacle);
    }

    // 顯示遊戲結束
    if (this.gameOver) {
      fill(0, 0, 0, 150);
      rect(0, 0, width, height);
      fill(255);
      textSize(32);
      textAlign(CENTER, CENTER);
      text("Game Over!", width/2, height/2);
      text(`Final Score: ${this.score}`, width/2, height/2 + 40);
      text("Press R to Restart", width/2, height/2 + 80);
    }
  }

  displayLives() {
    for (let i = 0; i < this.lives; i++) {
      this.drawHeart(80 + i * 30, 80);
    }
  }

  drawHeart(x, y) {
    fill(255, 0, 0);
    beginShape();
    vertex(x, y + 5);
    bezierVertex(x - 5, y, x - 10, y, x - 10, y + 5);
    bezierVertex(x - 10, y + 10, x - 5, y + 15, x, y + 20);
    bezierVertex(x + 5, y + 15, x + 10, y + 10, x + 10, y + 5);
    bezierVertex(x + 10, y, x + 5, y, x, y + 5);
    endShape();
  }

  drawPoop(obstacle) {
    push();
    fill(139, 69, 19);
    let size = obstacle.size;
    // 繪製卡通風格的貓屎
    ellipse(obstacle.x, obstacle.y - size/2, size, size * 0.7);
    ellipse(obstacle.x - size/4, obstacle.y - size, size * 0.7, size * 0.5);
    ellipse(obstacle.x + size/4, obstacle.y - size * 0.8, size * 0.6, size * 0.4);
    pop();
  }
 
  drawBone(x, y) {
    push();
    fill(255);
    ellipse(x - 15, y, 20, 15);
    rect(x - 10, y - 5, 20, 10);
    ellipse(x + 15, y, 20, 15);
    pop();
  }

  jump() {
    if (!this.isJumping && !this.gameOver) {
      this.isJumping = true;
      this.velocity = this.jumpForce;
    }
  }

  restart() {
    this.score = 0;
    this.lives = 5;
    this.gameOver = false;
    this.lucyY = height - 10;  // 重置Lucy位置
    this.initializeObjects();  // 重新初始化物件
  }
}
