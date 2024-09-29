// Select the existing elements
let DOMsection = document.getElementById("DOMsection");
let buttonColor = document.getElementById("btnColorChange");
let toggleImage = document.getElementById("btnImageToggle");
let galleryIMG = document.getElementById("imageGallery").children[0];

// Add a new paragraph to the DOMsection
let newParagraph = document.createElement("p");
newParagraph.innerText = "Hello World!";
DOMsection.appendChild(newParagraph);

// Function to toggle the visibility of the image
let ImageToggle = function() {
    console.log("Image toggled");

    // Get the full URL of the current image source
    let currentSrc = galleryIMG.src;
    console.log("Current image source:", currentSrc);

    // Compare the full URL with the expected full URLs
    if (currentSrc.includes("images/gallery1.jpg")) {
        console.log("gallery 1");
        galleryIMG.src = "images/gallery2.jpg";
    } else {
        console.log("gallery 2");
        galleryIMG.src = "images/gallery1.jpg";
    }
}

// Add event listener to the toggle image button
toggleImage.addEventListener("click", ImageToggle);

// Add event listener to the existing button
buttonColor.addEventListener("click", function() {
    let redPortion = Math.floor(Math.random() * 256);
    let greenPortion = Math.floor(Math.random() * 256);
    let bluePortion = Math.floor(Math.random() * 256);

    let randomColor = "rgb(" + redPortion + ", " + greenPortion + ", " + bluePortion + ")";
    console.log(randomColor);
    DOMsection.style.backgroundColor = randomColor;
});