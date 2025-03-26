'''
def handleNewAssignments(assignments):


    print("WE GOT THE ASSIGNMENTS IN YAYYYYYY")

    # Look at the assignmentBasics text to kinda see what your working with in terms of data
    with open("assignmentBasics.txt", "w", encoding="utf-8") as file:
        file.write("=== ASSIGNMENT Data ===\n\n")

        for assignment in assignments:
            file.write(f"Title: {assignment['title']}\n")
            file.write(f"Due Date: {assignment['dueDate']}\n")
            file.write(f"Link: {assignment['link']}\n")
            file.write(f"Points: {assignment['points']}\n")
            file.write("-" * 40 + "\n")

    print("Assignments saved to 'assignmentBasics.txt'")
'''    
    
# -----------------------------------------------------------------------------------------------------------------------------

import datetime
import os.path
import re

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Use the full calendar scope to allow event creation, not just read-only.
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# -----------------------------------------------------------------------------------------------------------------------------
# Function to get the date into a usable format

def formatDueDate(rawDate):
    """
    Converts a due date like 'Feb 28 at 11:59PM' into ISO 8601 format ('YYYY-MM-DDTHH:MM:SS').
    Returns None if date is invalid or missing.
    """
    if not rawDate or rawDate.lower() == "no due date":
        return None  # Skip assignments without a valid due date

    # error catch to ensure that we have a valid date to format
    try:
        
        try:
            # Convert "Feb 28 at 11:59PM" into datetime object
            dt = datetime.datetime.strptime(rawDate, "%b %d at %I:%M%p")
        
        except ValueError:
            # If we get a value error from above we try this incase in this format then do the error
            dt = datetime.datetime.strptime(rawDate, "%b %d at %I%p")


        # Year is not included so we will use the current year from datetime (NOT PERFECT BUT BEST I CAN THINK TO DO FOR NOW)
        dt = dt.replace(year=datetime.datetime.now().year)

        # Convert to ISO 8601 format
        return dt.strftime("%Y-%m-%dT%H:%M:%S")

    except ValueError:
        print(f"❌ Error parsing date: {rawDate}")
        return None  # Return None if parsing fails
    
# -----------------------------------------------------------------------------------------------------------------------------

# funciton to check for and create class-specific calendars 
def getOrCreateCalendar(service, className):
    """
    Checks if a calendar for the class exists, otherwise creates a new one.
    This function Returns the calendar ID :).
    """
    try:
        # Fetch existing calendars
        calendarList = service.calendarList().list().execute()

        # Check if the calendar already exists 
        for calendar in calendarList.get("items", []):
            if calendar["summary"] == className:
                print(f"📖 Found existing calendar: {className}")
                return calendar["id"]  # Return existing calendar ID

        # If not found, create a new calendar 
        new_calendar = {
            "summary": className,
            "timeZone": "America/Los_Angeles"
        }
        created_calendar = service.calendars().insert(body=new_calendar).execute()
        print(f"📅 Created new calendar: {className}")

        return created_calendar["id"]

    except HttpError as error:
        print(f"❌ Error checking/creating calendar for {className}: {error}")
        return "primary"  # Default to primary if error occurs 

# -----------------------------------------------------------------------------------------------------------------------------
# Function to handle our assignments this takes in the scanned assignments

def handleNewAssignments(assignments):
    """Processes assignments, formats due dates, and adds them to Google Calendar."""
    print("📅 Processing assignments...")

    # Load credentials for Google Calendar API
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "C:/Users/thoma/OneDrive/Desktop/College Classes/Winter25/PSTAT 134/Final Project/Scripts/credentials.json",
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save new credentials
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        # Initialize Google Calendar API service
        service = build("calendar", "v3", credentials=creds)
        
        # Store our class calander ID's so we don't have to call the API a lot
        calendarStorage = {}

        # Process each assignment
        for assignment in assignments:
            title = assignment.get("title", "Untitled Assignment")
            raw_due_date = assignment.get("dueDate", "No Due Date")
            formatted_due_date = formatDueDate(raw_due_date)
            link = assignment.get("link", "No Link")
            points = assignment.get("points", "No Points")
            className = assignment.get("className", "Unknown Class")

            if not formatted_due_date:
                print(f"⚠️ Skipping '{title}' - No valid due date.")
                continue  # Skip assignments with invalid due dates

            print(f"✅ Adding to Calendar: {title} (Due: {formatted_due_date}) - Class: {className}")
            
            # Call to create or access our correct calander from the storage
            if className not in calendarStorage:
                calendarStorage[className] = getOrCreateCalendar(service, className)

            # Get our Calendar ID :)
            classCalID = calendarStorage[className]


            # Create the event structure
            event_body = {
                "summary": title,
                "description": f"Points: {points}\nLink: {link}",
                "start": {
                    "dateTime": formatted_due_date,
                    "timeZone": "America/Los_Angeles",
                },
                "end": {
                    "dateTime": formatted_due_date,
                    "timeZone": "America/Los_Angeles",
                },
            }

            # Insert event into Google Calendar Using our calendar ID for each class
            created_event = service.events().insert(calendarId=classCalID, body=event_body).execute()
            print(f"📅 Created event: {created_event.get('htmlLink')}")

    except HttpError as error:
        print(f"❌ Google Calendar API Error: {error}")

# -----------------------------------------------------------------------------------------------------------------------------
