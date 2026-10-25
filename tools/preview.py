#!/usr/bin/env python3
"""Serve the public website locally. No dependencies, writes, or external binding."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class PublicHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(p.startswith(('.', '_')) or p in {'tools', 'node_modules', 'design-qa.md'} for p in parts):
            self.send_error(404)
            return
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, fmt, *args):
        if len(args) > 1 and str(args[1]) not in {'200', '304'}:
            super().log_message(fmt, *args)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8769)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(PublicHandler, directory=str(ROOT)))
    print(f'Ray Qin preview: http://127.0.0.1:{args.port}', flush=True)
    print('Local only. Ctrl-C stops the preview.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
