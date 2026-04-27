# Simulação do cadastro de RH / treinamentos (não é banco real).

COLABORADORES = {
    "E004A1F2": {
        "nome": "Ana Costa",
        "status_treinamento": "Ativo",
        "maquinas_autorizadas": ["CNC-01", "PRENSA-03"],
    },
    "B009C3D4": {
        "nome": "Bruno Silva",
        "status_treinamento": "Pendente",
        "maquinas_autorizadas": ["CNC-01"],
    },
    "F0019999": {
        "nome": "Carla Mendes",
        "status_treinamento": "Ativo",
        "maquinas_autorizadas": ["PRENSA-03"],
    },
}


def consulta_autorizacao(tag_rfid: str, id_maquina: str) -> dict:
    tag = (tag_rfid or "").strip().upper()
    if not tag:
        return {
            "permitido": False,
            "motivo": "Nenhuma tag RFID informada.",
            "start_permit": False,
        }

    colab = COLABORADORES.get(tag)
    if not colab:
        return {
            "permitido": False,
            "motivo": "Tag não cadastrada no RH (simulado).",
            "start_permit": False,
            "tag": tag,
        }

    if colab["status_treinamento"] != "Ativo":
        return {
            "permitido": False,
            "motivo": f"Treinamento com status '{colab['status_treinamento']}' — exige 'Ativo'.",
            "start_permit": False,
            "colaborador": colab["nome"],
            "tag": tag,
        }

    if id_maquina not in colab["maquinas_autorizadas"]:
        return {
            "permitido": False,
            "motivo": f"Treinamento ativo, mas sem habilitação para a máquina {id_maquina}.",
            "start_permit": False,
            "colaborador": colab["nome"],
            "tag": tag,
        }

    return {
        "permitido": True,
        "motivo": "Treinamento válido no RH; MES pode liberar o ciclo.",
        "start_permit": True,
        "colaborador": colab["nome"],
        "tag": tag,
        "maquina": id_maquina,
    }
