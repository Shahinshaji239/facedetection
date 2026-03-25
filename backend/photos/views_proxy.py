import io
import mimetypes
from pathlib import Path
from django.http import HttpResponse, FileResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from PIL import Image


# Path to the watermark image (lives next to this file)
WATERMARK_PATH = Path(__file__).parent / "watermark.png"


def apply_watermark(image_path: Path) -> io.BytesIO:
    """Open image, place watermark logo at bottom-right with 50% opacity."""
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size

    if not WATERMARK_PATH.exists():
        # No watermark file found — return original image as JPEG
        output = io.BytesIO()
        img.convert("RGB").save(output, format="JPEG", quality=90)
        output.seek(0)
        return output

    # Load watermark and convert to RGBA for transparency support
    wm = Image.open(WATERMARK_PATH).convert("RGBA")

    # Scale watermark to 25% of photo width, keep aspect ratio
    wm_target_w = max(100, width // 4)
    wm_scale = wm_target_w / wm.width
    wm_target_h = int(wm.height * wm_scale)
    wm = wm.resize((wm_target_w, wm_target_h), Image.LANCZOS)

    # Apply 60% opacity to the watermark
    r, g, b, a = wm.split()
    a = a.point(lambda x: int(x * 0.6))   # 60% opacity
    wm = Image.merge("RGBA", (r, g, b, a))

    # Position: bottom-right with a small padding
    padding = max(15, width // 60)
    pos_x = width - wm_target_w - padding
    pos_y = height - wm_target_h - padding

    # Composite watermark onto photo
    img.paste(wm, (pos_x, pos_y), wm)

    # Save result
    output = io.BytesIO()
    img.convert("RGB").save(output, format="JPEG", quality=90)
    output.seek(0)
    return output


class DownloadPhotoView(APIView):
    """
    Serves a media file directly from disk with a watermark applied and
    Content-Disposition: attachment so the browser downloads it.

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

        filename = full_path.stem + "_watermarked.jpg"

        try:
            watermarked = apply_watermark(full_path)
            response = HttpResponse(watermarked.read(), content_type="image/jpeg")
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Access-Control-Allow-Origin'] = '*'
            return response
        except Exception as e:
            # If watermarking fails for any reason, fall back to original file
            response = FileResponse(
                open(full_path, 'rb'),
                content_type=mimetypes.guess_type(str(full_path))[0] or 'application/octet-stream',
                as_attachment=True,
                filename=full_path.name,
            )
            response['Access-Control-Allow-Origin'] = '*'
            return response
