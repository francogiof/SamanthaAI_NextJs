// Get the canvas element from the HTML document using its ID
const canvas = document.getElementById('waterCanvas');

// Get the 2D drawing context for the canvas, which allows drawing shapes, text, and images
const ctx = canvas.getContext('2d');

// Setting the canvas width and height to match the window's inner width and height
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Array to store all the wave configurations
const waves = [];

// Number of wave lines to be drawn on the canvas
const waveCount = 20;

// Initialize the waves array with random properties for each wave
for (let i = 0; i < waveCount; i++) {
    waves.push({
        // The vertical position (y-axis) of the wave, randomized within a certain range
        y: (canvas.height / 2) - 100 + Math.random() * 200,
        // The length determines the horizontal stretch of the wave; small values create more waves per screen width
        length: 0.01 + Math.random() * 0.001,
        // Amplitude defines the height (intensity) of the wave oscillations
        amplitude: 50 + Math.random() * 100,
        // Frequency controls how fast the wave oscillates or moves horizontally
        frequency: 0.01 + Math.random() * 0.03,
        // Phase shifts the wave horizontally, so each wave starts at a different position
        phase: Math.random() * Math.PI * 2
    });
}

// The main animation loop that updates and renders the waves on the canvas
function animate() {

    // Requesting the next animation frame to keep the loop going
    requestAnimationFrame(animate);

    // Create a semi-transparent black background to blend with previous frames, leaving a subtle trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Loop through each wave and draw it on the canvas
    waves.forEach((wave, index) => {
        // Start a new drawing path for each wave
        ctx.beginPath();
        // Set the starting point of the wave (x = 0)
        ctx.moveTo(0, wave.y);

        // Loop through each pixel on the canvas width to calculate and draw the wave
        for (let i = 0; i < canvas.width; i++) {
            // Calculate the vertical offset (yOffset) using a sine wave formula
            const yOffset = Math.sin(i * wave.length + wave.phase) * wave.amplitude * Math.sin(wave.phase);
            // Draw the line segment from the previous point to the new point with yOffset
            ctx.lineTo(i, wave.y + yOffset);
        }

        // Set the color of the wave using HSL (Hue, Saturation, Lightness), with different hues for each wave
        ctx.strokeStyle = `hsl(${index / 2 + 170}, 100%, 50%)`;
        // Draw the wave line on the canvas
        ctx.stroke();

        // Update the wave's phase to make it move horizontally for the next frame
        wave.phase += wave.frequency;
    });
}

// Lets Start the animation loop
animate();

// Event listener to handle the browser window being resized
window.addEventListener('resize', () => {
    // Update the canvas size to the new window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Update the y position of each wave to fit within the resized canvas
    waves.forEach((wave) => {
        wave.y = (canvas.height / 2) - 100 + Math.random() * 200;
    });
});

// Subscribe Coding Wave to get more cool stuff. Thanks