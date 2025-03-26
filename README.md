# Google-Calendar-Sync
This project automates the scheduling of assignments across academic platforms by integrating a custom Chrome extension with a Django REST API. It streamlines the process of managing deadlines by scraping assignment data from Canvas and Gradescope, then syncing it to Google Calendar.

Overview
Students often face challenges in tracking assignments across multiple platforms. This tool addresses that issue by automating data extraction and calendar syncing, helping students maintain an organized academic schedule without the need for manual input.

Features
Chrome Extension for real-time scraping of Canvas and Gradescope assignments

Local storage using chrome.storage.local with JSON formatting

Communication with a Django REST API for data processing and validation

Integration with the Google Calendar API using OAuth2 authentication

Automatic event creation with assignment metadata (title, due date, link)

Built-in logging, error handling, and duplicate prevention

Tech Stack
Frontend: JavaScript (ES6), Chrome Extension APIs

Backend: Python, Django, Django REST Framework

Data Persistence: Chrome local storage, Django ORM

APIs: Google Calendar API, Canvas API

Authentication: OAuth2 (Google)

System Architecture
Content Script (content.js)
Injected into Canvas and Gradescope assignment pages to scrape data including title, due date, points, and assignment links.

Background Script (background.js)
Handles message passing, stores extracted data locally, and sends it to the backend via a POST request.

Django Backend

views.py: Receives and stores assignment data.

serializers.py: Validates and serializes data.

process_assignments.py: Creates calendar events through the Google Calendar API.

Calendar Sync
Authenticates using OAuth2 and prevents duplicate events by checking existing calendar entries before scheduling.

Results
Successfully tested on multiple Canvas and Gradescope courses

Assignments appeared in Google Calendar with accurate metadata

Reduced manual scheduling and improved consistency across platforms

Future Improvements
Migrate backend to JavaScript for a fully unified stack

Expand support for platforms like Notion and Microsoft Outlook

Add UI for manual event editing and sync preferences

Implement advanced time zone handling and recurring event support
