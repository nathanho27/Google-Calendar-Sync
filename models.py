from django.db import models

# Taking in our data as a model which I will Transform to be worked with in standard means
class Assignment(models.Model):
    title = models.CharField(max_length=255)
    link = models.URLField(blank=True, null=True)
    due_date = models.CharField(max_length=50, blank=True, null=True) 
    points = models.CharField(max_length=20, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    # Defining a basic print output for an assignment
    def __str__(self):
        return self.title