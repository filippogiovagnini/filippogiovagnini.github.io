// script.js
document.addEventListener("DOMContentLoaded", function() {
    const text = "Filippo Giovagnini";
    const typingTextElement = document.getElementById("typing-text");
    let index = 0;

    function type() {
        if (index < text.length) {
            typingTextElement.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor"></span>';
            index++;
            setTimeout(type, 100); // Adjust typing speed here
        } else {
            typingTextElement.innerHTML = "Filippo Giovagnini"; // Add new content to the new element
        }
            
    }

    typingTextElement.innerHTML = ""; // Clear the initial text
    type();
});