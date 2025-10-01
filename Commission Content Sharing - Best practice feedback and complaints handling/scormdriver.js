// SCORM 1.2 API Implementation for Rustici Dispatch Package
// This is the missing scormdriver.js file that the dispatch.html is trying to load

var API = null;
var findAPITries = 0;

// Enhanced findAPI function for Rustici Dispatch packages
function findAPI(win) {
    var findAttempts = 0;
    var maxAttempts = 7;
    
    while (win && findAttempts < maxAttempts) {
        // Check if this window has the API
        if (win.API && win.API.LMSInitialize) {
            console.log("SCORM API found at level:", findAttempts);
            return win.API;
        }
        
        // Move to parent window
        if (win.parent && win.parent !== win) {
            win = win.parent;
            findAttempts++;
        } else {
            break;
        }
    }
    
    console.log("SCORM API not found after", findAttempts, "attempts");
    return null;
}

// Get the API with proper error handling
function getAPI() {
    if (API === null) {
        API = findAPI(window);
    }
    return API;
}

// SCORM 1.2 API Functions
function LMSInitialize(parameter) {
    console.log("LMSInitialize called with:", parameter);
    var api = getAPI();
    if (api && api.LMSInitialize) {
        try {
            var result = api.LMSInitialize(parameter);
            console.log("LMSInitialize result:", result);
            return result;
        } catch (error) {
            console.error("LMSInitialize error:", error);
            return "false";
        }
    }
    console.warn("LMSInitialize: No API available");
    return "false";
}

function LMSFinish(parameter) {
    console.log("LMSFinish called with:", parameter);
    var api = getAPI();
    if (api && api.LMSFinish) {
        try {
            var result = api.LMSFinish(parameter);
            console.log("LMSFinish result:", result);
            return result;
        } catch (error) {
            console.error("LMSFinish error:", error);
            return "false";
        }
    }
    console.warn("LMSFinish: No API available");
    return "false";
}

function LMSGetValue(element) {
    console.log("LMSGetValue called for:", element);
    var api = getAPI();
    if (api && api.LMSGetValue) {
        try {
            var result = api.LMSGetValue(element);
            console.log("LMSGetValue result:", result);
            return result;
        } catch (error) {
            console.error("LMSGetValue error:", error);
            return "";
        }
    }
    console.warn("LMSGetValue: No API available");
    return "";
}

function LMSSetValue(element, value) {
    console.log("LMSSetValue called for:", element, "value:", value);
    var api = getAPI();
    if (api && api.LMSSetValue) {
        try {
            var result = api.LMSSetValue(element, value);
            console.log("LMSSetValue result:", result);
            return result;
        } catch (error) {
            console.error("LMSSetValue error:", error);
            return "false";
        }
    }
    console.warn("LMSSetValue: No API available");
    return "false";
}

function LMSCommit(parameter) {
    console.log("LMSCommit called with:", parameter);
    var api = getAPI();
    if (api && api.LMSCommit) {
        try {
            var result = api.LMSCommit(parameter);
            console.log("LMSCommit result:", result);
            return result;
        } catch (error) {
            console.error("LMSCommit error:", error);
            return "false";
        }
    }
    console.warn("LMSCommit: No API available");
    return "false";
}

function LMSGetLastError() {
    var api = getAPI();
    if (api && api.LMSGetLastError) {
        try {
            return api.LMSGetLastError();
        } catch (error) {
            console.error("LMSGetLastError error:", error);
            return "0";
        }
    }
    return "0";
}

function LMSGetErrorString(errorCode) {
    var api = getAPI();
    if (api && api.LMSGetErrorString) {
        try {
            return api.LMSGetErrorString(errorCode);
        } catch (error) {
            console.error("LMSGetErrorString error:", error);
            return "";
        }
    }
    return "";
}

function LMSGetDiagnostic(errorCode) {
    var api = getAPI();
    if (api && api.LMSGetDiagnostic) {
        try {
            return api.LMSGetDiagnostic(errorCode);
        } catch (error) {
            console.error("LMSGetDiagnostic error:", error);
            return "";
        }
    }
    return "";
}

console.log("SCORM 1.2 API functions loaded for Rustici Dispatch package");