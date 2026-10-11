import AuditLog from '../models/AuditLog.js'

export async function logActivity({ organizationId, user, action, entity, entityId, metadata = {} }) {
  try {
    // Sanitize metadata to ensure no secrets/passwords are ever logged
    const sanitizedMetadata = { ...metadata }
    delete sanitizedMetadata.password
    delete sanitizedMetadata.accessToken
    delete sanitizedMetadata.encryptedAccessToken
    delete sanitizedMetadata.secret
    delete sanitizedMetadata.token

    await AuditLog.create({
      organizationId,
      actor: user
        ? {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        : { name: 'System', email: 'system@scalevo.internal', role: 'system' },
      action,
      entity: entity || '',
      entityId: entityId ? entityId.toString() : '',
      metadata: sanitizedMetadata,
      timestamp: new Date(),
    })
  } catch (err) {
    console.error(`[AuditLog] Failed to record audit log: ${err.message}`)
  }
}
