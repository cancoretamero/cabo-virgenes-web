#!/usr/bin/env python3
"""Servidor HTTP local con headers no-cache reales (no sólo meta tags).
Uso: python3 serve.py [puerto]   (por defecto 8080)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    with ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler) as httpd:
        print(f'Serving http://127.0.0.1:{port}  (no-cache)')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped.')
