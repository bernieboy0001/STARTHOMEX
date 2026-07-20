type ResultWithError = { error?: unknown };

function errorText(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message).toLowerCase();
  }
  return String(error).toLowerCase();
}

export function isTransientFailure(error: unknown) {
  const text = errorText(error);
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;

  return (
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    /network|fetch failed|timeout|timed out|connection|temporar|gateway|rate limit|econnreset|socket/.test(text)
  );
}

/** Retry only short-lived infrastructure failures. Validation and access errors return immediately. */
export async function retrySupabase<T>(operation: () => PromiseLike<T>, attempts = 3): Promise<T> {
  let lastResult: T | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await operation();
      lastResult = result;
      const operationError = (result as ResultWithError).error;
      if (!operationError || !isTransientFailure(operationError) || attempt === attempts - 1) return result;
      lastError = operationError;
    } catch (error) {
      if (!isTransientFailure(error) || attempt === attempts - 1) throw error;
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }

  if (lastResult) return lastResult;
  throw lastError;
}
