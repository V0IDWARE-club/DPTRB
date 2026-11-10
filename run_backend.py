#!/usr/bin/env python3
import os
import uvicorn
from backend.app.config import HOST, PORT

if __name__ == "__main__":
    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production" or os.getenv("RENDER", "") == "true"
    print(f"⚡ Starting VOIDWARE Button Panic Server on http://{HOST}:{PORT} (Production={is_prod})")
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=not is_prod)
