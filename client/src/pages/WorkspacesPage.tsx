import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, FolderPlus, Trash2 } from 'lucide-react';

import { apiGet, apiPost } from '../lib/api';
import { downloadJson, timeAgo } from '../lib/format';
import { useToast } from '../components/Toast';
import { ErrorNote, Panel, SectionHeading, Spinner } from '../components/ui';

type SavedRun = { id: string; scenario: string; result: unknown; createdAt: string };
type WorldProject = { id: string; name: string; seed: string; notes: string; createdAt: string; updatedAt: string; runs: SavedRun[] };

export function WorkspacesPage() {
  const [name, setName] = useState('');
  const [seed, setSeed] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();
  const client = useQueryClient();
  const projects = useQuery({ queryKey: ['workspaces'], queryFn: () => apiGet<{ projects: WorldProject[] }>('/workspaces') });
  const create = useMutation({
    mutationFn: () => apiPost<{ project: WorldProject }>('/workspaces', { name, seed, notes }),
    onSuccess: () => { setName(''); setSeed(''); setNotes(''); void client.invalidateQueries({ queryKey: ['workspaces'] }); addToast({ type: 'success', title: 'World project created' }); }
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/v1/workspaces/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!response.ok) throw new Error(`Delete failed (${response.status})`); },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['workspaces'] }); addToast({ type: 'success', title: 'Project deleted' }); }
  });

  return <div className="space-y-5">
    <SectionHeading eyebrow="Persistent work" title="World projects" description="Keep a named world seed, design notes, and its scenario runs together. Saved projects live on this server installation and can be reopened after a restart." actions={<Link className="btn text-xs" to="/simulator">Open simulator <ArrowRight className="h-3.5 w-3.5" /></Link>} />
    <Panel title="Create a world project" description="The seed is the reproducible identity for the generated world. Notes capture the design goal or constraints.">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
        <label className="label">Project name<input className="input mt-1" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Archipelago climate study" /></label>
        <label className="label">Project scenario seed<input className="input mt-1" required maxLength={120} value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="A reproducible seed" /></label>
        <label className="label md:col-span-2">Design notes<textarea className="input mt-1 min-h-20" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What are you trying to create or compare?" /></label>
        <div className="md:col-span-2"><button className="btn btn-primary" disabled={create.isPending || !name.trim() || !seed.trim()}><FolderPlus className="h-4 w-4" />{create.isPending ? 'Creating…' : 'Create project'}</button>{create.isError ? <ErrorNote message={(create.error as Error).message} /> : null}</div>
      </form>
    </Panel>
    {projects.isPending ? <Panel><Spinner label="Loading saved worlds…" /></Panel> : projects.isError ? <ErrorNote message={(projects.error as Error).message} onRetry={() => void projects.refetch()} /> : projects.data?.projects.length ? <div className="space-y-3">{projects.data.projects.map((project) => <Panel key={project.id} title={project.name} description={`Seed: ${project.seed} · updated ${timeAgo(project.updatedAt)}`} actions={<button className="btn btn-ghost px-2" aria-label={`Delete ${project.name}`} title="Delete project and its runs" onClick={() => { if (window.confirm(`Delete “${project.name}” and all saved runs?`)) remove.mutate(project.id); }}><Trash2 className="h-4 w-4" /></button>}>
      {project.notes ? <p className="mb-3 text-sm text-ink-muted">{project.notes}</p> : null}
      {project.runs.length ? <ul className="space-y-2">{project.runs.map((run) => <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-sunken/50 px-3 py-2"><span className="text-sm text-ink">{run.scenario}<span className="ml-2 text-xs text-ink-faint">{timeAgo(run.createdAt)}</span></span><button className="btn btn-ghost px-2" onClick={() => downloadJson(`${project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${run.id}.json`, run.result)}><Download className="h-3.5 w-3.5" />Export report</button></li>)}</ul> : <p className="text-sm text-ink-faint">No scenario runs saved yet. Choose this project in the simulator after running an intervention.</p>}
    </Panel>)}</div> : <Panel><p className="py-5 text-center text-sm text-ink-muted">No saved worlds yet. Create a project to preserve its seed, design brief, and future runs.</p></Panel>}
  </div>;
}
