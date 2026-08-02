import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { parseCFDI } from '@/lib/cfdi/parser';

const POLL_MS = 60_000;

type OwnerDb = ReturnType<typeof makeOwnerDb>;

function makeOwnerDb() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL_OWNER'],
    max: 3,
    idleTimeoutMillis: 30_000,
  });
  return drizzle(pool, { schema });
}

function makeImapConfig() {
  return {
    host:   process.env['EMAIL_HOST'] ?? 'mail.dataserv.com.mx',
    port:   Number(process.env['EMAIL_PORT'] ?? 993),
    secure: true,
    auth: {
      user: process.env['EMAIL_USER'] ?? 'dataserv',
      pass: process.env['EMAIL_PASS'] ?? '',
    },
    logger: false as const,
    tls: { rejectUnauthorized: false },
  };
}

async function processAttachment(
  ownerDb: OwnerDb,
  opts: {
    messageUid: string;
    fromAddress: string;
    subject: string;
    receivedAt: Date;
    xmlFilename: string;
    xmlContent: string;
  },
): Promise<string> {
  const { messageUid, fromAddress, subject, receivedAt, xmlFilename, xmlContent } = opts;

  // Idempotencia: si ya procesamos este uid+archivo, saltar
  const existing = await ownerDb
    .select({ id: schema.emailCfdiLog.id, status: schema.emailCfdiLog.status })
    .from(schema.emailCfdiLog)
    .where(eq(schema.emailCfdiLog.messageUid, messageUid))
    .limit(1);

  if (existing.length > 0) return existing[0]!.status;

  const [log] = await ownerDb
    .insert(schema.emailCfdiLog)
    .values({ messageUid, fromAddress, subject, receivedAt, xmlFilename, status: 'pending' })
    .onConflictDoNothing()
    .returning({ id: schema.emailCfdiLog.id });

  if (!log) return 'duplicate';

  // Parsear CFDI
  let parsed: ReturnType<typeof parseCFDI>;
  try {
    parsed = parseCFDI(xmlContent);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await ownerDb.update(schema.emailCfdiLog)
      .set({ status: 'error', errorMessage: msg })
      .where(eq(schema.emailCfdiLog.id, log.id));
    return 'error';
  }

  // Buscar organización por RFC receptor del CFDI
  const orgs = await ownerDb
    .select({ id: schema.organizaciones.id })
    .from(schema.organizaciones)
    .where(eq(schema.organizaciones.rfc, parsed.rfcReceptor))
    .limit(1);

  if (orgs.length === 0) {
    await ownerDb.update(schema.emailCfdiLog)
      .set({
        status: 'no_org',
        cfdiUuid: parsed.uuid,
        errorMessage: `RFC receptor ${parsed.rfcReceptor} no pertenece a ninguna organización`,
      })
      .where(eq(schema.emailCfdiLog.id, log.id));
    return 'no_org';
  }

  const orgId = orgs[0]!.id;

  // Obtener un usuario de la org para usar como createdBy
  const users = await ownerDb
    .select({ id: schema.usuarios.id })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.organizacionId, orgId))
    .limit(1);

  const createdBy = users[0]?.id ?? orgId;

  try {
    await ownerDb.transaction(async (tx) => {
      // Dar de alta proveedor si no existe
      if (parsed.rfcEmisor) {
        const provExiste = await tx
          .select({ id: schema.proveedores.id })
          .from(schema.proveedores)
          .where(
            and(
              eq(schema.proveedores.organizacionId, orgId),
              eq(schema.proveedores.rfc, parsed.rfcEmisor),
            ),
          )
          .limit(1);

        if (provExiste.length === 0) {
          await tx.insert(schema.proveedores).values({
            organizacionId: orgId,
            nombre: parsed.nombreEmisor,
            rfc: parsed.rfcEmisor,
            createdBy,
          });
        }
      }

      // Insertar factura
      const [factura] = await tx
        .insert(schema.facturas)
        .values({
          organizacionId: orgId,
          uuidFiscal: parsed.uuid,
          serie: parsed.serie ?? undefined,
          folio: parsed.folio ?? undefined,
          fechaEmision: new Date(parsed.fecha),
          fechaTimbrado: new Date(parsed.fechaTimbrado),
          rfcEmisor: parsed.rfcEmisor,
          nombreEmisor: parsed.nombreEmisor,
          rfcReceptor: parsed.rfcReceptor,
          subtotal: parsed.subTotal,
          total: parsed.total,
          moneda: parsed.moneda,
          tipoCambio: parsed.tipoCambio,
          xmlCrudo: parsed.xmlCrudo,
          createdBy,
        })
        .onConflictDoNothing()
        .returning({ id: schema.facturas.id });

      if (!factura) return; // UUID duplicado, ya existe

      // Insertar conceptos
      for (let i = 0; i < parsed.conceptos.length; i++) {
        const c = parsed.conceptos[i]!;
        await tx.insert(schema.facturaConceptos).values({
          facturaId: factura.id,
          organizacionId: orgId,
          numeroLinea: i + 1,
          claveProdServ: c.claveProdServ ?? undefined,
          noIdentificacion: c.noIdentificacion ?? undefined,
          descripcion: c.descripcion,
          claveUnidad: c.claveUnidad ?? undefined,
          unidad: c.unidad ?? undefined,
          cantidad: c.cantidad,
          valorUnitario: c.valorUnitario,
          importe: c.importe,
          descuento: c.descuento,
          objetoImp: c.objetoImp ?? undefined,
          createdBy,
        });
      }
    });

    await ownerDb.update(schema.emailCfdiLog)
      .set({ status: 'processed', cfdiUuid: parsed.uuid, organizacionId: orgId })
      .where(eq(schema.emailCfdiLog.id, log.id));

    return 'processed';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isDup = msg.includes('facturas_uuid_fiscal_org') || msg.includes('23505');
    await ownerDb.update(schema.emailCfdiLog)
      .set({ status: isDup ? 'duplicate' : 'error', cfdiUuid: parsed.uuid, errorMessage: msg })
      .where(eq(schema.emailCfdiLog.id, log.id));
    return isDup ? 'duplicate' : 'error';
  }
}

async function pollInbox(ownerDb: OwnerDb): Promise<void> {
  const client = new ImapFlow(makeImapConfig());

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = await client.search({ seen: false }, { uid: true });
      if (!uids || (uids as number[]).length === 0) return;

      for await (const msg of client.fetch(uids as number[], { source: true, envelope: true }, { uid: true })) {
        if (!msg.source) continue;

        let parsed: Awaited<ReturnType<typeof simpleParser>>;
        try {
          parsed = await simpleParser(msg.source);
        } catch {
          continue;
        }

        const fromAddress = parsed.from?.text ?? 'desconocido';
        const subject     = parsed.subject ?? '';
        const receivedAt  = parsed.date ?? new Date();

        const xmlAttachments = (parsed.attachments ?? []).filter(
          (a) => a.filename?.toLowerCase().endsWith('.xml') && a.content?.length,
        );

        if (xmlAttachments.length === 0) {
          await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
          continue;
        }

        for (const attachment of xmlAttachments) {
          const messageUid = `${msg.uid}_${attachment.filename ?? 'cfdi.xml'}`;
          const xmlContent = attachment.content.toString('utf-8');

          const status = await processAttachment(ownerDb, {
            messageUid,
            fromAddress,
            subject,
            receivedAt,
            xmlFilename: attachment.filename ?? 'cfdi.xml',
            xmlContent,
          });

          console.log(`[EmailWatcher] uid=${msg.uid} file=${attachment.filename} → ${status}`);
        }

        await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error('[EmailWatcher] Error en poll:', err instanceof Error ? err.message : err);
  } finally {
    await client.logout().catch(() => {});
  }
}

export function startEmailWatcher(): void {
  if (!process.env['EMAIL_PASS']) {
    console.warn('[EmailWatcher] EMAIL_PASS no definido — watcher deshabilitado');
    return;
  }

  const ownerDb = makeOwnerDb();

  setTimeout(async () => {
    await pollInbox(ownerDb);
    setInterval(() => pollInbox(ownerDb), POLL_MS);
  }, 5_000);

  console.log(`[EmailWatcher] Iniciado — revisando ${process.env['EMAIL_USER']} cada ${POLL_MS / 1000}s`);
}
