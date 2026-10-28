import { z } from 'zod';

const payloadSchema = z.object({
  properties: z.object({
    parameter: z.record(z.record(z.number()))
  }).passthrough()
}).passthrough();
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** NASA POWER long-term monthly climatology is a reference for worldbuilding, not a measurement of the generated planet. */
export async function fetchEarthClimate(point: { latitude: number; longitude: number }) {
  const url = new URL('https://power.larc.nasa.gov/api/temporal/climatology/point');
  url.search = new URLSearchParams({ parameters: 'T2M,PRECTOTCORR', community: 'AG', longitude: String(point.longitude), latitude: String(point.latitude), format: 'JSON' }).toString();
  let response: Response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'error', headers: { accept: 'application/json' } }); }
  catch (error) { throw Object.assign(new Error(error instanceof Error && error.name === 'TimeoutError' ? 'NASA POWER request timed out.' : 'NASA POWER could not be reached.'), { statusCode: 503, code: 'NASA_POWER_UNAVAILABLE' }); }
  if (!response.ok) throw Object.assign(new Error(`NASA POWER returned HTTP ${response.status}.`), { statusCode: 502, code: 'NASA_POWER_PROVIDER_ERROR' });
  const raw = await response.text();
  if (raw.length > 1_000_000) throw Object.assign(new Error('NASA POWER response exceeded the 1 MB safety limit.'), { statusCode: 502, code: 'NASA_POWER_RESPONSE_TOO_LARGE' });
  let json: unknown;
  try { json = JSON.parse(raw) as unknown; } catch { throw Object.assign(new Error('NASA POWER returned invalid JSON.'), { statusCode: 502, code: 'NASA_POWER_INVALID_RESPONSE' }); }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) throw Object.assign(new Error('NASA POWER response did not match the expected climatology format.'), { statusCode: 502, code: 'NASA_POWER_INVALID_RESPONSE' });
  const parameters = parsed.data.properties.parameter;
  const temperature = parameters.T2M;
  const precipitation = parameters.PRECTOTCORR;
  if (!temperature || !precipitation) throw Object.assign(new Error('NASA POWER did not return the requested climate parameters.'), { statusCode: 502, code: 'NASA_POWER_MISSING_PARAMETERS' });
  return {
    coordinates: point,
    months: months.map((month) => {
      const temp = temperature[month];
      const rain = precipitation[month];
      return { month, temperatureC: temp === undefined || temp <= -900 ? null : temp, precipitationMmPerDay: rain === undefined || rain <= -900 ? null : rain };
    }),
    source: { name: 'NASA POWER', url: url.toString(), docs: 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/', resolution: 'Gridded climate data; a coordinate is associated with the product grid cell.' },
    fetchedAt: new Date().toISOString(),
    note: 'Observed Earth climatology for this reference location. It is not used to calculate the fictional world cells.'
  };
}
