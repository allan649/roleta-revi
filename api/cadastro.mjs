// Repassa o envio da roleta ao webhook da Revi ("Atualização de dados de cliente") com o header x-revi-secret, que a Revi exige.
// URL e secret vêm de REVI_WEBHOOK_URL e REVI_WEBHOOK_SECRET: o .env no computador (dev.mjs) e as variáveis
// de ambiente do projeto na Vercel. Nunca ficam na página.
const TELEFONE = /^55\d{10,11}$/;
const json = (corpo, status) => Response.json(corpo, { status });

export async function POST(request) {
  const url = process.env.REVI_WEBHOOK_URL, secret = process.env.REVI_WEBHOOK_SECRET;
  if (!url || !secret) return json({ erro:'REVI_WEBHOOK_URL e REVI_WEBHOOK_SECRET não configurados' }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ erro:'JSON inválido' }, 400); }
  if (!TELEFONE.test(payload?.cliente?.telefone ?? '')) return json({ erro:'cliente.telefone inválido' }, 400);

  try {
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-revi-secret':secret },
      body:JSON.stringify(payload),
      signal:AbortSignal.timeout(10000),
    });
    if (!r.ok) console.error(`[cadastro] a Revi respondeu ${r.status}`);
    return new Response(await r.text(), { status:r.status, headers:{ 'Content-Type':r.headers.get('content-type') ?? 'application/json' } });
  } catch (err) {
    console.error('[cadastro] falha ao chamar a Revi', err);
    return json({ erro:'falha ao chamar a Revi' }, 502);
  }
}
