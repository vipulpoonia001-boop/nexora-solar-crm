/**
 * Generate systematic short project IDs in format: PRJ-YYMMDD-XXXX
 * Example: PRJ-260425-0001
 */

export const generateProjectId = (existingProjects = []) => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  
  // Find all projects created today and compute the highest sequence number
  const todayProjects = existingProjects.filter(p => {
    if (!p.id || typeof p.id !== 'string') return false;
    return p.id.startsWith(`PRJ-${datePrefix}-`);
  });

  const maxSeq = todayProjects.reduce((max, project) => {
    const parts = project.id.split('-');
    const seq = parseInt(parts[2], 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(4, '0');

  return `PRJ-${datePrefix}-${seqPadded}`;
};

/**
 * Generate short reference IDs for other entities
 * Format: LEAD-YYMMDD-XXXX, PAY-YYMMDD-XXXX, etc.
 */
export const generateEntityId = (prefix = 'ENT', existingEntities = []) => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  
  const todayEntities = existingEntities.filter(e => {
    if (!e.id || typeof e.id !== 'string') return false;
    return e.id.startsWith(`${prefix}-${datePrefix}-`);
  });

  const maxSeq = todayEntities.reduce((max, entity) => {
    const parts = entity.id.split('-');
    const seq = parseInt(parts[2], 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(4, '0');

  return `${prefix}-${datePrefix}-${seqPadded}`;
};
