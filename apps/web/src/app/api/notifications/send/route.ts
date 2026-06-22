import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@constela/db";
import { addEmailJob } from "@constela/worker/queues";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "session-reminder": {
        const { userId, sessionId } = data;

        const [user, sessionData, practitioner] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.session.findUnique({
            where: { id: sessionId },
            include: { practitioner: { include: { user: true } } },
          }),
        ]);

        if (!user || !sessionData || !practitioner) {
          return NextResponse.json({ error: "Data not found" }, { status: 404 });
        }

        const date = new Date(sessionData.startsAt).toLocaleDateString("pt-BR");
        const time = new Date(sessionData.startsAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await addEmailJob({
          to: user.email,
          subject: "Lembrete de sessão",
          template: "session-reminder",
          variables: {
            clientName: user.name,
            date,
            time,
            sessionLink: `${process.env.NEXT_PUBLIC_APP_URL}/session/${sessionId}/room`,
            practitionerName: practitioner.user.name,
          },
        });

        return NextResponse.json({ success: true, message: "Reminder scheduled" });
      }

      case "payment-confirmed": {
        const { userId, sessionId } = data;

        const [user, sessionData, practitioner] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.session.findUnique({
            where: { id: sessionId },
            include: { practitioner: { include: { user: true } } },
          }),
        ]);

        if (!user || !sessionData) {
          return NextResponse.json({ error: "Data not found" }, { status: 404 });
        }

        const date = new Date(sessionData.startsAt).toLocaleDateString("pt-BR");
        const time = new Date(sessionData.startsAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await addEmailJob({
          to: user.email,
          subject: "Pagamento confirmado",
          template: "payment-confirmed",
          variables: {
            clientName: user.name,
            sessionTitle: sessionData.title,
            date,
            time,
          },
        });

        return NextResponse.json({ success: true, message: "Confirmation email sent" });
      }

      case "session-canceled": {
        const { userId, sessionId } = data;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const sessionData = await prisma.session.findUnique({ where: { id: sessionId } });

        if (!user || !sessionData) {
          return NextResponse.json({ error: "Data not found" }, { status: 404 });
        }

        const date = new Date(sessionData.startsAt).toLocaleDateString("pt-BR");

        await addEmailJob({
          to: user.email,
          subject: "Sessão cancelada",
          template: "session-canceled",
          variables: {
            clientName: user.name,
            sessionTitle: sessionData.title,
            date,
          },
        });

        return NextResponse.json({ success: true, message: "Cancellation email sent" });
      }

      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
