# backend/server.py

import uvicorn
from swipe_api import app

if __name__ == "__main__":
    uvicorn.run("swipe_api:app", host="0.0.0.0", port=8000, reload=True)
