import http.server
import socketserver
import os
import json

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle JSON requests for album info
        if self.path.endswith('/info.json'):
            try:
                folder_path = self.path.replace('/info.json', '')
                folder_name = folder_path.split('/')[-1]
                json_path = os.path.join('.', folder_path.lstrip('/'), 'info.json')
                
                if os.path.exists(json_path):
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode())
                    return
                else:
                    # Return default info if file doesn't exist
                    default_info = {
                        "title": folder_name.replace('_', ' ').title(),
                        "description": "Music collection"
                    }
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(default_info).encode())
                    return
            except:
                pass
        
        # Serve regular files
        super().do_GET()
    
    def list_directory(self, path):
        try:
            # Don't list directory contents, just return index.html if it exists
            if os.path.exists(os.path.join(path, 'index.html')):
                self.send_error(403, "Directory listing not supported")
                return None
            return super().list_directory(path)
        except:
            self.send_error(403, "Directory listing not supported")
            return None

def run_server():
    # Change to the directory where the script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == "__main__":
    run_server()