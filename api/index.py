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
            doc_format = data.get("format", "pdf").lower()
            
            if not raw_text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No text provided"}).encode('utf-8'))
                return

            # IP-based Rate Limiting
            supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            
            if supabase_url and supabase_key:
                client_ip = self.headers.get("x-forwarded-for", "127.0.0.1").split(",")[0].strip()
                import requests
                try:
                    limit_res = requests.post(
                        f"{supabase_url}/rest/v1/rpc/check_rate_limit",
                        headers={
                            "apikey": supabase_key,
                            "Authorization": f"Bearer {supabase_key}",
                            "Content-Type": "application/json"
                        },
                        json={"client_ip": client_ip},
                        timeout=5
                    )
                    if limit_res.status_code == 200:
                        is_allowed = limit_res.json()
                        if not is_allowed:
                            self.send_response(429)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            self.wfile.write(json.dumps({"error": "Rate limit exceeded. You can only generate 5 workbooks per day. Please try again tomorrow!"}).encode('utf-8'))
                            return
                except Exception as limit_err:
                    print(f"Rate limit check failed, bypassing: {limit_err}")

            print(f"Parsing requirements for {doc_format}...")
            parsed_data = parse_requirements(raw_text)
            
            # Always generate the PDF first (it's our source of truth)
            print("Generating PDF...")
            pdf_stream = io.BytesIO()
            build_pdf_to_stream(parsed_data, pdf_stream)
            pdf_bytes = pdf_stream.getvalue()

            # Build a smart filename from the badge title
            badge_title = parsed_data.get("meta", {}).get("title", "workbook")
            badge_slug = badge_title.lower().replace(" ", "-").replace("/", "-")

            if doc_format == "docx":
                # Convert the PDF to DOCX using pdf2docx for a pixel-perfect result
                print("Converting PDF to DOCX via pdf2docx...")
                import tempfile, os
                from pdf2docx import Converter
                
                # pdf2docx requires file paths, so we use temp files
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
                    tmp_pdf.write(pdf_bytes)
                    tmp_pdf_path = tmp_pdf.name
                
                tmp_docx_path = tmp_pdf_path.replace(".pdf", ".docx")
                try:
                    cv = Converter(tmp_pdf_path)
                    cv.convert(tmp_docx_path, start=0, end=None)
                    cv.close()
                    with open(tmp_docx_path, "rb") as f:
                        file_bytes = f.read()
                finally:
                    os.unlink(tmp_pdf_path)
                    if os.path.exists(tmp_docx_path):
                        os.unlink(tmp_docx_path)
                
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                filename = f'{badge_slug}-workbook.docx'
            else:
                file_bytes = pdf_bytes
                content_type = 'application/pdf'
                filename = f'{badge_slug}-workbook.pdf'
            
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
