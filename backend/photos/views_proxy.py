import mimetypes
from pathlib import Path
from django.http import HttpResponse, FileResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class DownloadPhotoView(APIView):
    """
    Serves a media file directly from disk with Content-Disposition: attachment
    so the browser downloads it instead of opening it in a new tab.

    Usage: GET /api/download-photo/?path=event_photos/filename.JPG
    """
    permission_classes = [AllowAny]

    def get(self, request):
        relative_path = request.GET.get('path', '').lstrip('/')
        if not relative_path:
            return HttpResponse("'path' query param is required", status=400)

        media_root = Path(settings.MEDIA_ROOT).resolve()
        full_path = (media_root / relative_path).resolve()

        # Security: make sure the resolved path is inside MEDIA_ROOT
        try:
            full_path.relative_to(media_root)
        except ValueError:
            return HttpResponse("Invalid path", status=400)

        if not full_path.exists() or not full_path.is_file():
            return HttpResponse("File not found", status=404)

        content_type, _ = mimetypes.guess_type(str(full_path))
        content_type = content_type or 'application/octet-stream'
        filename = full_path.name

        response = FileResponse(
            open(full_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=filename,
        )
        response['Access-Control-Allow-Origin'] = '*'
        return response
