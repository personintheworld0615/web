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
            print("🚀  POST request received")
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            raw_text = data.get("text", "")
            doc_format = data.get("format", "pdf").lower()
            
            print(f"📄  Format: {doc_format}, Text length: {len(raw_text)}")

            if not raw_text:
                print("⚠️  Error: No text provided")
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No text provided"}).encode('utf-8'))
                return

            # Supabase Rate Limiting (DISABLED)
            print("⏭️  Skipping Supabase rate limit check (disabled)")

            print("🤖  Calling AI Parser...")
            try:
                parsed_data = parse_requirements(raw_text)
                print("✅  AI Parser success")
            except Exception as e:
                print(f"❌  AI Parser failed: {str(e)}")
                raise Exception(f"AI Parser Error: {str(e)}")
            
            print("🎨  Generating document...")
            try:
                pdf_stream = io.BytesIO()
                build_pdf_to_stream(parsed_data, pdf_stream)
                pdf_bytes = pdf_stream.getvalue()
                print(f"✅  Document generation success ({len(pdf_bytes)} bytes)")
            except Exception as e:
                print(f"❌  Document generation failed: {str(e)}")
                raise Exception(f"Document Generation Error: {str(e)}")

            badge_title = parsed_data.get("meta", {}).get("title", "workbook")
            badge_slug = badge_title.lower().replace(" ", "-").replace("/", "-")

            if doc_format == "docx":
                print("🔄  Converting to DOCX...")
                import tempfile
                from pdf2docx import Converter
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
                    print("✅  DOCX conversion success")
                finally:
                    os.unlink(tmp_pdf_path)
                    if os.path.exists(tmp_docx_path): os.unlink(tmp_docx_path)
                
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                filename = f'{badge_slug}-workbook.docx'
            else:
                file_bytes = pdf_bytes
                content_type = 'application/pdf'
                filename = f'{badge_slug}-workbook.pdf'

            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(file_bytes)
            print(f"✨  Response sent: {filename}")

        except Exception as e:
            print("🚨  CRITICAL ERROR in handler:")
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = f"{str(e)}\n\n{traceback.format_exc()}"
            self.wfile.write(json.dumps({"error": error_msg}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
