// Neon REST API client helper
const NEON_API_URL = process.env.NEON_API_URL;

export async function neonQuery(query, paramsIfString = []) {
  if (!NEON_API_URL) {
    throw new Error('NEON_API_URL is not configured');
  }

  const { sql, params } = typeof query === 'string'
    ? { sql: query, params: paramsIfString }
    : { sql: query?.sql, params: query?.params || [] };

  if (!sql) {
    throw new Error('neonQuery requires an SQL statement');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEON_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.NEON_API_KEY}`;
  }

  const res = await fetch(NEON_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Neon query failed:', errorText);
    throw new Error(`Neon query failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Neon Data API responses return rows under .rows for SELECT queries
  if (Array.isArray(data?.rows)) {
    return data.rows;
  }
  return data;
}
