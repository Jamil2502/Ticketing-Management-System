export async function fetchJsonOrThrow<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    fallbackError: string,
) : Promise<T> {
    const response = await fetch(input, init);
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    let data: unknown = null;
    if (isJson) {
        try {
            data = await response.json();
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        const errorData = data as { error?: string; message?: string } | null;
        throw new Error(errorData?.error || errorData?.message || fallbackError);
    }

    if (!isJson) {
        throw new Error(fallbackError);
    }

    return data as T;
}
