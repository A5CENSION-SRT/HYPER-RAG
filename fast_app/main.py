from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
from pathlib import Path

HERE = Path(__file__).resolve().parent

app = FastAPI()
# Use absolute paths so importing the module works from any working directory
templates = Jinja2Templates(directory=str(HERE / "templates"))  # templates folder in fast_app/

# Serve static files from fast_app/static at /static
static_dir = HERE / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", response_class=HTMLResponse)
def base(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)