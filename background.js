/*
HEYO! Welcome to the out back background file mate :)

This file handles our popup notifications and Syncing our JSON Data to 
the DJANGO Backend server.

This file will listen for updates from our content file when new assignments are detected
If detected it also will create a popup, if the user chooses to sync it will send the data
gathered in our content file to our DJANGO backend server to be parsed and synced up ;)

Interactions:
- content.js -> Listens for new assignment messages
- chrome.notifications -> Shows a popup when new assignments are detected
- Django backend -> Sends assignment data to be parsed in Python

This is looking quite lovley :)
*/



console.log("✅ Background script is running!");

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Received message in background.js:", request);

    if (request.action === "sendAssignmentsData") {
        console.log("📤 Processing assignments data...");

        // Ensure payload exists and has assignments
        if (!request.payload || !Array.isArray(request.payload.assignments) || request.payload.assignments.length === 0) {
            console.warn("⚠️ No valid assignments found.");
            sendResponse({ success: false, message: "No assignments found in payload." });
            return;
        }

        let className = request.payload.className || "Unknown Class";

        // Convert data into properly structured JSON
        let formattedData = {
            className: className,
            assignments: request.payload.assignments.map(assignment => ({
                title: assignment.title || "Untitled",
                link: assignment.link || "No Link",
                dueDate: assignment.dueDate || "No Due Date",
                points: assignment.points || "No Points",
                className: className
            }))
        };

        console.log("📦 Formatted Assignments Data:", JSON.stringify(formattedData, null, 2));

        // Send formatted data to Django
        fetch("http://127.0.0.1:8000/api/assignments/sync/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData)
        })
        .then(response => response.json().catch(() => null)) // Catch JSON parse errors
        .then(data => {
            if (!data) {
                console.error("❌ Django response was not valid JSON.");
                sendResponse({ success: false, message: "Django returned an invalid response." });
                return;
            }

            console.log("✅ Django Response:", data);
            sendResponse({ success: true, message: "Data sent to Django!", djangoResponse: data });
        })
        .catch(error => {
            console.error("❌ Error sending to Django:", error);
            sendResponse({ success: false, message: "Failed to send data to Django.", error: error.message });
        });

        return true; // Required for async response
    }
});

