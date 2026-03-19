import http.server
import socketserver
import os

os.chdir('/app/flutter_app/build/web')

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def do_GET(self):
        # For SPA routing - serve index.html for non-file paths
        if not os.path.exists(self.translate_path(self.path)) and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        return super().do_GET()

with socketserver.TCPServer(("0.0.0.0", 3000), Handler) as httpd:
    print("Serving Flutter web on port 3000")
    httpd.serve_forever()
