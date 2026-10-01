// Envia UM payload de teste ao webhook da Revi, com o SEU contato, para conferir o secret e o mapeamento.
// Uso:
//   node --env-file=.env scripts/enviar-payload.mjs --nome "Seu Nome" --email voce@email.com --telefone 11987654321
//   (opcional) --cupom ROLETA10   usa esse código em premio.cupom (padrão: o do payload-exemplo.json)
//
// O payload-exemplo.json tem dados fictícios. Se a automação da Revi já estiver ativa, o template vai para
// o contato do payload: por isso o script só envia com o seu e-mail e o seu WhatsApp.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values:arg } = parseArgs({ options:{ nome:{ type:'string' }, email:{ type:'string' }, telefone:{ type:'string' }, cupom:{ type:'string' } } });
const sair = (msg) => { console.error(msg); process.exit(1); };

const url = process.env.REVI_WEBHOOK_URL, secret = process.env.REVI_WEBHOOK_SECRET;
if (!url || !secret) sair('Faltam REVI_WEBHOOK_URL e REVI_WEBHOOK_SECRET. Copie .env.example para .env e rode com: node --env-file=.env scripts/enviar-payload.mjs ...');
if (!arg.nome || !arg.email || !arg.telefone) sair('Informe o SEU contato: --nome "Seu Nome" --email voce@email.com --telefone 11987654321');

let tel = arg.telefone.replace(/\D/g, '');
if (tel.length === 10 || tel.length === 11) tel = '55' + tel;
if (!/^55\d{10,11}$/.test(tel)) sair('Telefone inválido: use DDD + número, ex.: 11987654321');

const exemplo = JSON.parse(readFileSync(new URL('../payload-exemplo.json', import.meta.url), 'utf8'));
const payload = {
  ...exemplo,
  cliente:{ ...exemplo.cliente, nome:arg.nome, email:arg.email.trim().toLowerCase(), telefone:tel },
  premio:{ ...exemplo.premio, ...(arg.cupom && { cupom:arg.cupom }) },
  id_participacao:randomUUID(),
  enviado_em:new Date().toISOString(),
};

console.log(`Enviando para o webhook (${new URL(url).host}) o cliente ${payload.cliente.nome} <${payload.cliente.email}> · ${tel} · cupom ${payload.premio.cupom}`);
const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-revi-secret':secret }, body:JSON.stringify(payload) });
const corpo = await r.text();
console.log(`HTTP ${r.status} ${corpo}`);
if (r.status === 401) sair('401: a URL ou o secret estão errados (confira o .env com a tela do webhook na Revi).');
if (!r.ok) process.exit(1);
console.log('Pronto. Confira em Revi › Clientes se o contato recebeu a tag e o cupom no campo customizado.');
