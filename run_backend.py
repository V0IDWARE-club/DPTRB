#!/usr/bin/env python3
import uvicorn
from backend.app.config import HOST, PORT

if __name__ == "__main__":
    print(f"⚡ Starting VOIDWARE Button Panic Server on http://{HOST}:{PORT}")
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
