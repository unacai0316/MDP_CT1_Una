let bees = [];
let flower;
let lastColorChangeTime = 0;
let colorChangeInterval = 2000; // 2 seconds
let beeSpeed = 0.01; // Initial speed

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('sketch-holder'); // Specify the parent element for the canvas

  flower = new Flower(width / 2, height / 2, 100);
  // Create 5 bees
  for (let i = 0; i < 50; i++) {
    bees.push(new Bee(random(width), random(height)));
  }
  noStroke();
}

function draw() {
  background(255, 255, 255, 90);

  flower.display();

  for (let bee of bees) {
    bee.update();
    bee.display();
  }

  if (millis() - lastColorChangeTime > colorChangeInterval) {
    for (let bee of bees) {
      bee.changeColors();
      flower.changeColors(); 
    }
    lastColorChangeTime = millis();
  }
}

class Flower {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.petalColor = color(255, 200, 200);
    this.centerColor = color(255, 255, 0);
    this.noiseOffsets = Array(6)
      .fill()
      .map(() => random(1000));
  }
  
  changeColors() {
    this.petalColor = color(255, random(0, 255), 100);
    this.centerColor = color(255, random(0, 255), 0);
  }

  display() {
    push();
    translate(this.x, this.y);

    // Petals
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

    // Center
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
    this.center = createVector(width / 2, height / 2);
    this.radius = dist(x, y, this.center.x, this.center.y);
    this.angle = atan2(y - this.center.y, x - this.center.x);
    this.speed = random(0.001, 0.008); // Adjust speed range
    this.bodyColor = color(255, random(100, 255), 0, 200);
    this.wingColor = color(100, 100, random(150, 255), 50);
    this.stingColor = color(random(), random(), random(), 50);
    this.noiseOffsets = Array(6).fill().map(() => random(1000));
  }

  update() {
    this.angle += this.speed;
    this.radius += sin(frameCount * 0.1) * 0.5; // Add some "buzz" to the radius
  }

  changeColors() {
    this.bodyColor = color(255, random(100, 255), 0, 200);
    this.wingColor = color(100, 100, random(100, 255), 80);
    this.stingColor = color(random(), random(), random(), 50);
  }

  display() {
    let x = this.center.x + cos(this.angle) * this.radius;
    let y = this.center.y + sin(this.angle) * this.radius;

    push();
    translate(x, y);
    rotate(this.angle + PI / 2);

    // sting
    push();
    translate(-8, 0);
    rotate(radians(180)); 
    fill(this.stingColor);
    this.drawOrganicTriangle(0, 0, 10, 4, this.noiseOffsets[0]);
    pop();
    
    // eye_white
    fill("lightgrey");
    this.drawOrganicShape(25, -3, 15, 15, this.noiseOffsets[0]);
    this.drawOrganicShape(25, 3, 15, 15, this.noiseOffsets[1]);

    // eye
    fill("black");
    this.drawOrganicShape(25, -3, 5, 5, this.noiseOffsets[0]);
    this.drawOrganicShape(25, 3, 5, 5, this.noiseOffsets[1]);
    
    // Body
    fill(this.bodyColor);
    this.drawOrganicShape(3, 0, 30, 20, this.noiseOffsets[0]);
    this.drawOrganicShape(20, 0, 15, 15, this.noiseOffsets[1]);

    // left wings_top
    push();
    translate(10, -10);
    rotate(radians(40)); 
    fill(this.wingColor);
    this.drawOrganicShape(0, 0, 30, 15, this.noiseOffsets[3]);
    pop();

    // right wings
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
