/**
 * Cenários de teste: preenchem tag + máquina; o usuário clica em "Simular" em seguida.
 */
const CENARIOS = [
  {
    id: "t1",
    label: "Ana · CNC-01",
    desc: "Treino Ativo; máquina autorizada. Esperado: liberação.",
    maquina: "CNC-01",
    tag: "E004A1F2",
    esperado: "Liberar",
  },
  {
    id: "t2",
    label: "Ana · PRENSA-03",
    desc: "Mesmo colaborador em outro posto autorizado.",
    maquina: "PRENSA-03",
    tag: "E004A1F2",
    esperado: "Liberar",
  },
  {
    id: "t3",
    label: "Bruno · treino Pendente",
    desc: "Tag cadastrada, mas status ≠ Ativo.",
    maquina: "CNC-01",
    tag: "B009C3D4",
    esperado: "Bloquear",
  },
  {
    id: "t4",
    label: "Carla · máquina errada",
    desc: "Treino Ativo, mas só na PRENSA-03.",
    maquina: "CNC-01",
    tag: "F0019999",
    esperado: "Bloquear",
  },
  {
    id: "t5",
    label: "Carla · PRENSA-03",
    desc: "Treino Ativo e máquina na lista de habilitação.",
    maquina: "PRENSA-03",
    tag: "F0019999",
    esperado: "Liberar",
  },
  {
    id: "t6",
    label: "Tag vazia",
    desc: "Nenhum código lido — bloqueio na entrada.",
    maquina: "CNC-01",
    tag: "",
    esperado: "Bloquear",
  },
  {
    id: "t7",
    label: "Tag inexistente",
    desc: "Código desconhecido no cadastro de RH.",
    maquina: "CNC-01",
    tag: "ZZZZ9999",
    esperado: "Bloquear",
  },
];

const $ = (id) => document.getElementById(id);

function renderCenarios() {
  const grid = $("cenarios");
  grid.innerHTML = "";
  CENARIOS.forEach((c) => {
    const isOk = c.esperado === "Liberar";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-cenario";
    b.dataset.cenarioId = c.id;
    b.innerHTML = `
      <div class="btn-cenario__head">
        <span class="btn-cenario__titulo">${c.label}</span>
        <span class="btn-cenario__exp ${isOk ? "is-ok" : "is-bad"}">${isOk ? "OK" : "BLOQ"}</span>
      </div>
      <div class="btn-cenario__desc">${c.desc}</div>
    `;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => aplicarCenario(c.id));
    grid.appendChild(b);
  });
}

function aplicarCenario(id) {
  const c = CENARIOS.find((x) => x.id === id);
  if (!c) return;

  const sel = $("maquina");
  if ([...sel.options].some((o) => o.value === c.maquina)) {
    sel.value = c.maquina;
  }
  $("tag").value = c.tag;

  document.querySelectorAll(".btn-cenario").forEach((btn) => {
    const ativo = btn.dataset.cenarioId === id;
    btn.classList.toggle("is-selected", ativo);
    btn.setAttribute("aria-pressed", ativo ? "true" : "false");
  });

  $("cenario-ativo-badge").textContent = `Cenário: ${c.label}`;

  const msg = $("msg");
  msg.className = "msg neutro";
  msg.innerHTML =
    "Cenário aplicado. Clique em <strong>Simular leitura e consultar RH</strong> para ver a decisão do MES.";
  $("detalhes").innerHTML = "";
  resetarSinal();
}

function resetarSinal() {
  const v = $("signal-value");
  const f = $("signal-fill");
  v.textContent = "—";
  v.classList.remove("is-ok", "is-bad");
  f.classList.remove("is-ok", "is-bad");
  f.style.width = "0";
  $("result-tag").textContent = "Aguardando";
  $("result-tag").classList.remove("is-ok", "is-bad");
}

function preencherSinal(permitido) {
  const v = $("signal-value");
  const f = $("signal-fill");
  if (permitido) {
    v.textContent = "1 (HIGH) — partida liberada";
    v.classList.add("is-ok");
    v.classList.remove("is-bad");
    f.classList.add("is-ok");
    f.classList.remove("is-bad");
  } else {
    v.textContent = "0 (LOW) — partida bloqueada";
    v.classList.add("is-bad");
    v.classList.remove("is-ok");
    f.classList.add("is-bad");
    f.classList.remove("is-ok");
  }
}

async function carregarDemo() {
  const status = $("status-srv");
  const statusTxt = $("status-srv-txt");
  try {
    const r = await fetch("/api/tags-demo");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();

    const tbody = document.querySelector("#tbl-rh tbody");
    tbody.innerHTML = "";
    j.colaboradores_simulados.forEach((c) => {
      const tr = document.createElement("tr");
      const status = c.status_treinamento === "Ativo"
        ? '<span class="pill pill--ok">Ativo</span>'
        : `<span class="pill pill--off">${c.status_treinamento}</span>`;
      tr.innerHTML = `
        <td><span class="tag-mono">${c.tag}</span></td>
        <td>${c.nome}</td>
        <td>${status}</td>
        <td>${c.maquinas_autorizadas.join(", ")}</td>
      `;
      tbody.appendChild(tr);
    });

    const sel = $("maquina");
    if (j.maquinas && j.maquinas.length) {
      sel.innerHTML = "";
      j.maquinas.forEach((m) => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        sel.appendChild(o);
      });
    }

    statusTxt.textContent = "Servidor online";
    status.classList.add("is-ok");
    status.classList.remove("is-bad");
  } catch (_) {
    statusTxt.textContent = "Servidor offline";
    status.classList.add("is-bad");
    status.classList.remove("is-ok");
  }
  renderCenarios();
}

function preencherDetalhes(obj) {
  const dl = $("detalhes");
  dl.innerHTML = "";
  const pares = [
    ["Colaborador", obj.colaborador],
    ["Tag RFID", obj.tag],
    ["Máquina", obj.maquina || $("maquina").value],
    ["Decisão do RH", obj.motivo],
    ["Ação do MES", obj.mes_acao],
    ["Start_Permit (CLP)", obj.start_permit ? "SIM" : "NÃO"],
  ];
  pares.forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    const dk = document.createElement("div");
    dk.className = "k";
    dk.textContent = k;
    const dv = document.createElement("div");
    dv.className = "v";
    dv.textContent = String(v);
    dl.appendChild(dk);
    dl.appendChild(dv);
  });
}

$("btn").addEventListener("click", async () => {
  const tag = $("tag").value;
  const id_maquina = $("maquina").value;
  const msg = $("msg");
  const load = $("loading");

  msg.className = "msg neutro";
  msg.textContent = "Consultando o cadastro de RH (simulado)…";
  $("detalhes").innerHTML = "";
  resetarSinal();
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
      msg.innerHTML =
        "<strong>Aprovado.</strong> Treinamento Ativo no RH e máquina autorizada — o MES enviaria <code>Start_Permit</code> ao CLP.";
      $("result-tag").textContent = "Liberado";
      $("result-tag").classList.add("is-ok");
    } else {
      msg.className = "msg erro";
      msg.innerHTML =
        "<strong>Bloqueado.</strong> Partida não autorizada. Veja o motivo abaixo.";
      $("result-tag").textContent = "Bloqueado";
      $("result-tag").classList.add("is-bad");
    }

    preencherDetalhes(j);
    preencherSinal(!!j.permitido);
  } catch (_) {
    msg.className = "msg erro";
    msg.textContent =
      "Falha de comunicação com o servidor. Verifique se o backend (FastAPI/uvicorn) está rodando.";
  } finally {
    load.classList.add("hidden");
  }
});

$("btn-clear").addEventListener("click", () => {
  $("tag").value = "";
  document.querySelectorAll(".btn-cenario").forEach((b) => b.classList.remove("is-selected"));
  $("cenario-ativo-badge").textContent = "Nenhum selecionado";
  const msg = $("msg");
  msg.className = "msg neutro";
  msg.innerHTML =
    "Selecione um cenário ao lado direito ou preencha os campos acima e clique em <strong>Simular leitura e consultar RH</strong>.";
  $("detalhes").innerHTML = "";
  resetarSinal();
});

carregarDemo();
