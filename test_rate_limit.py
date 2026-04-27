import requests
import json

url = "http://localhost:3000/api/generate"
payload = {
    "text": "1. Do something.",
    "format": "pdf"
}

print("Testing rate limit...")
for i in range(1, 8):
    print(f"\nRequest {i}:")
    try:
        # We need to simulate the request to the vercel dev server
        res = requests.post(url, json=payload)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Response: {res.text}")
    except Exception as e:
        print(f"Failed: {e}")
