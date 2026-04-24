const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

// OpenRouter usa o mesmo formato da OpenAI, só muda a URL base
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/gustavosella/whatsapp-agente',
    'X-Title': 'WhatsApp Agente',
  },
});

// Modelo do OpenRouter (você pode trocar por outros)
// Ex: 'anthropic/claude-sonnet-4.5', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp'
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5';

// ============================================================
// PERSONALIZE AQUI: informações do seu escritório/consultório
// ============================================================
const SYSTEM_PROMPT = `Você é um assistente virtual de atendimento do escritório/consultório.

SOBRE NÓS:
- Nome: ${process.env.BUSINESS_NAME || 'Nosso Escritório'}
- Área: ${process.env.BUSINESS_AREA || 'Advocacia / Consultoria'}
- Horário de atendimento: ${process.env.BUSINESS_HOURS || 'Segunda a sexta, das 9h às 18h'}
- Telefone/contato humano: ${process.env.CONTACT_PHONE || 'Não informado'}

SUAS FUNÇÕES:
1. Recepcionar clientes e entender a necessidade deles
2. Responder dúvidas gerais sobre os serviços oferecidos
3. Coletar: nome completo, telefone e breve descrição do caso/necessidade
4. Informar sobre agendamentos (não confirmar — apenas coletar dados e avisar que entraremos em contato)
5. Qualificar leads: identificar se é urgente ou não

REGRAS IMPORTANTES:
- Seja cordial, profissional e empático
- NUNCA dê orientações jurídicas ou técnicas específicas — apenas acolha e colete informações
- Se o assunto for urgente (emergência, prazo judicial, etc.), destaque isso e peça contato imediato
- Sempre em português brasileiro
- Mensagens curtas e objetivas (máximo 3 parágrafos)
- Se não souber responder algo, diga que vai verificar com a equipe

FLUXO IDEAL:
1. Cumprimentar e perguntar o nome
2. Entender a necessidade
3. Coletar dados de contato
4. Informar que a equipe entrará em contato em breve`;

// Memória de sessões por número de telefone
const sessions = new Map();

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, []);
  }
  return sessions.get(phone);
}

function addToSession(phone, role, content) {
  const history = getSession(phone);
  history.push({ role, content });
  if (history.length > 30) history.shift();
}

async function getAgentReply(phone, userMessage) {
  addToSession(phone, 'user', userMessage);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...getSession(phone),
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    messages,
  });

  const reply = response.choices[0].message.content;
  addToSession(phone, 'assistant', reply);
  return reply;
}

async function sendWhatsAppMessage(to, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    console.error('Erro ao enviar mensagem:', err);
  }
}

// ============================================================
// WEBHOOK — recebe mensagens do WhatsApp
// ============================================================
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    const message =
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return res.sendStatus(200);
    }

    const phone = message.from;
    const text = message.text.body;

    console.log(`[${new Date().toISOString()}] Mensagem de ${phone}: ${text}`);

    const reply = await getAgentReply(phone, text);

    console.log(`[${new Date().toISOString()}] Resposta para ${phone}: ${reply}`);

    await sendWhatsAppMessage(phone, reply);

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(500);
  }
});

// Verificação do webhook exigida pela Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    agent: process.env.BUSINESS_NAME || 'Agente WhatsApp',
    model: MODEL,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} usando modelo ${MODEL}`);
});
