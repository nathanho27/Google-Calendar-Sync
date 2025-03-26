/*----------------------------------------------------------------------------------------------------------------------------------
Welcome to the Content file!!!!
    This file is used in order to run script on Canvas or Gradescope. When a user has our extension 
    unpacked and visits either site this file automatically injects itself :)

How we will use this: 
    We will create funtions to extract data from our sites as a JSON file,

    We will be reading our data into and from a chrome.storage.local.
    This will be done so we can check for "New" assignments dynamically 
    so as  not to bombard the user with popups asking to sync thir calander.

    If the user chooses to sync we will extract the entire page as a JSON it then 
    will send it to our background script file in order to be further processed.

    This will happen whenever a user is on their assignments page and if they are
    on their dashboard they will have the ability to allow automatic navigation to
    gather the data from all of their classes as well.

Interactions:
- chrome.storage.local -> Checks for new assignments before sending data
- background.js -> Sends a message when new assignments are detected
- popup.js -> Allows for manual interaction with all the functions

NOTE: PLEASE USE LET FOR VARIABLE DECLARATION NOT VAR!!!!!

Further explanation will be given in inline comments
Feel free to look things over :)
*/
//----------------------------------------------------------------------------------------------------------------------------------
// Initial Log

// Initial log to test proper integration on the correct sites
console.log("Student Calander Extension Loaded!");


//----------------------------------------------------------------------------------------------------------------------------------
// Correct Page Detection Functions


// Function to detect if we are on a Canvas Assignments page
function canvasAssignmentsOpen() 
{
    // Simply returns weather our path containes both courses and assignments to determine if we are on our assignemnts tab
    return window.location.pathname.includes("/courses/") && window.location.pathname.includes("/assignments");
}


// Function to detect if we are on Gradescopes courses page
function gradescopeCoursesOpen()
{
    // Simply returns weather our path contains courses on Gradescope
    if(window.location.hostname.includes("gradescope.com"))
    {
        return window.location.pathname.includes("/courses/");
    }
}



//----------------------------------------------------------------------------------------------------------------------------------
// Main function for canvas data extraction and parsing


// Function to extract the Assignments in JSON form
function extractAssignmentsData() 
{
    // On canvas on the assignment page all of the assignment data is stored under a div with id #ag-list so we check this
    let canvasAssignmentsDiv = document.querySelector("#ag-list");

    // Parsing the data into JSON format
    let assignments = [];
    
    // Find the class name from the #breadcrumbs
    let className = "Unknown Class";
    let breadcrumbs = document.querySelector("#breadcrumbs ul li:nth-child(2) a span.ellipsible");

    if (breadcrumbs) 
    {
        className = breadcrumbs.innerText.trim();
    }

    // This gets all of our elements that are under Canvas' assignment class ie our assignments
    let assignmentElements = canvasAssignmentsDiv.querySelectorAll(".assignment");

    // For loop to go through our assignments to parse to JSON
    for (let i = 0; i < assignmentElements.length; i++) 
    {
        // Our Current assignment
        let assignment = assignmentElements[i]; 

        // Extract title On canvas under .ig-title
        let titleElement = assignment.querySelector(".ig-title");
        let title = titleElement ? titleElement.innerText.trim() : "No Title";

        // Extract link (Also under .ig-title but this time getting the hyperlink to access the assignment)
        let linkElement = assignment.querySelector(".ig-title");
        let link = linkElement ? linkElement.href : "No Link";

        // Extract due date (under .assignment-date-due but have to specify the span for date since extra text)
        let dueDateElement = assignment.querySelector(".assignment-date-due span");
        let dueDate = dueDateElement ? dueDateElement.innerText.trim() : "No Due Date";

        // Extract the point total (do .score-display not screenreader to get numeric value)
        let pointsElement = assignment.querySelector(".score-display");
        let points = pointsElement ? pointsElement.innerText.trim() : "No Points";

        // Create the assignment object
        let assignmentData = {
            title: title,
            link: link,
            dueDate: dueDate,
            points: points,
            className: className 
        };

        // Add the assignment object to the array :)
        assignments.push(assignmentData);
    }

    // Put Raw Data together for our Json format
    let rawData = 
    {
        url: window.location.href,
        documentTitle: document.title,
        totalAssignments: assignments.length,
        className: className, 
        assignments: assignments,
        extractedAt: new Date().toISOString()
    };

    // Log to check formatting when extracting the data
    console.log("Corrected Data Extraction:", rawData);

    // Do popup and send to Background
    showSyncPopup(rawData, assignments.length);
}



//----------------------------------------------------------------------------------------------------------------------------------
// Main Function for Gradescope Extraction and Parsing


function extractCoursesData() 
{
    // On Gradescope courses page, all assignment data is stored inside a table this is tougher cause old and unsubmitted assignments are stored diff
    let gradescopeAssignmentsDiv = document.querySelector("table.dataTable.no-footer");

    // Parsing the data into JSON format
    let assignments = [];

    // Getting the title element from Gradescope
    let className = "Unknown Class";
    let classNameElement = document.querySelector(".courseHeader--title");
    if (classNameElement) 
    {
        className = classNameElement.innerText.trim();
    }

    // Ensure the table exists before proceeding
    if (gradescopeAssignmentsDiv) 
    {
        // Get all rows from the table body curent and past assignments
        let assignmentElements = gradescopeAssignmentsDiv.querySelectorAll("tbody tr");

        for (let i = 0; i < assignmentElements.length; i++) 
        {
            let assignment = assignmentElements[i];

            // Initialize default values
            let title = "No Title";
            let link = "No Link";  
            let dueDate = "No Due Date";  
            let points = "No Points"; 

            // Extract title This is the same for both submitted or not
            let titleElement = assignment.querySelector("th.table--primaryLink");
            if (titleElement) 
            {
                title = titleElement.innerText.trim();
            }

            // Try extracting a link, but if none exists, use a a different link like the link for the class
            let linkElement = assignment.querySelector("th.table--primaryLink a");
            if (linkElement) 
            {
                link = "https://www.gradescope.com" + linkElement.getAttribute("href");
            }
            else 
            {
                console.warn(`'${title}' has no submission link, using class link instead.`);
                link = window.location.href;  // Class Link
            }

            // Extract due date
            let dueDateElement = assignment.querySelector("time.submissionTimeChart--dueDate");
            if (dueDateElement) 
            {
                dueDate = dueDateElement.innerText.trim();
            }

            // Extract points 
            let pointsElement = assignment.querySelector("td.submissionStatus .submissionStatus--score");
            if (pointsElement) 
            {
                points = pointsElement.innerText.trim();
            }

            // Handle No Submission On its own because its a pain any other way XD
            let noSubmissionElement = assignment.querySelector("div.submissionStatus--text");
            if (noSubmissionElement && noSubmissionElement.innerText.includes("No Submission")) 
            {
                console.warn(`'${title}' has no submission link.`);
            }

            // Make sure ALL values are properly formatted because it can be a disaster
            if (!title || title.trim() === "") title = "Untitled Assignment";
            if (!link || link.trim() === "") link = window.location.href;
            if (!dueDate || dueDate.trim() === "") dueDate = "No Due Date";
            if (!points || points.trim() === "") points = "No Points";

            //  Log assignment before creating it
            console.log(" Checking assignment:", 
            {
                title,
                link,
                dueDate,
                points,
                className
            });

            // Create the assignment object
            let assignmentData = 
            {
                title: title,
                link: link,
                dueDate: dueDate,
                points: points,
                className: className
            };

            // Add to the assignments array
            assignments.push(assignmentData);
        }
    }

    // Put Raw Data together for JSON format
    let rawData = 
    {
        url: window.location.href,
        documentTitle: document.title,
        totalAssignments: assignments.length,
        className: className,
        assignments: assignments,
        extractedAt: new Date().toISOString()
    };

    // If no valid assignments don't send a request because otherwise we get push errors on django
    if (assignments.length === 0) 
    {
        console.error("No assignments were extracted. Not sending request.");
        return;
    }

    // Another log to check this nightmare one last time :)
    console.log("FINAL JSON TO SEND:", JSON.stringify(rawData, null, 2));

    // Do popup and send data to background
    showSyncPopup(rawData, assignments.length);
}




//----------------------------------------------------------------------------------------------------------------------------------
// Send Data to Background Javascript through chrome message (also helps with storage)


// Writing a function to send our data to the background file to be processed
function sendToBackground(assignmentsData) 
{
    console.log("Sending assignments data to background.js");
    
    // Chrome Api tool used to send a message to our background in a chrome extension
    chrome.runtime.sendMessage(
    {
        // The action determines the message the payload is the data
        action: "sendAssignmentsData",
        payload: assignmentsData
    },

    // This gives a response back from the background to confirm data was sent
    function(response) 
    {
        console.log("Response from background.js:", response);
    });
}


//----------------------------------------------------------------------------------------------------------------------------------
// Function to determine if site data has loaded in


// This function takes in a function name then calls it once the canvas assignment data loads in
function waitDataLoad(returnFunction, dataDivName) 
{
    // Use setInterval to check every second until our data is loaded in
    let checkAssignments = setInterval(function() 
    {
        // On canvas on the assignment page all of the assignment data is stored under a div with id #ag-list so we check this
        let canvasAssignmentsDiv = document.querySelector(dataDivName);
        
        // This determines if the data is loaded in, it gets the innerHTML inside the #ag-list div and then removes all of the newline statments ect
        if (canvasAssignmentsDiv && canvasAssignmentsDiv.innerHTML.trim().length > 0) 
        {
            //If we determine the data is loaded we call the function that was input into this which will likley be our extraction function
            clearInterval(checkAssignments);
            //Log for debugging
            console.log("Assignments loaded, extracting data...");
            // Breaks interval and calls function
            returnFunction();
        }

    }, 1000); // Checks every second (in ms)
}
//----------------------------------------------------------------------------------------------------------------------------------
// Function to display our popup for sync


// Function to show a popup asking whether to sync our assignments
function showSyncPopup(assignmentsData, assignmentLength) 
{
    console.log("New assignments detected. Asking user for sync confirmation...");

    // Creating the popup container
    let popup = document.createElement("div");
    popup.id = "sync-popup";
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.right = "20px";
    popup.style.background = "#222";
    popup.style.color = "#fff";
    popup.style.padding = "15px";
    popup.style.border = "2px solid black";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.2)";
    popup.style.zIndex = "1000";
    popup.style.fontSize = "16px";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.alignItems = "center";
    popup.style.gap = "10px";

    // Popup message
    let message = document.createElement("p");
    message.innerText = "New Assignments Detected! Sync Now?";
    message.style.marginBottom = "7px"; // Space between message and buttons
    popup.appendChild(message);

    // Button container to align buttons side by side
    let buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px"; // Space between buttons

    // Yes button
    let yesButton = document.createElement("button");
    yesButton.innerText = "Yes";
    yesButton.style.padding = "8px 15px";
    yesButton.style.backgroundColor = "#4CAF50";
    yesButton.style.color = "white";
    yesButton.style.border = "none";
    yesButton.style.borderRadius = "5px";
    yesButton.style.cursor = "pointer";
    yesButton.onclick = function() 
    {
        console.log("User chose to sync assignments.");
        sendToBackground(assignmentsData); // Send data to background.js
        document.body.removeChild(popup);
        showToastNotification(`Synced ${assignmentLength} assignments :)`);
    };

    // No button
    let noButton = document.createElement("button");
    noButton.innerText = "No";
    noButton.style.padding = "8px 15px";
    noButton.style.backgroundColor = "#f44336";
    noButton.style.color = "white";
    noButton.style.border = "none";
    noButton.style.borderRadius = "5px";
    noButton.style.cursor = "pointer";
    noButton.onclick = function() 
    {
        console.log("User declined to sync assignments.");
        document.body.removeChild(popup);
        showToastNotification(`No Assignments Synced :)`);
    };

    // Add buttons to button container
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);

    // Add button container to popup
    popup.appendChild(buttonContainer);

    // Add popup to the page
    document.body.appendChild(popup);
}




//----------------------------------------------------------------------------------------------------------------------------------


// This function is used to make cool notifications when we need them :)
function showToastNotification(message) 
{
    console.log("Notification Appearing");

    // Creating empty div to use for the popup
    let toast = document.createElement("div");

    // message is what we want it to say ofc
    toast.innerText = message;

    // following lines format the position color and size of the popup
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "black";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.fontSize = "16px";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0.9";

    //adds this notification to the body of the webpage
    document.body.appendChild(toast);

    // A little extra but a cool little fadeout effect for fun
    setTimeout(function() 
    {
        toast.style.transition = "opacity 0.5s";
        toast.style.opacity = "0";

        // Executes the fadeout above after 4 seconds for .5 seconds and then removes it below after its done :)
        setTimeout(function() 
        {
            toast.remove();
        }, 500); 

    }, 4000); 

    console.log("Notification Disappearing.");

}


//----------------------------------------------------------------------------------------------------------------------------------
// Function calls on site loads from list of manifest JSON sites

// Run extraction when the page loads
if (canvasAssignmentsOpen()) 
{
    console.log("User is on an Assignments page. Extraction Available");
    waitDataLoad(extractAssignmentsData, "#ag-list");
} 
else if (gradescopeCoursesOpen())
{
    console.log("User is on Gradescope course. Extraction Available")
    waitDataLoad(extractCoursesData, "table.dataTable.no-footer")
}
else 
{
    console.log("User Is NOT on needed page.");
}


//----------------------------------------------------------------------------------------------------------------------------------























//----------------------------------------------------------------------------------------------------------------------------------


// Function to save JSON data as a downloadable file Used for testing WILL REMOVE LATER basically copied from online
function saveJSONToFile(data, filename) 
{
    console.log("Saving file...");
    let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("File should have downloaded.");
}