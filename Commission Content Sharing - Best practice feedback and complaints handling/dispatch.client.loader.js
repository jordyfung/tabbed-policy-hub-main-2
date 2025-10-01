// Dispatch Client Loader for Rustici Dispatch Package
// This is the missing dispatch.client.loader.js file

var strLMSStandard = "SCORM";
var DebugMode = false;

function Start() {
    console.log("Dispatch Start called");
    
    // Initialize the SCORM content
    if (typeof LMSInitialize !== 'undefined') {
        var result = LMSInitialize('');
        console.log("LMSInitialize result:", result);
    }
    
    // Load the actual course content
    console.log("Starting to load course content...");
    LoadContent();
}

function LoadContent() {
    console.log("LoadContent called");
    
    // Load the SCORM content directly into the content frame
    fetch('blank.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load course content: ' + response.status);
            }
            return response.text();
        })
        .then(html => {
            // Extract just the body content from the HTML
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const content = bodyMatch ? bodyMatch[1] : html;
            
            // Hide loading frame and show content frame
            const loadingFrame = document.getElementById('dispatch_loading_frame');
            const contentFrame = document.getElementById('dispatch_content_frame');
            
            if (loadingFrame) loadingFrame.style.display = 'none';
            if (contentFrame) {
                contentFrame.style.display = 'block';
                contentFrame.innerHTML = content;
            }
            
            console.log("SCORM content loaded successfully");
        })
        .catch(error => {
            console.error("Error loading SCORM content:", error);
            // Fallback: show error message
            const loadingFrame = document.getElementById('dispatch_loading_frame');
            const contentFrame = document.getElementById('dispatch_content_frame');
            
            if (loadingFrame) loadingFrame.style.display = 'none';
            if (contentFrame) {
                contentFrame.style.display = 'block';
                contentFrame.innerHTML = '<div style="padding: 20px; font-family: Arial, sans-serif;"><h1>SCORM Course</h1><p>Error loading course content. Please try again.</p></div>';
            }
        });
}

function Unload() {
    console.log("Dispatch Unload called");
    // Clean up when leaving the content
    if (typeof LMSFinish !== 'undefined') {
        var result = LMSFinish('');
        console.log("LMSFinish result:", result);
    }
}

function ShowDebugWindow() {
    console.log("Debug window would be shown here");
}

function WriteToDebug(message) {
    console.log("Debug:", message);
}

// Make functions globally available
window.Start = Start;
window.LoadContent = LoadContent;
window.Unload = Unload;
window.ShowDebugWindow = ShowDebugWindow;
window.WriteToDebug = WriteToDebug;

console.log("Dispatch Client Loader loaded for Rustici Dispatch package");