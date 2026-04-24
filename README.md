# 🤖 Agente WhatsApp — Escritório/Consultório

Agente de atendimento automático para WhatsApp usando Claude (Anthropic) + Meta Cloud API.

---

## 📋 Pré-requisitos

- Conta no GitHub ✅
- Conta no Railway (railway.app)
- Conta na Anthropic (console.anthropic.com)
- Conta Meta for Developers (developers.facebook.com)

---

## 🚀 Passo a Passo de Deploy

### ETAPA 1 — Subir o código no GitHub

1. Acesse github.com → clique em **"New repository"**
2. Nome: `whatsapp-agente` → clique em **"Create repository"**
3. Faça upload dos arquivos desta pasta (arraste e solte na tela do GitHub)
4. Clique em **"Commit changes"**

---

### ETAPA 2 — Deploy no Railway

1. Acesse railway.app → **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione o repositório `whatsapp-agente`
4. Clique em **"Deploy Now"**
5. Após o deploy, vá em **"Settings" → "Networking" → "Generate Domain"**
6. Copie a URL gerada (ex: `https://whatsapp-agente-production.up.railway.app`)

**Configurar variáveis de ambiente no Railway:**

Vá em **"Variables"** e adicione uma a uma:

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic |
| `VERIFY_TOKEN` | Qualquer texto seguro (ex: `meu-token-abc123`) |
| `WHATSAPP_TOKEN` | Token do WhatsApp (passo 3) |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número (passo 3) |
| `BUSINESS_NAME` | Nome do seu escritório |
| `BUSINESS_AREA` | Área de atuação |
| `BUSINESS_HOURS` | Horário de atendimento |
| `CONTACT_PHONE` | Telefone para contato humano |

---

### ETAPA 3 — Configurar WhatsApp na Meta

1. Acesse developers.facebook.com → **"My Apps" → "Create App"**
2. Tipo: **"Business"** → avance
3. Adicione o produto **"WhatsApp"**
4. Em **"WhatsApp → API Setup"**, você verá:
   - **Phone Number ID** → copie e cole no Railway
   - **Temporary Access Token** → copie e cole no Railway como `WHATSAPP_TOKEN`

5. Em **"WhatsApp → Configuration → Webhook"**:
   - **Callback URL:** `https://SUA-URL-DO-RAILWAY.up.railway.app/webhook`
   - **Verify Token:** o mesmo valor que você colocou em `VERIFY_TOKEN`
   - Clique em **"Verify and Save"**

6. Em **"Webhook Fields"**, ative **"messages"**

---

### ETAPA 4 — Testar

1. Na Meta, adicione seu número pessoal como número de teste
2. Envie uma mensagem de WhatsApp para o número de teste da Meta
3. O agente deve responder automaticamente! 🎉

---

## 🛠 Personalização

Para ajustar o comportamento do agente, edite o `SYSTEM_PROMPT` no arquivo `index.js`.

---

## ⚠️ Para produção (número real)

Para usar um número de WhatsApp real (não o de teste):
1. Crie uma conta **WhatsApp Business**
2. Solicite acesso à **Meta Business API** (pode levar alguns dias para aprovação)
3. Considere usar um BSP como **360dialog** ou **Zenvia** para facilitar

---

## 📞 Suporte

Em caso de dúvidas, revise os logs no Railway em **"Deployments → View Logs"**.
