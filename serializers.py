from rest_framework import serializers
from .models import Assignment

# As a serializer just gets all fields from the data nothing crazy
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"