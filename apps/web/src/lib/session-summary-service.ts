import { prisma } from "@constela/db";
import {
  createAIProvider,
  SYSTEM_PROMPTS,
  checkPromptSafety,
  filterSensitiveData,
} from "../lib/ai-provider";

// ==============================================
// Session Summary Service
// ==============================================

interface SummaryParams {
  sessionId: string;
  practitionerId: string;
}

interface SummaryResult {
  success: boolean;
  summary?: {
    generalInfo: string;
    fieldStructure: string;
    mainMovements: string;
    insights: string;
    nextSteps: string;
  };
  error?: string;
}

export async function generateSessionSummary(
  params: SummaryParams
): Promise<SummaryResult> {
  try {
    // Verify session belongs to practitioner
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: {
        practitioner: true,
        sceneEvents: {
          orderBy: { createdAt: "asc" },
        },
        notes: true,
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.practitioner.userId !== params.practitionerId) {
      return { success: false, error: "Unauthorized" };
    }

    // Prepare context from session data
    const events = session.sceneEvents.map((e) => ({
      type: e.eventType,
      time: e.createdAt,
      payload: e.payload,
    }));

    // Check prompt safety
    const contextString = JSON.stringify(events);
    const safetyCheck = checkPromptSafety(contextString);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: "Não é possível gerar resumo para esta sessão devido a restrições de segurança.",
      };
    }

    // Generate summary using AI
    const ai = createAIProvider();

    const result = await ai.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.summary },
        {
          role: "user",
          content: `Gere um resumo administrativo para esta sessão:

Título: ${session.title}
Data: ${session.startsAt}
Tipo: ${session.type}
Status: ${session.status}

Eventos registrados:
${events.map((e) => `- ${e.type} às ${e.time}`).join("\n")}

Notas do constelador:
${session.notes?.map((n) => n.content).join("\n") || "Nenhuma"}

Formato: Liste as 5 seções (Informações Gerais, Estrutura do Campo, Movimentações Principais, Insights Observados, Próximos Passos Administrativos) de forma clara e objetiva.`,
        },
      ],
      maxTokens: 1500,
      temperature: 0.5,
    });

    // Parse the response into structured sections
    const summary = parseSummaryResponse(result.message.content);

    // Save summary to session
    await prisma.session.update({
      where: { id: params.sessionId },
      data: {
        notes: summary ? `【RESUMO IA】\n${JSON.stringify(summary, null, 2)}` : null,
      },
    });

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error("Generate summary error:", error);
    return {
      success: false,
      error: "Falha ao gerar resumo. Tente novamente.",
    };
  }
}

function parseSummaryResponse(text: string): SummaryResult["summary"] {
  // Simple parsing - in production, use structured output
  const lines = text.split("\n").filter((l) => l.trim());

  return {
    generalInfo: lines.slice(0, 3).join(" ") || "Não disponível",
    fieldStructure: lines.slice(3, 6).join(" ") || "Não disponível",
    mainMovements: lines.slice(6, 9).join(" ") || "Não disponível",
    insights: lines.slice(9, 12).join(" ") || "Não disponível",
    nextSteps: lines.slice(12, 15).join(" ") || "Não disponível",
  };
}

// ==============================================
// Post-Session Message Service
// ==============================================

interface PostSessionMessageParams {
  sessionId: string;
  clientName: string;
}

interface PostSessionMessageResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function generatePostSessionMessage(
  params: PostSessionMessageParams
): Promise<PostSessionMessageResult> {
  try {
    const ai = createAIProvider();

    const result = await ai.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.postSession },
        {
          role: "user",
          content: `Gere uma mensagem pós-sessão para o cliente ${params.clientName}.

A mensagem deve:
- Ser breve (máximo 100 palavras)
- Ser acolhedora
- Agradecer a participação
- Não mencionar detalhes da sessão
- Convidar para próxima sessão se aplicável`,
        },
      ],
      maxTokens: 300,
      temperature: 0.7,
    });

    return {
      success: true,
      message: result.message.content,
    };
  } catch (error) {
    console.error("Generate post-session message error:", error);
    return {
      success: false,
      error: "Falha ao gerar mensagem.",
    };
  }
}

// ==============================================
// Preparation Checklist Service
// ==============================================

interface ChecklistResult {
  success: boolean;
  checklist?: string[];
  error?: string;
}

export async function generatePreparationChecklist(): Promise<ChecklistResult> {
  try {
    const ai = createAIProvider();

    const result = await ai.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.checklist },
        {
          role: "user",
          content:
            "Gere uma lista de preparação para uma sessão de constelação familiar online. Inclua 8-10 itens práticos e técnicos.",
        },
      ],
      maxTokens: 500,
      temperature: 0.6,
    });

    const checklist = result.message.content
      .split("\n")
      .filter((l) => l.trim() && /^\d/.test(l.trim()));

    return {
      success: true,
      checklist,
    };
  } catch (error) {
    console.error("Generate checklist error:", error);
    return {
      success: false,
      error: "Falha ao gerar checklist.",
    };
  }
}

// ==============================================
// Support Service
// ==============================================

interface SupportResult {
  success: boolean;
  response?: string;
  error?: string;
}

export async function getSupportResponse(
  question: string
): Promise<SupportResult> {
  try {
    // Check prompt safety
    const safetyCheck = checkPromptSafety(question);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: "Não consigo responder a perguntas sobre terapia ou saúde mental.",
      };
    }

    // Filter sensitive data
    const filteredQuestion = filterSensitiveData(question);

    const ai = createAIProvider();

    const result = await ai.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.support },
        {
          role: "user",
          content: filteredQuestion,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    return {
      success: true,
      response: result.message.content,
    };
  } catch (error) {
    console.error("Support response error:", error);
    return {
      success: false,
      error: "Falha ao obter resposta.",
    };
  }
}
