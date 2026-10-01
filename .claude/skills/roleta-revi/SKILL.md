---
name: roleta-revi
description: Monta, do zero até o evento, uma roleta de cupons ("gire e ganhe") para uma marca, integrada à Revi por um único webhook. Pega logo, cores, fonte e benefícios do site da marca, configura prêmios e cupons, pede a URL e o secret do webhook, envia o primeiro payload de teste, orienta (ou faz pelo navegador) o webhook, o filtro e a automação de disparo na Revi, gera o template de e-mail ou WhatsApp e publica na Vercel. Use quando alguém disser "quero uma roleta para a marca X", "roleta de cupons para evento", "gire e ganhe", "roleta de prêmios no estande", "roleta integrada à Revi", "montar a roleta do evento", ou trouxer o site de uma marca pedindo uma roleta de captação. Não use para pop-up de captação nativo da Revi nem para disparar campanhas.
---

# Roleta de cupons integrada à Revi

O projeto base é https://github.com/allan649/roleta-revi: uma página estática (`index.html`), uma função da
Vercel (`api/cadastro.mjs`) que acrescenta o secret, um servidor local (`dev.mjs`), um script de teste
(`scripts/enviar-payload.mjs`) e os modelos de template (`templates/`). O roteiro detalhado de cada tela da Revi
está no `PASSO-A-PASSO.md` do projeto: leia a seção correspondente antes de orientar o usuário ou de agir no
navegador.

## Regras que não mudam

Estas regras vêm de problemas reais em produção. Não as altere sem o usuário pedir.

- **Um webhook só**, do tipo "Atualização de dados de cliente". Não crie webhooks de WhatsApp ou e-mail: o
  envio do cupom é uma automação da Revi que lê a tag e o campo do cupom.
- **Uma chamada por participação, só no giro.** Nada é enviado no envio do formulário. **Sem fila e sem
  reenvio:** falha fica registrada no aparelho e o CSV (`?exportar=1`) é o backup.
- **O secret nunca vai para o `index.html` nem para o git.** Ele fica no `.env` (local, no `.gitignore`) e nas
  variáveis de ambiente da Vercel. Não repita o valor do secret nas suas respostas.
- **Teste sempre com o contato do próprio usuário.** O `payload-exemplo.json` tem dados fictícios; com a
  automação ativa, o template iria para eles.
- **Cupom no WhatsApp é template Marketing.** Utility com cupom é rejeitado pela Meta.
- Não altere a arquitetura (proxy, número de webhooks, fluxo de envio) por conta própria: proponha e espere o sim.

## Navegador

Logo no início, ofereça: "Se quiser, eu assumo o navegador com a sua conta da Revi já logada e faço a
configuração (webhook, filtro, automação e template de WhatsApp). Você só precisa estar logado no Chrome."

Se o usuário aceitar:

- Invoque a skill `claude-in-chrome` antes de qualquer ferramenta `mcp__claude-in-chrome__*`.
- **Nunca digite senha nem faça login.** Se a sessão expirar ("Sessão expirada"), peça para o usuário entrar.
- **Confira a conta antes de criar qualquer coisa:** a sessão pode estar em outra empresa (o usuário troca de
  conta em outra aba). Verifique o nome da empresa e a lista de webhooks; se não for a marca, pare e avise.
- Use `find` + `form_input` com refs, não coordenadas; refaça o `find` depois de cada navegação.
- **Peça confirmação antes de salvar, ativar ou enviar para aprovação** (template vai para a Meta e conta na
  qualidade do número).
- O editor de e-mail (Unlayer) fica num iframe que não aceita automação: o conteúdo do e-mail é sempre um passo
  manual. Deixe o HTML na área de transferência (`pbcopy < arquivo`, no Mac) e passe o roteiro.
- Para criar template, se a skill `revi-templates` estiver disponível, siga-a.

Sem navegador, passe o roteiro do `PASSO-A-PASSO.md` passo a passo e confirme cada etapa com o usuário.

## Roteiro

### 1. Combine o plano e pegue o projeto

Explique em poucas linhas o que vai acontecer (página → webhook → automação → template → deploy), faça a
oferta do navegador e pergunte onde criar a pasta. Depois:

```bash
git clone --depth 1 https://github.com/allan649/roleta-revi.git <pasta-da-marca>
cd <pasta-da-marca> && git remote remove origin && cp .env.example .env
```

### 2. Pegue a marca no site

Peça o **site da marca**. Busque a home (WebFetch ou `curl -sL`) e extraia:

- nome da marca; logo (o `<img>`/`<svg>` do header, `og:image`); favicon (`<link rel="icon">`);
- cores: `meta theme-color`, variáveis CSS e as cores do header, botões e barra de anúncio;
- fonte: o `<link>` do Google Fonts ou o `font-family` do `body`;
- benefícios da barra de anúncio (frete, parcelamento, Pix, cashback);
- Instagram e plataforma da loja (Nuvemshop, Shopify, VTEX...), para lembrar onde os cupons são criados;
- até 3 fotos de produto ou campanha para o fundo.

Mostre um resumo e confirme com o usuário, principalmente as cores e o uso das fotos (só imagens que a marca
autorizou). Baixe logo e fotos para `assets/` e preencha `CONFIG.marca`, `TEMA` e o `<link>` da fonte no
`<head>`. Defina `TEMA.escuro` (a cor de texto e botões), `TEMA.claro` (um tom claro neutro) e o trio de
acento a partir da cor de destaque da marca (claro, médio, escuro).

### 3. Evento e prêmios

Pergunte: nome do evento, tag (sugira `ROLETA-<EVENTO>-<AA>`), canal do cupom (**e-mail ou WhatsApp**), prêmios
com código de cupom, chance de cada um, regra (valor mínimo, categorias) e validade. Lembre que os cupons
precisam existir na loja antes do evento.

Preencha `CONFIG.evento`, `slug`, `tag`, `canal`, `validadeCupons` e `PREMIOS` (a soma dos pesos é 100; uma
fatia `'destaque'`; alterne `'escuro'` e `'claro'`). Seções 2 e 3 do `PASSO-A-PASSO.md`.

### 4. Mostre a página

Rode `node --env-file=.env dev.mjs` em segundo plano e abra http://127.0.0.1:8765/?teste=1. Com o navegador,
tire um print e mostre; sem ele, peça para o usuário abrir. Ajuste até o usuário aprovar.

### 5. Webhook na Revi

Faça (navegador) ou oriente (seção 5 do `PASSO-A-PASSO.md`): campo customizado para o cupom, webhook
"Atualização de dados de cliente" com a tag automática, "Simular payload" com o `payload-exemplo.json` e o
mapeamento (telefone, nome, e-mail, nascimento e `premio.cupom` no campo do cupom).

Depois peça **a URL do webhook e o secret** (a tela mostra "URL para receber webhooks" e "Valor do secret";
o header é `x-revi-secret`). Grave os dois no `.env` e confirme com `git check-ignore .env` que ele está fora do
git.

### 6. Primeiro payload

Peça o **nome, e-mail e WhatsApp do próprio usuário** e rode:

```bash
node --env-file=.env scripts/enviar-payload.mjs --nome "<nome>" --email <email> --telefone <ddd+número>
```

- `HTTP 200`: peça para conferir em Clientes se o contato tem a tag e o cupom (ou confira pelo navegador).
- `401`: URL ou secret errados; compare com a tela do webhook.
- Cupom vazio no cliente: falta mapear `premio.cupom` no campo customizado.

### 7. Template

- **E-mail:** copie `templates/email.html` para `templates/email-<slug>.html`, troque os marcadores `%%...%%`
  (marca, site, logo com URL pública, cores, evento, validade, UTM `utm_source=revi&utm_medium=email&utm_campaign=roleta_<slug>`,
  Instagram) e entregue com o roteiro da seção 7 do `PASSO-A-PASSO.md`: o `{{cupom}}` deve ser trocado no
  editor pela variável do campo customizado. Sugira assunto e pré-header.
- **WhatsApp:** preencha o modelo 1 de `templates/whatsapp.md` (Marketing). Respeite: nome com minúsculas,
  números e espaços; corpo abaixo de 385 caracteres; parâmetro nunca no começo nem no fim. Crie pelo navegador
  se o usuário quiser, confirmando antes de enviar para aprovação.

### 8. Disparo

Seção 8 do `PASSO-A-PASSO.md`: filtro em Clientes pela tag e Campanha Automatizada (Envios automatizados) com o
template, frequência diária e horários cobrindo o evento, sem repetir para o mesmo cliente. Ajuste
`CONFIG.prazoEntrega` ao intervalo dos horários (a tela promete esse prazo). Confirme que o contato do teste
recebeu o template no horário seguinte.

### 9. Publicar

O usuário precisa de um repositório próprio (pode ser privado): crie com `gh repo create` se ele quiser, ou
peça para criar. Commit sem o `.env` (confira com `git status` antes). Na Vercel: importar o repositório,
Framework Preset "Other", cadastrar `REVI_WEBHOOK_URL` e `REVI_WEBHOOK_SECRET` em Production e fazer o deploy.
**Peça para o usuário cadastrar o secret na Vercel** (ou use o conector da Vercel, se ele autorizar). Teste a URL
publicada com `?teste=1` e o contato do usuário: uma requisição `cadastro` no giro, HTTP 200.

### 10. Entrega

Termine com o checklist do evento (seção 10 do `PASSO-A-PASSO.md`): `?limpar=1` antes de abrir o estande,
`?exportar=1` como backup, significado do rodapé vermelho e laranja, e o link publicado.
