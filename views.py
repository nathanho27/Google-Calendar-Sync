from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Assignment
from .serializers import AssignmentSerializer
from .processAssignments import handleNewAssignments

@api_view(["POST"])
def sync_assignments(request):
    """
    Receives assignments data from Chrome extension and saves it.
    """
    assignmentsData = request.data.get("assignments", [])  # Ensure it's at least an empty list

    if not isinstance(assignmentsData, list):
        return Response({"error": "Invalid data format. Expected a list of assignments."}, status=400)

    serializer = AssignmentSerializer(data=assignmentsData, many=True)

    if serializer.is_valid():
        serializer.save()

        #FINALLY THE DATA GOES TO THE RIGHT PLACE XD
        handleNewAssignments(assignmentsData)

        return Response({"message": "Assignments saved successfully!", "data": serializer.data}, status=201)

    return Response(serializer.errors, status=400)

# For GET Requests only Standard Formatting
@api_view(["GET"])
def get_assignments(request):
    # Retrieves already stored assignments
    assignments = Assignment.objects.all()
    serializer = AssignmentSerializer(assignments, many=True)
    return Response(serializer.data)
