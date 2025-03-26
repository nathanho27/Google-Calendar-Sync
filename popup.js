/*
HELLO THERE! Welcome to the popup.js file

This file handles the javascript for our popup it interacts with our popup.html file and
calls our background file so the user can have some manual control over their syncs
just in case they miss the inital popup or decline on or something TEE HEE.

*/

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("injectCalendar").addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"]
            });
        });
    });
});