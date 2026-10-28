import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dice5, Download, FolderOpen, Sparkles, Thermometer } from 'lucide-react';

import type { GeneratedWorld } from '@neuralcartographer/shared';
import { ErrorNote, Panel, SectionHeading, Spinner } from '../components/ui';
import { useToast } from '../components/Toast';
import { apiGet, apiPost } from '../lib/api';
import { downloadJson } from '../lib/format';

type Project = { id: string; name: string; seed: string };
type GenerationResponse = { world: GeneratedWorld; saved: boolean };
type EarthClimate = { coordinates: { latitude: number; longitude: number }; months: Array<{ month: string; temperatureC: number | null; precipitationMmPerDay: number | null }>; source: { name: string; url: string; docs: string; resolution: string }; fetchedAt: string; note: string };

const BIOME_COLORS: Record<string, string> = {
  ocean: '#123b69', polar_ice: '#d9eff4', tundra: '#8ebbc0', desert: '#cf9659',
  grassland: '#a2ae59', temperate_forest: '#397b5f', rainforest: '#185743', alpine: '#8a969d'
};

export function GeneratorPage() {
  const [seed, setSeed] = useState('emerald-drift');
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(16);
  const [selectedCellId, setSelectedCellId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [world, setWorld] = useState<GeneratedWorld | null>(null);
  const [referencePoint, setReferencePoint] = useState({ latitude: '37.77', longitude: '-122.42' });
  const { addToast } = useToast();
  const projects = useQuery({ queryKey: ['workspaces'], queryFn: () => apiGet<{ projects: Project[] }>('/workspaces') });
  const selected = projects.data?.projects.find((project) => project.id === projectId);
  const climate = useMutation({ mutationFn: () => apiGet<EarthClimate>(`/worlds/earth-climate?latitude=${encodeURIComponent(referencePoint.latitude)}&longitude=${encodeURIComponent(referencePoint.longitude)}`) });

  useEffect(() => { if (selected) setSeed(selected.seed); }, [selected?.id, selected?.seed]);

  const generate = useMutation({
    mutationFn: () => apiPost<GenerationResponse>('/worlds/generate', {
      seed, width, height, ...(projectId ? { projectId } : {})
    }),
    onSuccess: ({ world: generated, saved }) => {
      setWorld(generated);
      setSelectedCellId(generated.cells[Math.floor(generated.cells.length / 2)]?.id ?? '');
      addToast({ type: 'success', title: saved ? 'World generated and saved' : 'World generated', message: generated.name });
      if (saved) void projects.refetch();
    },
    onError: (error: Error) => addToast({ type: 'error', title: 'Generation failed', message: error.message })
  });

  const biomeRows = useMemo(() => world ? Object.entries(world.biomeCounts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]) : [], [world]);
  const selectedCell = world?.cells.find((cell) => cell.id === selectedCellId);

  return <div className="space-y-5">
    <div className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-[radial-gradient(ellipse_at_78%_35%,rgba(16,185,129,.22),transparent_35%),radial-gradient(ellipse_at_14%_100%,rgba(56,189,248,.12),transparent_36%),#07130f] p-6 md:p-8"><div className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border border-emerald-200/10 shadow-[0_0_100px_30px_rgba(16,185,129,.08)]"/><p className="text-[11px] font-semibold uppercase tracking-[.22em] text-emerald-200">Procedural cartography · world DNA</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight md:text-5xl">A world, from one signal.</h1><p className="mt-3 max-w-2xl text-sm text-emerald-50/65">Turn a seed into a navigable biome atlas. Inspect any cell to reveal its coordinates and fictional environmental profile.</p></div><Link className="btn border-emerald-200/20 bg-emerald-100/5" to="/workspaces">World projects <FolderOpen className="h-3.5 w-3.5" /></Link></div></div>
    <Panel title="Set the world DNA" description="Same seed and resolution produce the same fictional atlas.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_1fr_auto] md:items-end">
        <label className="label">Seed<input className="input mt-1 font-mono" maxLength={120} value={seed} onChange={(event) => setSeed(event.target.value)} /></label>
        <label className="label">Longitude cells<input className="input mt-1 w-24" type="number" min={12} max={48} value={width} onChange={(event) => setWidth(Math.max(12, Math.min(48, Number(event.target.value))))} /></label>
        <label className="label">Latitude cells<input className="input mt-1 w-24" type="number" min={8} max={24} value={height} onChange={(event) => setHeight(Math.max(8, Math.min(24, Number(event.target.value))))} /></label>
        <label className="label">Save under project<select className="select mt-1" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Preview only</option>{projects.data?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <div className="flex gap-2"><button type="button" className="btn" title="Create a new world seed" onClick={() => setSeed(`world-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`)}><Dice5 className="h-4 w-4" /></button><button type="button" className="btn btn-primary" disabled={!seed.trim() || generate.isPending} onClick={() => generate.mutate()}><Sparkles className="h-4 w-4" />{generate.isPending ? 'Generating…' : projectId ? 'Generate & save' : 'Generate'}</button></div>
      </div>
      {projects.isPending ? <div className="mt-3"><Spinner label="Loading projects…" /></div> : null}
      {projects.isError ? <ErrorNote message={(projects.error as Error).message} onRetry={() => void projects.refetch()} /> : null}
    </Panel>

    <Panel title="Earth climate reference" description="Compare a real Earth location with your fictional world. NASA climatology stays separate from generated cell values." actions={<Thermometer className="h-4 w-4 text-emerald-200" />}>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); climate.mutate(); }}>
        <label className="label">Latitude<input className="input mt-1 w-32" type="number" min="-90" max="90" step="any" required value={referencePoint.latitude} onChange={(event) => setReferencePoint((point) => ({ ...point, latitude: event.target.value }))} /></label>
        <label className="label">Longitude<input className="input mt-1 w-32" type="number" min="-180" max="180" step="any" required value={referencePoint.longitude} onChange={(event) => setReferencePoint((point) => ({ ...point, longitude: event.target.value }))} /></label>
        <button className="btn btn-primary" disabled={climate.isPending}>{climate.isPending ? 'Loading NASA data…' : 'Load Earth reference'}</button>
      </form>
      {climate.isError ? <ErrorNote message={(climate.error as Error).message} onRetry={() => climate.mutate()} /> : null}
      {climate.data ? <><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{climate.data.months.map((month) => <div key={month.month} className="rounded-lg border border-line bg-surface-sunken/40 p-2"><p className="text-[10px] uppercase text-ink-faint">{month.month}</p><p className="mt-1 font-mono text-sm">{month.temperatureC === null ? '—' : `${month.temperatureC.toFixed(1)}°`}</p><p className="font-mono text-[10px] text-cyan-100">{month.precipitationMmPerDay === null ? '—' : `${month.precipitationMmPerDay.toFixed(1)} mm/d`}</p></div>)}</div><p className="mt-3 text-[10px] text-ink-faint">{climate.data.note} · Fetched {new Date(climate.data.fetchedAt).toLocaleString()} · <a className="underline" href={climate.data.source.docs} target="_blank" rel="noreferrer">NASA POWER source and methodology</a></p></> : null}
    </Panel>

    {generate.isError ? <ErrorNote message={(generate.error as Error).message} onRetry={() => generate.mutate()} /> : null}
    {world ? <>
      <Panel title={world.name} description={`Seed ${world.seed} · ${world.hash} · ${world.width} × ${world.height} fictional cells`} actions={<button type="button" className="btn text-xs" onClick={() => downloadJson(`${world.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`, world)}><Download className="h-3.5 w-3.5" />Export world JSON</button>}>
        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.5fr]">
          <div className="overflow-hidden rounded-xl border border-line bg-[#07131b] p-2 sm:p-3">
            <div aria-label={`Generated fictional world ${world.name}; select a cell to inspect its world DNA`} className="grid aspect-[2/1] gap-[2px] overflow-hidden rounded-lg" style={{ gridTemplateColumns: `repeat(${world.width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${world.height}, minmax(0, 1fr))` }}>
              {world.cells.map((cell) => <button type="button" key={cell.id} aria-label={`Cell ${cell.x}, ${cell.y}: ${cell.biome}`} aria-pressed={cell.id === selectedCellId} onClick={() => setSelectedCellId(cell.id)} title={`${cell.biome.replaceAll('_', ' ')} · ${cell.elevationM.toLocaleString()} m · ${cell.temperatureC} °C`} className={`min-h-0 min-w-0 transition duration-200 hover:z-10 hover:scale-125 ${cell.id === selectedCellId ? 'z-10 scale-125 ring-2 ring-white shadow-[0_0_16px_white]' : 'opacity-90 hover:opacity-100'}`} style={{ backgroundColor: BIOME_COLORS[cell.biome] ?? '#555' }} />)}
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-surface-sunken/50 p-3"><p className="text-xs text-ink-muted">Grid land coverage</p><p className="mt-1 font-mono text-2xl text-ink">{world.landPercent}%</p><p className="text-[10px] text-ink-faint">Share of generated cells classified as land</p></div>
            {selectedCell ? <div className="rounded-xl border border-emerald-200/20 bg-emerald-300/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-200">Selected cell · {selectedCell.x}:{selectedCell.y}</p><p className="mt-1 text-lg font-semibold capitalize text-ink">{selectedCell.biome.replaceAll('_', ' ')}</p><p className="mt-2 font-mono text-xs text-ink-muted">{selectedCell.lat.toFixed(1)}° / {selectedCell.lon.toFixed(1)}°</p><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div><p className="font-mono text-sm">{selectedCell.elevationM.toLocaleString()}</p><p className="text-[9px] uppercase text-ink-faint">fictional m</p></div><div><p className="font-mono text-sm">{selectedCell.temperatureC}°</p><p className="text-[9px] uppercase text-ink-faint">fictional °C</p></div><div><p className="font-mono text-sm">{Math.round(selectedCell.rainfallMm)}</p><p className="text-[9px] uppercase text-ink-faint">fictional mm</p></div></div></div> : null}
            <div className="space-y-1.5">{biomeRows.map(([biome, count]) => <div key={biome} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-sunken/40 px-2.5 py-2"><span className="flex items-center gap-2 text-xs capitalize text-ink-muted"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BIOME_COLORS[biome] }} />{biome.replaceAll('_', ' ')}</span><span className="font-mono text-xs text-ink">{count}</span></div>)}</div>
          </div>
        </div>
      </Panel>
      <Panel title="Interpretation" description="A generated design artifact, not a planetary science product."><p className="text-sm leading-relaxed text-ink-muted">The generator uses a seeded pseudo-random process and broad latitude, rainfall, and elevation rules to create an internally repeatable map sketch. It does not use real elevation, climate, hydrology, tectonics, or imagery data; its numeric values are fictional parameters intended for worldbuilding and game or story prototyping.</p></Panel>
    </> : <Panel><p className="py-8 text-center text-sm text-ink-muted">Choose a seed and generate a world. Save it to a project to retain the output with your design notes.</p></Panel>}
  </div>;
}
