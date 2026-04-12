export function parseOrgProject(projectId: string): { orgSlug: string; projectSlug: string } {
  const [orgSlug, projectSlug, ...rest] = projectId.split('/');
  if (!orgSlug || !projectSlug || rest.length > 0) {
    throw new Error(`Invalid projectId '${projectId}'. Expected format: orgSlug/projectSlug`);
  }
  return { orgSlug, projectSlug };
}
