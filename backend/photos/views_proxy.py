import urllib.request
from urllib.error import URLError
from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class ProxyImageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        url = request.GET.get('url')
        if not url:
            return HttpResponse("URL is required", status=400)
            
        try:
            # Fix NAT hairpinning: Replace the public host with localhost 
            # so the container loops back to itself without going to the public internet
            current_host = request.get_host()
            if current_host and f"://{current_host}" in url:
                url = url.replace(f"://{current_host}", "://127.0.0.1:8000")

            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req, timeout=10)
            
            # Read in chunks
            def stream_data():
                while True:
                    chunk = res.read(8192)
                    if not chunk:
                        break
                    yield chunk
                    
            response = StreamingHttpResponse(stream_data(), content_type=res.headers.get('Content-Type', 'image/jpeg'))
            response['Access-Control-Allow-Origin'] = '*'
            # Optional: provide a fallback generic filename if needed
            response['Content-Disposition'] = 'attachment; filename="download.jpg"'
            return response
        except URLError as e:
            return HttpResponse(f"Failed to fetch image: {str(e)}", status=502)
        except Exception as e:
            return HttpResponse(str(e), status=500)
