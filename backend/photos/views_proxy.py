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
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req)
            
            # Read in chunks
            def stream_data():
                while True:
                    chunk = res.read(8192)
                    if not chunk:
                        break
                    yield chunk
                    
            response = StreamingHttpResponse(stream_data(), content_type=res.headers.get('Content-Type', 'image/jpeg'))
            response['Access-Control-Allow-Origin'] = '*'
            return response
        except URLError as e:
            return HttpResponse(f"Failed to fetch image: {str(e)}", status=502)
        except Exception as e:
            return HttpResponse(str(e), status=500)
