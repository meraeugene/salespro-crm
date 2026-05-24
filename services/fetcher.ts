export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  }
  return response.json();
}

export async function mutateJson<T>(url: string, method: "POST" | "PATCH" | "DELETE", data?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  }
  return response.json();
}
