import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default Tenant",
      slug: "default",
    },
  });

  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create platform admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@constela.com" },
    update: {},
    create: {
      email: "admin@constela.com",
      name: "Platform Admin",
      passwordHash:
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "Admin123!"
      role: UserRole.PLATFORM_ADMIN,
      tenantId: null, // Platform admin has no tenant
    },
  });

  console.log(`✅ Created admin: ${admin.email}`);

  // Create sample practitioner
  const practitioner = await prisma.user.upsert({
    where: { email: "constelador@exemplo.com" },
    update: {},
    create: {
      email: "constelador@exemplo.com",
      name: "Maria Consteladora",
      passwordHash:
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "Admin123!"
      role: UserRole.PRACTITIONER,
      tenantId: tenant.id,
    },
  });

  // Create practitioner profile
  await prisma.practitionerProfile.upsert({
    where: { userId: practitioner.id },
    update: {},
    create: {
      userId: practitioner.id,
      bio: "Consteladora familiar com 10 anos de experiência. Apaixonada por ajudar pessoas a encontrarem paz e clareza em suas relações.",
      sessionPrice: 20000, // R$ 200,00
      sessionDuration: 90, // 90 minutes
    },
  });

  // Create availability rules (Mon-Fri, 9am-6pm)
  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday
  for (const day of daysOfWeek) {
    await prisma.availabilityRule.upsert({
      where: {
        practitionerId_dayOfWeek: {
          practitionerId: practitioner.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        practitionerId: practitioner.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
        isActive: true,
      },
    });
  }

  console.log(`✅ Created practitioner: ${practitioner.email}`);

  // Create sample client
  const client = await prisma.user.upsert({
    where: { email: "cliente@exemplo.com" },
    update: {},
    create: {
      email: "cliente@exemplo.com",
      name: "João Silva",
      passwordHash:
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "Admin123!"
      role: UserRole.CLIENT,
      tenantId: tenant.id,
    },
  });

  // Create client profile
  await prisma.clientProfile.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      phone: "(11) 99999-9999",
    },
  });

  console.log(`✅ Created client: ${client.email}`);

  // Create sample consent term
  const consentTerm = await prisma.consentTerm.upsert({
    where: { id: "default-consent-v1" },
    update: {},
    create: {
      id: "default-consent-v1",
      version: "1.0",
      title: "Termo de Consentimento para Sessão de Constelação Familiar Online",
      content: `
# Termo de Consentimento para Sessão de Constelação Familiar Online

## 1. Objetivo da Sessão
A sessão de constelação familiar online tem como objetivo proporcionar um espaço seguro para exploração de dinâmicas familiares e relacionais, buscando compreensão e possíveis soluções para questões emocionais e interpessoais.

## 2. Natureza do Trabalho
A constelação familiar é uma abordagem terapêutica complementar que não substitui tratamento médico, psicológico ou psiquiátrico. O constelador não é um profissional de saúde mental e não realiza diagnósticos.

## 3. Sigilo e Privacidade
Todas as informações compartilhadas durante a sessão são tratadas com confidencialidade. O constelador se compromete a não divulgar informações pessoais sensíveis a terceiros.

## 4. Gravação
A sessão não será gravada em vídeo ou áudio. Apenas o estado final do campo de constelação (snapshot) poderá ser salvo, mediante seu consentimento específico.

## 5. Dados Pessoais (LGPD)
Seus dados pessoais serão tratados em conformidade com a Lei Geral de Proteção de Dados (LGPD). Você tem direito a:
- Acessar seus dados
- Corrigir dados incompletos
- Solicitar a exclusão de seus dados
- Solicitar exportação de seus dados

## 6. Riscos e Limitações
Embora a constelação familiar seja geralmente segura, você pode experimentar emoções intensas durante ou após a sessão. Caso sinta necessidade, é recomendável buscar acompanhamento profissional adequado.

## 7. Consentimento
Ao aceitar este termo, você confirma que:
- Leu e compreendeu todas as informações acima
- Participa voluntariamente da sessão
- Entende que a sessão não substitui tratamento profissional
- Autoriza o armazenamento dos dados conforme descrito

## 8. Dúvidas
Para mais informações ou dúvidas sobre o tratamento de seus dados, entre em contato com nosso suporte.
      `,
      isActive: true,
    },
  });

  console.log(`✅ Created consent term: ${consentTerm.title}`);

  console.log("🎉 Seed completed successfully!");
  console.log("\n📧 Test accounts:");
  console.log("   Admin: admin@constela.com / Admin123!");
  console.log("   Practitioner: constelador@exemplo.com / Admin123!");
  console.log("   Client: cliente@exemplo.com / Admin123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
