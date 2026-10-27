/** Rendering gate only. Production integrity/authority checks belong to the flagship adapter. */
export function validateWorkConflict(value, fixture) {
  if (value?.schema !== 'align-work-conflict-projection' || value.version !== 1 || value.synthetic !== true) throw new Error('SYNTHETIC_CONFLICT_PROJECTION_REQUIRED');
  if (value.align_export_sha256 !== fixture.provenance.export_sha256 || value.source?.commit !== fixture.provenance.align_commit) throw new Error('CONFLICT_SOURCE_MISMATCH');
  if (!value.authority || Object.values(value.authority).some(flag => flag !== false) || value.provider?.live_call_made !== false) throw new Error('CONFLICT_AUTHORITY_REFUSED');
  if (!Array.isArray(value.rows) || value.rows.length !== 4 || new Set(value.rows.map(row=>row.session_id)).size !== 4) throw new Error('CONFLICT_ROWS_REQUIRED');
  const statuses = ['SUPERSEDED_CONTRACT','UNCONFIRMED_MAPPING','REFUSED_MAPPING','NO_GOAL'];
  for (const row of value.rows) {
    if (!statuses.includes(row.status) || row.desktop_goal_match !== false || row.automatic_veto !== false || row.allocation?.allocated_bps !== 0 || row.allocation?.unallocated_bps !== 10000 || row.allocation?.cost !== null) throw new Error('CONFLICT_BOUNDARY_REFUSED');
  }
  if (value.coverage?.allocated_bps !== 0 || value.coverage?.unallocated_bps !== 10000 || value.coverage?.total_bps !== 10000 || value.coverage?.cost !== null) throw new Error('UNPRICED_ALLOCATION_REQUIRED');
  return value;
}
