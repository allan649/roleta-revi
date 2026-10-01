# Templates de WhatsApp da roleta

Crie em Revi › Templates › WhatsApp › **+ Criar template**. Troque `%%MARCA%%`, `%%EVENTO%%`, `%%SITE%%` e
`%%VALIDADE%%` antes de colar.

Regras da Revi e da Meta que valem para os dois modelos:

- **Nome:** apenas letras minúsculas, números e espaços (os espaços viram `_` ao salvar). Ex.: `roleta evento 26 cupom`.
- **Corpo:** até 550 caracteres na Revi; o validador interno pede menos de 385.
- **Parâmetros** são texto entre colchetes: `[nome do consumidor]` é padrão; o cupom é o parâmetro do campo
  customizado onde o webhook grava `premio.cupom` (escolha no seletor de parâmetros do template).
  Nunca comece nem termine o corpo com um parâmetro: a Meta rejeita.
- **Cupom é Marketing.** Template Utility com cupom ou desconto é rejeitado ou reclassificado pela Meta,
  mesmo com texto transacional.
- O link do botão faz parte do que a Meta aprova: use o endereço definitivo do site.
- A aprovação leva de minutos a 24 h. Submeta com folga antes do evento.

## 1. Cupom no WhatsApp (tipo Marketing)

Use quando o canal da roleta é WhatsApp (`CONFIG.canal = 'whatsapp'`).

- **Tipo de template:** MARKETING
- **Cabeçalho:** Nenhum (ou uma imagem da marca, com URL pública)
- **Corpo:**

```
Oi, [nome do consumidor]! Obrigado por girar a roleta da %%MARCA%% no %%EVENTO%%. 🎉

Seu cupom é *[cupom]*. Use no carrinho em %%SITE%% e aproveite.

%%VALIDADE%%. Sujeito às regras do prêmio.
```

- **Rodapé:** `%%MARCA%%`
- **Botão:** URL · "Usar meu cupom" · `%%SITE%%`

## 2. Confirmação sem cupom (tipo Utility)

Use quando o cupom vai por e-mail e a marca quer só avisar no WhatsApp. Sem cupom, sem desconto, sem oferta.

- **Tipo de template:** UTILITY
- **Corpo:**

```
Oi, [nome do consumidor]! Sua participação na roleta da %%MARCA%% no %%EVENTO%% está confirmada.

Enviamos o seu prêmio para o e-mail cadastrado. Se não encontrar, confira as pastas de spam e promoções.
```

- **Rodapé:** `%%MARCA%%`
