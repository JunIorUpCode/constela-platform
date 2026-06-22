import nodemailer from "nodemailer";
import type { EmailJobData } from "../queues";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==============================================
// Email Templates
// ==============================================

const TEMPLATES: Record<string, { subject: string; html: string }> = {
  "session-reminder": {
    subject: "Lembrete: Sua sessão de constelação está agendada",
    html: `
      <h1>Olá, {{clientName}}!</h1>
      <p>Este é um lembrete de que sua sessão de constelação familiar está agendada para:</p>
      <p><strong>{{date}} às {{time}}</strong></p>
      <p>Clique no link abaixo para acessar a sala no horário marcado:</p>
      <p><a href="{{sessionLink}}">Acessar Sala</a></p>
      <p>Se tiver qualquer dúvida, entre em contato com {{practitionerName}}.</p>
      <p>Até lá!</p>
    `,
  },
  "payment-confirmed": {
    subject: "Pagamento confirmado - Sessão de constelação",
    html: `
      <h1>Pagamento Confirmado!</h1>
      <p>Olá, {{clientName}}!</p>
      <p>Seu pagamento foi confirmado e sua sessão está garantida.</p>
      <p><strong>Sessão:</strong> {{sessionTitle}}</p>
      <p><strong>Data:</strong> {{date}} às {{time}}</p>
      <p>Você receberá um link para acessar a sala 15 minutos antes do horário agendado.</p>
      <p>Até a sessão!</p>
    `,
  },
  "payment-pending": {
    subject: "Confirmação de agendamento - Aguardando pagamento",
    html: `
      <h1>Agendamento Confirmado!</h1>
      <p>Olá, {{clientName}}!</p>
      <p>Seu horário foi reservado. Para garantir sua sessão, efetue o pagamento:</p>
      <p><strong>Sessão:</strong> {{sessionTitle}}</p>
      <p><strong>Valor:</strong> R$ {{amount}}</p>
      <p><strong>Expira em:</strong> {{expiresAt}}</p>
      <p><a href="{{paymentLink}}">Efetuar Pagamento</a></p>
    `,
  },
  "session-canceled": {
    subject: "Sessão cancelada",
    html: `
      <h1>Sessão Cancelada</h1>
      <p>Olá, {{clientName}}!</p>
      <p>Sua sessão de constelação familiar foi cancelada.</p>
      <p><strong>Sessão:</strong> {{sessionTitle}}</p>
      <p><strong>Data:</strong> {{date}}</p>
      <p>{{#if refundInfo}}Informações sobre reembolso: {{refundInfo}}{{/if}}</p>
      <p>Caso tenha alguma dúvida, entre em contato.</p>
    `,
  },
  "welcome": {
    subject: "Bem-vindo à Constela Platform!",
    html: `
      <h1>Bem-vindo, {{name}}!</h1>
      <p>Sua conta foi criada com sucesso na Constela Platform.</p>
      <p>Você está pronto para explorar o mundo das constelações familiares online.</p>
      <p><a href="{{dashboardLink}}">Acessar minha conta</a></p>
    `,
  },
};

// ==============================================
// Email Service
// ==============================================

export async function sendEmail(data: EmailJobData): Promise<boolean> {
  const template = TEMPLATES[data.template];

  if (!template) {
    console.error(`Email template not found: ${data.template}`);
    return false;
  }

  // Replace variables in template
  let html = template.html;
  for (const [key, value] of Object.entries(data.variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@constela.com",
      to: data.to,
      subject: template.subject,
      html,
    });

    console.log(`Email sent to ${data.to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export { transporter };
