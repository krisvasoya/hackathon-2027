import { prisma } from '../database/client';
import { AuditLogEntry } from '../interfaces';
import { logger } from '../config/logger';

// ─── Audit Log Utility ────────────────────────────────────────────────────────
// Fire-and-forget audit logging. Errors are logged but never thrown to callers.

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata as object | undefined,
      },
    });
  } catch (error) {
    // Audit log failure must NEVER disrupt primary operations
    logger.error('Failed to write audit log', { error, entry });
  }
}
