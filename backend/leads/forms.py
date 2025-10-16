from django import forms

class JsonUploadForm(forms.Form):
    json_file = forms.FileField(
        label='JSON File',
        help_text='Upload a JSON file containing lead data. The file should contain an array of lead objects.',
        widget=forms.FileInput(attrs={'accept': '.json'})
    )
