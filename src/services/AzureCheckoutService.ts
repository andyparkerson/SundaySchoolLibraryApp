/**
 * AzureCheckoutService — REST client for the Azure Functions checkouts API.
 *
 * Endpoint contract (see api/src/functions/checkouts.ts):
 *   GET /api/checkouts                   — list checkouts (role-filtered server-side)
 *   POST /api/checkouts                  — create a checkout
 *   PUT  /api/checkouts/{id}/return      — return a book
 */
import {AZURE_API_BASE_URL} from '../config/azureApi';
import {getToken} from './AzureAuthService';
import {Checkout} from '../models/CheckoutRecord';

/** A checkout as returned by the API, augmented with the server-assigned id. */
export type CheckoutWithId = Checkout & {id: string};

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & {error?: string};
  if (!response.ok) {
    throw new Error(
      (data as {error?: string}).error ?? `Request failed (${response.status})`,
    );
  }
  return data;
}

/** Shape returned by the API for a checkout record (dates as ISO strings). */
interface ApiCheckout {
  id: string;
  bookId: string;
  userId: string;
  quantity: number;
  dateOut: string;
  dateIn?: string;
  notes?: string;
}

function apiToCheckout(r: ApiCheckout): CheckoutWithId {
  return {
    id: r.id,
    bookId: r.bookId,
    userId: r.userId,
    quantity: r.quantity,
    dateOut: new Date(r.dateOut),
    dateIn: r.dateIn ? new Date(r.dateIn) : undefined,
    notes: r.notes,
  };
}

/**
 * Fetch checkouts from the API.
 * Librarians receive all records; other roles receive only their own.
 */
export async function getAllCheckouts(): Promise<CheckoutWithId[]> {
  const response = await fetch(`${AZURE_API_BASE_URL}/checkouts`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<ApiCheckout[]>(response);
  return data.map(apiToCheckout);
}

/**
 * Check out a book. Returns the server-assigned checkout ID.
 *
 * @param bookId    ISBN of the book to check out.
 * @param quantity  Number of copies (default: 1).
 * @param notes     Optional notes.
 */
export async function checkOutBook(
  bookId: string,
  quantity = 1,
  notes?: string,
): Promise<string> {
  const response = await fetch(`${AZURE_API_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({bookId, quantity, notes}),
  });
  const data = await handleResponse<{id: string}>(response);
  return data.id;
}

/**
 * Mark a checkout as returned.
 *
 * @param checkoutId  The ID returned by `checkOutBook`.
 */
export async function returnBook(checkoutId: string): Promise<void> {
  const response = await fetch(
    `${AZURE_API_BASE_URL}/checkouts/${encodeURIComponent(checkoutId)}/return`,
    {
      method: 'PUT',
      headers: authHeaders(),
    },
  );
  await handleResponse<{message: string}>(response);
}

/**
 * Poll the checkouts API and notify the caller whenever the data changes.
 *
 * @param onUpdate   Called with the latest checkout list on every change.
 * @param onError    Optional error handler.
 * @param intervalMs Polling interval in milliseconds (default: 15 000).
 * @returns A stop function — call it to cancel polling.
 */
export function subscribeToCheckouts(
  onUpdate: (checkouts: CheckoutWithId[]) => void,
  onError?: (err: Error) => void,
  intervalMs = 15_000,
): () => void {
  let lastJson = '';
  let timer: ReturnType<typeof setInterval> | null = null;

  async function poll() {
    try {
      const checkouts = await getAllCheckouts();
      const json = JSON.stringify(checkouts);
      if (json !== lastJson) {
        lastJson = json;
        onUpdate(checkouts);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  void poll();
  timer = setInterval(() => void poll(), intervalMs);

  return () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}
