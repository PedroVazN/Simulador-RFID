from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from mock_rh import COLABORADORES, consulta_autorizacao

app = FastAPI(title="Simulador MES + RFID + RH", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = Path(__file__).resolve().parent
static_dir = BASE / "static"
if static_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


class AutorizarBody(BaseModel):
    tag_rfid: str = Field(..., description="UID / ID lido no crachá")
    id_maquina: str = Field(..., description="Identificador da máquina no MES")


@app.get("/", response_class=HTMLResponse)
def pagina():
    index = static_dir / "index.html"
    if index.is_file():
        return index.read_text(encoding="utf-8")
    return HTMLResponse("<p>Coloque static/index.html na pasta do projeto.</p>", status_code=404)


@app.post("/api/autorizar")
def api_autorizar(body: AutorizarBody):
    """Simula: consulta RH → decisão MES → sinal Start_Permit (apenas no JSON)."""
    resultado = consulta_autorizacao(body.tag_rfid, body.id_maquina.strip())
    resultado["mes_acao"] = (
        "ENVIAR Start_Permit ao CLP" if resultado.get("start_permit") else "BLOQUEAR partida"
    )
    return resultado


@app.get("/api/tags-demo")
def tags_demo():
    """Lista tags fictícias para apresentação."""
    return {
        "maquinas": ["CNC-01", "PRENSA-03"],
        "colaboradores_simulados": [
            {"tag": k, **{kk: v[kk] for kk in ("nome", "status_treinamento", "maquinas_autorizadas")}}
            for k, v in COLABORADORES.items()
        ],
    }
