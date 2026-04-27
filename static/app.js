/**
 * Cenários de teste: preenchem tag + máquina; o usuário clica em "Simular" em seguida.
 * esperado: o que a interface deve explicar (texto curto).
 */
const CENARIOS = [
  {
    id: "t1",
    label: "Libera: Ana + CNC-01",
    desc: "Treino Ativo; Ana tem CNC-01 e PRENSA-03. Esperado: Start_Permit = SIM.",
    maquina: "CNC-01",
    tag: "E004A1F2",
    esperado: "Liberar",
  },
  {
    id: "t2",
    label: "Libera: Ana + PRENSA-03",
    desc: "Mesmo colaborador em outro posto permitido. Esperado: Start_Permit = SIM.",
    maquina: "PRENSA-03",
    tag: "E004A1F2",
    esperado: "Liberar",
  },
  {
    id: "t3",
    label: "Bloqueia: Bruno (treino Pendente)",
    desc: "Tag cadastrada, mas status ≠ Ativo. Esperado: BLOQUEIO; sem Start_Permit.",
    maquina: "CNC-01",
    tag: "B009C3D4",
    esperado: "Bloquear",
  },
  {
    id: "t4",
    label: "Bloqueia: Carla na CNC (máquina errada)",
    desc: "Treino Ativo, mas só na PRENSA-03. Na CNC: BLOQUEIO por habilitação.",
    maquina: "CNC-01",
    tag: "F0019999",
    esperado: "Bloquear",
  },
  {
    id: "t5",
    label: "Libera: Carla + PRENSA-03",
    desc: "Treino Ativo e máquina na lista de Carla. Esperado: Start_Permit = SIM.",
    maquina: "PRENSA-03",
    tag: "F0019999",
    esperado: "Liberar",
  },
  {
    id: "t6",
    label: "Bloqueia: tag vazia",
    desc: "Nenhum código lido. Esperado: BLOQUEIO; motivo: tag não informada.",
    maquina: "CNC-01",
    tag: "",
    esperado: "Bloquear",
  },
  {
    id: "t7",
    label: "Bloqueia: tag inexistente no RH",
    desc: "Código desconhecido no cadastro simulado. Esperado: BLOQUEIO.",
    maquina: "CNC-01",
    tag: "ZZZZ9999",
    esperado: "Bloquear",
  },
];

let cenarioSelecionadoId = null;

function renderCenarios() {
  const grid = document.getElementById("cenarios");
  grid.innerHTML = "";
  CENARIOS.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-cenario";
    b.dataset.cenarioId = c.id;
    b.innerHTML = `<span class="btn-cenario__titulo">${c.label}</span><span class="btn-cenario__desc">${c.desc}</span><span class="btn-cenario__esp">Teste: esperado = <strong>${c.esperado === "Liberar" ? "liberação" : "bloqueio"}</strong></span>`;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => aplicarCenario(c.id));
    grid.appendChild(b);
  });
}

function aplicarCenario(id) {
  const c = CENARIOS.find((x) => x.id === id);
  if (!c) return;

  cenarioSelecionadoId = id;
  const sel = document.getElementById("maquina");
  if ([...sel.options].some((o) => o.value === c.maquina)) {
    sel.value = c.maquina;
  }
  document.getElementById("tag").value = c.tag;

  document.querySelectorAll(".btn-cenario").forEach((btn) => {
    const ativo = btn.dataset.cenarioId === id;
    btn.classList.toggle("is-selected", ativo);
    btn.setAttribute("aria-pressed", ativo ? "true" : "false");
  });

  const out = document.getElementById("cenario-ativo");
  out.innerHTML = `<strong>Cenário ativo:</strong> ${c.label} — Máquina <code>${c.maquina}</code>, tag <code>${c.tag || "(vazia)"}</code>. <em>Próximo passo:</em> clique em <strong>Simular leitura e consultar RH</strong> abaixo.`;

  const msg = document.getElementById("msg");
  msg.className = "msg neutro";
  msg.textContent =
    "Pronto: campos preenchidos. Clique em “Simular leitura e consultar RH” para ver se o treino no RH autoriza a partida (Start_Permit).";
  document.getElementById("detalhes").innerHTML = "";
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function carregarDemo() {
  try {
    const r = await fetch("/api/tags-demo");
    const j = await r.json();
    const ul = document.getElementById("lista-demo");
    ul.innerHTML = "";
    j.colaboradores_simulados.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.tag} — ${c.nome} | status do treino: ${c.status_treinamento} | máquinas autorizadas: ${c.maquinas_autorizadas.join(", ")}`;
      ul.appendChild(li);
    });
    const sel = document.getElementById("maquina");
    const valores = j.maquinas;
    if (valores && valores.length) {
      sel.innerHTML = "";
      valores.forEach((m) => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        sel.appendChild(o);
      });
    }
  } catch (_) {
    document.getElementById("lista-demo").textContent = "Não foi possível carregar a lista do cadastro simulado.";
  }
  renderCenarios();
}

function limparDetalhes() {
  document.getElementById("detalhes").innerHTML = "";
}

function preencherDetalhes(obj) {
  const dl = document.getElementById("detalhes");
  limparDetalhes();
  const pares = [
    ["Colaborador (RH simulado)", obj.colaborador],
    ["Tag lida", obj.tag],
    ["Máquina / posto", obj.maquina || document.getElementById("maquina").value],
    ["O que o RH respondeu (motivo)", obj.motivo],
    ["Ação que o MES faria", obj.mes_acao],
    ["Start_Permit para o CLP (simulado)", obj.start_permit ? "SIM — partida permitida" : "NÃO — partida bloqueada"],
  ];
  pares.forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = String(v);
    dl.appendChild(dt);
    dl.appendChild(dd);
  });
}

document.getElementById("btn").addEventListener("click", async () => {
  const tag = document.getElementById("tag").value;
  const id_maquina = document.getElementById("maquina").value;
  const msg = document.getElementById("msg");
  const load = document.getElementById("loading");

  msg.className = "msg neutro";
  msg.textContent = "Consultando o cadastro de RH (simulado)…";
  limparDetalhes();
  load.classList.remove("hidden");

  try {
    const r = await fetch("/api/autorizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_rfid: tag, id_maquina }),
    });
    const j = await r.json();
    if (j.permitido) {
      msg.className = "msg ok";
      msg.textContent =
        "Resultado: aprovado. O treinamento consta como Ativo no RH (simulado) e a máquina está autorizada para essa pessoa. O MES enviaria o sinal Start_Permit ao CLP (simulado) para permitir a partida.";
    } else {
      msg.className = "msg erro";
      msg.textContent =
        "Resultado: bloqueado. A partida não é liberada. Veja o motivo detalhado abaixo (tag inválida, treino não Ativo, ou máquina fora da habilitação).";
    }
    preencherDetalhes(j);
  } catch (e) {
    msg.className = "msg erro";
    msg.textContent =
      "Não foi possível falar com o servidor. Verifique se o aplicativo Python está rodando (uvicorn) e o endereço do navegador (ex.: http://127.0.0.1:8765).";
  } finally {
    load.classList.add("hidden");
  }
});

carregarDemo();
