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

function renderStats() {
  const all = Object.values(state.records).flat();
  const events = state.records.eventos || [];
  const budgets = state.records.orcamentos || [];
  const revenue = budgets.reduce((total, item) => total + Number(item.receita || 0), 0);
  document.getElementById("managementStats").innerHTML = `<article><span>Eventos cadastrados</span><strong>${events.length}</strong><small>Agenda operacional</small></article><article><span>Cadastros ativos</span><strong>${all.length}</strong><small>Todos os módulos</small></article><article><span>Receita prevista</span><strong>${money(revenue)}</strong><small>Orçamentos registrados</small></article><article><span>Contratações</span><strong>${(state.records.contratacoes || []).length}</strong><small>Fornecedores e serviços</small></article>`;
}

function openDialog(id = null) {
  state.editingId = id;
  const definition = resourceDefinitions[state.resource];
  const record = (state.records[state.resource] || []).find((item) => item.id === id) || {};
  document.getElementById("dialogTitle").textContent = `${id ? "Editar" : "Novo"} ${definition.label.toLowerCase()}`;
  document.getElementById("formFields").innerHTML = Object.entries(definition.fields).map(([key, label]) => `<label>${label}<input name="${key}" type="${["data", "nascimento"].includes(key) ? "date" : ["valor", "salario", "receita", "despesas", "impostos", "comissao", "lucro", "publico"].includes(key) ? "number" : "text"}" value="${String(record[key] || "").replaceAll('"', "&quot;")}" ${["descricao", "observacoes"].includes(key) ? "maxlength=500" : "required"}></label>`).join("");
  dialog.showModal();
}

async function saveRecord(event) {
  event.preventDefault();
  const record = Object.fromEntries(new FormData(form).entries());
  const url = `/api/gestao/${state.resource}${state.editingId ? `/${state.editingId}` : ""}`;
  const response = await fetch(url, { method: state.editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
  if (!response.ok) return alert("Não foi possível salvar o registro.");
  await loadData();
  dialog.close();
}

async function deleteRecord(id) {
  if (!confirm("Excluir este registro?")) return;
  const response = await fetch(`/api/gestao/${state.resource}/${id}`, { method: "DELETE" });
  if (!response.ok) return alert("Não foi possível excluir o registro.");
  await loadData();
}

async function loadData() {
  const response = await fetch("/api/gestao");
  state.records = await response.json();
  renderStats();
  buildNavigation();
  selectResource(state.resource);
}

document.getElementById("newRecordButton").addEventListener("click", () => openDialog());
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelDialog").addEventListener("click", () => dialog.close());
form.addEventListener("submit", saveRecord);
search.addEventListener("input", renderTable);
loadData().catch(() => { table.innerHTML = `<div class="empty-state"><strong>Servidor indisponível</strong><span>Inicie o projeto com <code>npm start</code> para carregar a gestão.</span></div>`; });
