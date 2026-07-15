const MODEL_ID_ALIASES: ReadonlyMap<string, string> = new Map([
  ['openai:gpt-5.6-sol', 'gpt-5.6'],
  // Defense-in-depth aliases for OpenMAIC Grok slugs that xAI's API 400s on
  // (model_not_found). Allow stale browser-localStorage entries or older
  // DEFAULT_MODEL env-var values from before the cleanup to silently
  // re-route to the canonical `grok-4.20` slug without a UI migration.
  ['grok:grok-4.20-reasoning', 'grok-4.20'],
  ['grok:grok-4.20-multi-agent', 'grok-4.20'],
]);

/** Resolve aliases used for local catalog, settings, capability, and usage lookups. */
export function getCanonicalModelId(providerId: string, modelId: string): string {
  return MODEL_ID_ALIASES.get(`${providerId}:${modelId}`) ?? modelId;
}

export function modelIdsMatch(providerId: string, left: string, right: string): boolean {
  return getCanonicalModelId(providerId, left) === getCanonicalModelId(providerId, right);
}

/** Find a model using canonical IDs without changing the model ID sent on the wire. */
export function findModelById<T extends { id: string }>(
  providerId: string,
  models: readonly T[] | undefined,
  modelId: string,
): T | undefined {
  const canonicalModelId = getCanonicalModelId(providerId, modelId);
  return (
    models?.find((model) => model.id === canonicalModelId) ??
    models?.find((model) => modelIdsMatch(providerId, model.id, modelId))
  );
}
