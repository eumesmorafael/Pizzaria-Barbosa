const resourceDefinitions = {
  eventos: { label: "Eventos", description: "Agenda, local, público e situação dos eventos.", fields: { nome: "Nome do evento", tipo: "Tipo", data: "Data de realização", cidade: "Cidade", local: "Local", publico: "Público esperado", representante: "CPF do representante", status: "Status" } },
  fornecedores: { label: "Fornecedores", description: "Parceiros, contatos e produtos fornecidos.", fields: { nome: "Nome ou razão social", documento: "CPF/CNPJ", endereco: "Endereço", telefone: "Telefone", email: "E-mail", cidade: "Cidade", produtos: "Produtos ou serviços" } },
  funcionarios: { label: "Funcionários", description: "Equipe, remuneração e acesso ao sistema.", fields: { nome: "Nome completo", cpf: "CPF", rg: "RG", cargaHoraria: "Carga horária", salario: "Salário", endereco: "Endereço", telefone: "Telefone", email: "E-mail", perfil: "Tipo de usuário" } },
  patrocinadores: { label: "Patrocinadores", description: "Apoiadores, valores e vínculo com eventos.", fields: { nome: "Nome ou razão social", documento: "CNPJ", endereco: "Endereço", telefone: "Telefone", email: "E-mail", cidade: "Cidade", valor: "Valor patrocinado", evento: "Evento relacionado", tipo: "Tipo de patrocínio" } },
  produtos: { label: "Produtos e serviços", description: "Itens e serviços disponíveis para contratação.", fields: { nome: "Nome do produto ou serviço", categoria: "Categoria", descricao: "Descrição", valor: "Valor estimado", fornecedor: "Fornecedor" } },
  convidados: { label: "Convidados", description: "Cadastro de participantes e convidados.", fields: { nome: "Nome completo", rg: "RG", cpf: "CPF", cidade: "Cidade", funcao: "Função", nascimento: "Data de nascimento", telefone: "Telefone", email: "E-mail" } },
  contratacoes: { label: "Contratações", description: "Fornecedores contratados, valores e datas.", fields: { evento: "Evento", fornecedor: "Fornecedor", produto: "Produto ou serviço", valor: "Valor total", data: "Data da contratação", status: "Status" } },
  orcamentos: { label: "Orçamentos", description: "Previsão de entradas, despesas e resultado.", fields: { evento: "Evento", receita: "Receita prevista", despesas: "Despesas previstas", impostos: "Impostos", comissao: "Comissão", observacoes: "Observações" } },
  historico: { label: "Histórico", description: "Resultados de eventos já realizados.", fields: { evento: "Evento", data: "Data de realização", publico: "Público presente", receita: "Receita final", despesas: "Despesas finais", lucro: "Lucro ou prejuízo", observacoes: "Observações" } }
};

const state = { resource: "eventos", records: {}, editingId: null };
const nav = document.getElementById("managementNav");
const table = document.getElementById("resourceTable");
const search = document.getElementById("resourceSearch");
const dialog = document.getElementById("recordDialog");
const form = document.getElementById("recordForm");
const localStorageKey = "thirtyone-gestao-dados";

function emptyManagementData() {
  return Object.keys(resourceDefinitions).reduce((data, resource) => {
    data[resource] = [];
    return data;
  }, {});
}

function readLocalData() {
  try {
    return { ...emptyManagementData(), ...JSON.parse(localStorage.getItem(localStorageKey) || "{}").data };
  } catch (error) {
    return emptyManagementData();
  }
}

function writeLocalData(data) {
  localStorage.setItem(localStorageKey, JSON.stringify({ data }));
}

function downloadFile(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function managementRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error("API indisponível");
    return response.status === 204 ? null : response.json();
  } catch (error) {
    const data = readLocalData();
    const parts = url.split("/").filter(Boolean);
    const resourceIndex = parts.indexOf("gestao") + 1;
    const resource = parts[resourceIndex];
    const id = parts[resourceIndex + 1] || null;
    const method = options.method || "GET";
    if (method === "GET") return resource ? data[resource] || [] : data;
    if (!resource || !data[resource]) throw error;
    if (method === "POST") {
      const record = { id: crypto.randomUUID(), criadoEm: new Date().toISOString(), ...JSON.parse(options.body) };
      data[resource].push(record);
      writeLocalData(data);
      return record;
    }
    const index = data[resource].findIndex((record) => record.id === id);
    if (index < 0) throw error;
    if (method === "PUT") data[resource][index] = { ...data[resource][index], ...JSON.parse(options.body) };
    if (method === "DELETE") data[resource].splice(index, 1);
    writeLocalData(data);
    return method === "DELETE" ? null : data[resource][index];
  }
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";
}

function buildNavigation() {
  nav.innerHTML = Object.entries(resourceDefinitions).map(([key, definition]) => `<button class="management-nav-item ${key === state.resource ? "active" : ""}" data-resource="${key}"><span>${definition.label}</span><b>${(state.records[key] || []).length}</b></button>`).join("");
  nav.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => selectResource(button.dataset.resource)));
}

function selectResource(resource) {
  state.resource = resource;
  search.value = "";
  document.getElementById("resourceTitle").textContent = resourceDefinitions[resource].label;
  document.getElementById("resourceDescription").textContent = resourceDefinitions[resource].description;
  buildNavigation();
  renderTable();
}

function displayValue(key, value) {
  if (["valor", "salario", "receita", "despesas", "impostos", "comissao", "lucro"].includes(key)) return money(value);
  return value || "-";
}

function renderTable() {
  const definition = resourceDefinitions[state.resource];
  const query = search.value.trim().toLowerCase();
  const records = (state.records[state.resource] || []).filter((record) => !query || Object.values(record).some((value) => String(value).toLowerCase().includes(query)));
  const columns = Object.entries(definition.fields).slice(0, 5);
  if (!records.length) {
    table.innerHTML = `<div class="empty-state"><strong>Nenhum registro encontrado</strong><span>Comece adicionando um cadastro neste módulo.</span></div>`;
    return;
  }
  table.innerHTML = `<table><thead><tr>${columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${records.map((record) => `<tr>${columns.map(([key]) => `<td>${displayValue(key, record[key])}</td>`).join("")}<td class="table-actions"><button data-action="edit" data-id="${record.id}">Editar</button><button data-action="delete" data-id="${record.id}">Excluir</button></td></tr>`).join("")}</tbody></table>`;
  table.querySelectorAll("[data-action=edit]").forEach((button) => button.addEventListener("click", () => openDialog(button.dataset.id)));
  table.querySelectorAll("[data-action=delete]").forEach((button) => button.addEventListener("click", () => deleteRecord(button.dataset.id)));
}

function exportCurrentResource() {
  const definition = resourceDefinitions[state.resource];
  const query = search.value.trim().toLowerCase();
  const records = (state.records[state.resource] || []).filter((record) => !query || Object.values(record).some((value) => String(value).toLowerCase().includes(query)));
  const columns = Object.entries(definition.fields);
  const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.map(([, label]) => csvValue(label)).join(";"), ...records.map((record) => columns.map(([key]) => csvValue(record[key])).join(";"))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${state.resource}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderStats() {
  const all = Object.values(state.records).flat();
  const events = state.records.eventos || [];
  const budgets = state.records.orcamentos || [];
  const revenue = budgets.reduce((total, item) => total + Number(item.receita || 0), 0);
  document.getElementById("managementStats").innerHTML = `<article><span>Eventos cadastrados</span><strong>${events.length}</strong><small>Agenda operacional</small></article><article><span>Cadastros ativos</span><strong>${all.length}</strong><small>Todos os módulos</small></article><article><span>Receita prevista</span><strong>${money(revenue)}</strong><small>Orçamentos registrados</small></article><article><span>Contratações</span><strong>${(state.records.contratacoes || []).length}</strong><small>Fornecedores e serviços</small></article>`;
  renderAgenda();
}

function renderAgenda() {
  const agenda = document.getElementById("agendaList");
  const events = (state.records.eventos || []).filter((event) => event.data).sort((first, second) => first.data.localeCompare(second.data)).slice(0, 4);
  if (!events.length) {
    agenda.innerHTML = `<div class="agenda-empty">Nenhum evento com data cadastrada ainda. Adicione a data ao criar um evento para acompanhar sua agenda aqui.</div>`;
    return;
  }
  agenda.innerHTML = events.map((event) => {
    const date = new Date(`${event.data}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
    return `<article class="agenda-item"><strong>${date}</strong><div><b>${event.nome || "Evento sem nome"}</b><span>${event.cidade || "Cidade não informada"} · ${event.local || "Local não informado"}</span></div><em>${event.status || "Planejado"}</em></article>`;
  }).join("");
}

function openDialog(id = null) {
  state.editingId = id;
  const definition = resourceDefinitions[state.resource];
  const record = (state.records[state.resource] || []).find((item) => item.id === id) || {};
  document.getElementById("dialogTitle").textContent = `${id ? "Editar" : "Novo"} ${definition.label.toLowerCase()}`;
  document.getElementById("formFields").innerHTML = Object.entries(definition.fields).map(([key, label]) => `<label>${label}<input name="${key}" type="${["data", "nascimento"].includes(key) ? "date" : ["valor", "salario", "receita", "despesas", "impostos", "comissao", "lucro", "publico"].includes(key) ? "number" : "text"}" value="${String(record[key] || "").replaceAll('"', "&quot;")}" ${["descricao", "observacoes"].includes(key) ? "maxlength=500" : ["nome", "evento"].includes(key) ? "required" : ""}></label>`).join("");
  dialog.showModal();
}

async function saveRecord(event) {
  event.preventDefault();
  const record = Object.fromEntries(new FormData(form).entries());
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return alert("Informe um e-mail válido.");
  if (record.documento && ![11, 14].includes(record.documento.replace(/\D/g, "").length)) return alert("CPF ou CNPJ inválido.");
  const numericFields = ["valor", "salario", "receita", "despesas", "impostos", "comissao", "lucro", "publico"];
  if (numericFields.some((key) => record[key] !== "" && Number(record[key]) < 0)) return alert("Valores e quantidades não podem ser negativos.");
  const url = `/api/gestao/${state.resource}${state.editingId ? `/${state.editingId}` : ""}`;
  try {
    await managementRequest(url, { method: state.editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
  } catch (error) {
    return alert("Não foi possível salvar o registro.");
  }
  await loadData();
  dialog.close();
}

async function deleteRecord(id) {
  if (!confirm("Excluir este registro?")) return;
  try {
    await managementRequest(`/api/gestao/${state.resource}/${id}`, { method: "DELETE" });
  } catch (error) {
    return alert("Não foi possível excluir o registro.");
  }
  await loadData();
}

async function loadData() {
  state.records = await managementRequest("/api/gestao");
  renderStats();
  buildNavigation();
  selectResource(state.resource);
}

document.getElementById("newRecordButton").addEventListener("click", () => openDialog());
document.getElementById("backupButton").addEventListener("click", () => downloadFile(`backup-gestao-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exportadoEm: new Date().toISOString(), data: state.records }, null, 2), "application/json"));
document.getElementById("restoreButton").addEventListener("click", () => document.getElementById("restoreInput").click());
document.getElementById("restoreInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    const data = backup.data || backup;
    if (!data.eventos || !confirm("Restaurar este backup e substituir os dados locais?")) return;
    writeLocalData({ ...emptyManagementData(), ...data });
    await loadData();
  } catch (error) {
    alert("Arquivo de backup inválido.");
  }
  event.target.value = "";
});
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelDialog").addEventListener("click", () => dialog.close());
form.addEventListener("submit", saveRecord);
search.addEventListener("input", renderTable);
document.getElementById("exportButton").addEventListener("click", exportCurrentResource);
document.getElementById("openEventsButton").addEventListener("click", () => selectResource("eventos"));
loadData().catch(() => { table.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar a gestão</strong><span>Recarregue a página e tente novamente.</span></div>`; });
