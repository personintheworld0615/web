from http.server import BaseHTTPRequestHandler
import json
import io
import traceback
import sys
import os

# Add the api directory to sys.path so we can import generator modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from generator.ai_parser import parse_requirements
    from generator.generate import build_pdf_to_stream
except ImportError as e:
    print(f"Import error: {e}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            raw_text = data.get("text", "")
            
            if not raw_text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No text provided"}).encode('utf-8'))
                return

            print("Parsing requirements...")
            parsed_data = parse_requirements(raw_text)
            
            print("Generating PDF...")
            pdf_stream = io.BytesIO()
            build_pdf_to_stream(parsed_data, pdf_stream)
            pdf_bytes = pdf_stream.getvalue()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', 'attachment; filename="workbook.pdf"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception as e:
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()
