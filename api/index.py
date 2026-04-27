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
    from generator.generate_docx import build_docx_to_stream
except ImportError as e:
    print(f"Import error: {e}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            raw_text = data.get("text", "")
            doc_format = data.get("format", "pdf").lower()
            
            if not raw_text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No text provided"}).encode('utf-8'))
                return

            print(f"Parsing requirements for {doc_format}...")
            parsed_data = parse_requirements(raw_text)
            
            output_stream = io.BytesIO()
            if doc_format == "docx":
                print("Generating DOCX...")
                build_docx_to_stream(parsed_data, output_stream)
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                filename = 'workbook.docx'
            else:
                print("Generating PDF...")
                build_pdf_to_stream(parsed_data, output_stream)
                content_type = 'application/pdf'
                filename = 'workbook.pdf'

            file_bytes = output_stream.getvalue()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(file_bytes)

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
