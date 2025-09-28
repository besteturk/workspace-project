const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: RequestInit["body"] | Record<string, unknown> | null;
  auth?: boolean;
  parseJson?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<TResponse = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { auth = true, parseJson = true, headers, body, method, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const finalHeaders: Record<string, string> = {
    ...(((headers as Record<string, string>) ?? {})),
  };

  let requestBody: RequestInit["body"] | null = (body as RequestInit["body"]) ?? null;

  const isPlainObject =
    body !== null &&
    typeof body === "object" &&
    Object.getPrototypeOf(body) === Object.prototype;

  if (isPlainObject) {
    requestBody = JSON.stringify(body as Record<string, unknown>);
    finalHeaders["Content-Type"] = "application/json";
  }

  const init: RequestInit = {
    method: method ?? (requestBody ? "POST" : "GET"),
    body: requestBody,
    headers: finalHeaders,
    ...rest,
  };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, init);
  const raw = await response.text();
  const data = parseJson && raw ? safeParseJson(raw) : raw;

  if (!response.ok) {
    throw new ApiError(
      (data as { error?: string })?.error ?? response.statusText,
      response.status,
      data
    );
  }

  return (data as TResponse) ?? (undefined as TResponse);
}

function safeParseJson(payload: string) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.warn("Failed to parse JSON response", error);
    return null;
  }
}
