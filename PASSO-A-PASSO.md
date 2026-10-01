# Passo a passo: roleta de cupons integrada à Revi

Do zero até a roleta funcionando no evento, sem precisar do Claude. Com o Claude Code, a skill `roleta-revi`
faz esse mesmo roteiro com você (veja o [README](README.md)).

**Como funciona:** a pessoa se cadastra no totem, toca em GIRAR e ganha um cupom. Nesse momento, e só nele,
a página manda **uma** requisição para **um** webhook da Revi, do tipo "Atualização de dados de cliente". O
webhook grava a cliente, aplica a tag do evento e salva o cupom num campo customizado. Uma automação da Revi
pega quem tem a tag e envia o template (e-mail ou WhatsApp) com o cupom.

```
Totem ──(giro)──▶ /api/cadastro (Vercel, põe o secret) ──▶ Webhook Revi ──▶ cliente + tag + cupom
                                                                                   │
                                     Envios automatizados (filtro pela tag) ◀──────┘──▶ template com o cupom
```

## 0. O que você precisa

- Acesso à conta da marca na Revi (Automações, Templates e Clientes).
- Os cupons criados na plataforma da loja (Nuvemshop, Shopify, VTEX...), com a validade do evento.
- Conta no GitHub e na Vercel (o plano gratuito basta).
- Node.js 20.11 ou mais novo, para testar no computador.

## 1. Copie o projeto

No GitHub, clique em **Use this template** › **Create a new repository** (pode ser privado). Depois:

```bash
git clone https://github.com/<voce>/<sua-roleta>.git
cd <sua-roleta>
cp .env.example .env
```

## 2. Configure a marca

Tudo fica no topo do `<script>` do `index.html`:

- `CONFIG.marca`: nome, logo (`assets/logo.png` ou URL), favicon, até 3 fotos de fundo (`assets/...`) e os
  benefícios do letreiro (frete, parcelamento, Pix, cashback). Sem fotos, o fundo vira um degradê com as cores.
- `TEMA`: cores e fonte. A fonte também precisa ser trocada no `<link>` do Google Fonts, no `<head>`.
- `CONFIG.evento`, `CONFIG.slug` (identificador curto, sem espaço), `CONFIG.tag` (a tag que o webhook vai aplicar),
  `CONFIG.canal` (`'email'` ou `'whatsapp'`), `CONFIG.validadeCupons` e `CONFIG.prazoEntrega`.
- `CONFIG.poweredByRevi`: `true` mostra o "Powered by Revi" no cadastro e no resultado.

Use só imagens e logo que a marca autorizou.

## 3. Configure os prêmios

`PREMIOS` define as fatias, na ordem em que aparecem (sentido horário, a partir do topo):

| Campo | O que é |
|---|---|
| `valor`, `sufixo` | o que aparece grande na fatia (`'10%'` + `'OFF'`). Para brinde ou frete, use `sufixo:''` |
| `l1`, `l2` | as linhas pequenas da fatia (`'Site todo'`, ou `'Novidades'` + `'da Semana'`) |
| `onde` | completa a frase do resultado: "10% OFF **no site todo**" |
| `cupom` | o código que já existe na loja |
| `peso` | a chance em %. **A soma tem que dar 100** (o console avisa se não der) |
| `estilo` | `'destaque'` (o maior prêmio, uma fatia só), `'escuro'` ou `'claro'`; alterne escuro e claro |
| `regra` | aparece no resultado e vai no payload (`'Compra mínima de R$200'`) |

## 4. Teste a página no computador

```bash
node --env-file=.env dev.mjs
```

Abra http://127.0.0.1:8765/?teste=1. Enquanto o `.env` estiver sem URL e secret, o giro funciona, mas o envio
falha com HTTP 503 (o rodapé fica vermelho). É o esperado até o passo 6.

## 5. Crie o campo do cupom e o webhook na Revi

1. Crie um **campo customizado** do cliente, do tipo texto, para guardar o cupom (ex.: "Cupom Roleta").
2. Vá em **Automações › Receber webhooks › + Receber webhook** e preencha:
   - **Nome:** `Roleta <Evento> - Cadastro`
   - **Tipo de recebimento:** Atualização de dados de cliente
   - **Tags aplicadas automaticamente:** digite a tag do `CONFIG.tag` e crie pelo próprio seletor
     ("Buscar ou criar tag...")
   - **Ativo:** ligado
3. Na aba **2. Simular payload**, cole o conteúdo de `payload-exemplo.json` e processe: os caminhos viram sugestões.
4. Na aba **1. Mapeamento de dados**, ligue cada campo ao caminho do JSON:

   | Campo na Revi | Caminho no payload |
   |---|---|
   | Telefone | `cliente.telefone` |
   | Nome | `cliente.nome` |
   | Email | `cliente.email` |
   | Nascimento | `cliente.data_nascimento` |
   | o campo customizado do cupom | `premio.cupom` |

5. Salve. Na tela do recebimento, copie a **URL para receber webhooks** e o **Valor do secret** (o header é
   `x-revi-secret`).

A Revi recusa com **401** qualquer chamada sem o secret. Por isso ele nunca vai no `index.html`: a página chama
`/api/cadastro` (`api/cadastro.mjs`), que lê a URL e o secret das variáveis de ambiente e acrescenta o header.

## 6. Envie o primeiro payload

Coloque a URL e o secret no `.env`:

```
REVI_WEBHOOK_URL=https://api.userevi.com/webhooks/listeners/<id>
REVI_WEBHOOK_SECRET=<valor do secret>
```

E mande um payload de teste **com o seu próprio contato** (o script recusa enviar sem ele, porque o exemplo tem
dados fictícios e a automação, quando estiver ativa, manda o template para quem estiver no payload):

```bash
node --env-file=.env scripts/enviar-payload.mjs --nome "Seu Nome" --email voce@email.com --telefone 11987654321
```

Esperado: `HTTP 200`. Confira em **Clientes** que o seu contato ganhou a tag e o cupom no campo customizado.
Com 401, a URL ou o secret do `.env` não batem com a tela do webhook.

## 7. Crie o template

**E-mail** (`CONFIG.canal = 'email'`):

1. Abra `templates/email.html` e troque os marcadores `%%...%%` (marca, site, logo, cores, evento, validade).
   O logo precisa de URL pública e absoluta (a do site da marca, ou `https://<seu-deploy>.vercel.app/assets/logo.png`).
2. Em **Templates › Email › novo**: nome, assunto (ex.: "Seu cupom da roleta chegou 🎁"), pré-header e tipo.
3. Arraste o bloco **HTML** para o editor, clique nele e cole o conteúdo do arquivo.
4. Troque `{{cupom}}` pela variável do campo customizado do cupom, pelo seletor de variáveis do editor.
   `{{nome do consumidor}}` é padrão.
5. Salve.

O editor só aceita fragmento: nada de `<html>`, `<head>` ou `<style>`; o arquivo já vem com estilo inline.

**WhatsApp** (`CONFIG.canal = 'whatsapp'`): use `templates/whatsapp.md`. Cupom é sempre **Marketing**:
template Utility com cupom é rejeitado pela Meta. Envie para aprovação com antecedência (de minutos a 24 h).

## 8. Configure o disparo

1. Em **Clientes**, crie e salve um **filtro** com quem tem a tag do evento (`CONFIG.tag`).
2. Em **Automações › Envios automatizados › + Criar Automação** (Campanha Automatizada):
   - **Nome:** `Roleta <Evento> - Cupom`
   - **Ação:** Enviar template (escolha o template de e-mail ou de WhatsApp) ou Acionar fluxo (se você montou um
     fluxo em Fluxos de Mensagem)
   - **Filtro:** o do passo 1
   - **Frequência:** Diário, com os horários de disparo cobrindo o período do evento
   - **Receber mais de uma vez:** não
   - **Ativa:** sim
3. O cupom chega no próximo horário programado. Ajuste `CONFIG.prazoEntrega` para a tela prometer o prazo certo
   (ex.: `'em até 30 minutos'`).
4. Confirme que o seu contato do passo 6 recebe o template no próximo horário.

## 9. Publique na Vercel

1. Suba suas alterações para o seu repositório (o `.env` fica fora do git).
2. Na Vercel: **Add New › Project**, importe o repositório, **Framework Preset: Other**.
3. Em **Environment Variables**, cadastre `REVI_WEBHOOK_URL` e `REVI_WEBHOOK_SECRET` (Production).
4. **Deploy.** Cada mudança nas variáveis exige um novo deploy.
5. Teste em `https://<seu-projeto>.vercel.app/?teste=1` com o seu contato: no DevTools › Network deve aparecer uma
   única requisição `cadastro` no giro, com HTTP 200.

## 10. No evento

- Abra a URL no totem ou tablet em tela cheia (Chrome em modo quiosque, se possível).
- `?limpar=1` zera a lista de quem já participou e as falhas daquele aparelho. Rode antes de abrir o estande.
- `?exportar=1` baixa um CSV com todas as participações do aparelho: é o backup se algum envio falhar.
- Uma participação por e-mail ou WhatsApp, por aparelho. `?teste=1` desliga esse bloqueio (só para testes).
- O rodapé mostra o status: vermelho = envio falhou (não há reenvio automático; use o CSV), laranja = sem internet.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Envio com HTTP 401 | URL ou secret errados no `.env` ou na Vercel |
| Envio com HTTP 503 | faltam `REVI_WEBHOOK_URL`/`REVI_WEBHOOK_SECRET` na Vercel, ou faltou o novo deploy |
| Envio com HTTP 400 | telefone fora do formato `55` + DDD + número |
| Cliente sem o cupom na Revi | o campo customizado não foi mapeado para `premio.cupom` |
| Cupom não chega | template ainda não aprovado, filtro sem a tag, automação inativa ou fora do horário |
| Template de WhatsApp rejeitado | cupom em template Utility: refaça como Marketing |
| "pesos somam X, não 100" no console | ajuste os `peso` de `PREMIOS` |
