// Code highlighting and loading
document.addEventListener('DOMContentLoaded', function() {
    // Load initial temperature sensor code
    const initialTempCode = `#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
    Serial.begin(9600);
    sensors.begin();
}

void loop() {
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);
    Serial.print(tempC);
    Serial.println("°C");
    delay(1000);
}`;
    
    // Load pressure sensor code
    const pressureCode = `const int PRESSURE_PIN = 36;  // A0

void setup() {
    Serial.begin(9600);
    pinMode(PRESSURE_PIN, INPUT);
}

void loop() {
    int pressureValue = analogRead(PRESSURE_PIN);
    Serial.println(pressureValue);
    delay(100);
}`;

    // Load button test code
    const buttonCode = `const int BUTTON_PIN = 33;  // A5

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
    int buttonState = digitalRead(BUTTON_PIN);
    Serial.println(buttonState);
    delay(100);
}`;

    // Set code content
    document.getElementById('initial-temp-code').textContent = initialTempCode;
    document.getElementById('pressure-code').textContent = pressureCode;
    document.getElementById('button-code').textContent = buttonCode;

    // Add smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add image loading animation
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
    });
});

// Add code copy functionality
document.querySelectorAll('.code-container').forEach(container => {
    const codeBlock = container.querySelector('code');
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'copy-btn';
    container.insertBefore(copyButton, codeBlock);

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
            });
    });
});