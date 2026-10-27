import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export interface WorldProject {
  id: string;
  name: string;
  seed: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  runs: Array<{ id: string; scenario: string; result: unknown; createdAt: string }>;
}

interface WorkspaceFile { version: 1; projects: WorldProject[] }

const STORE_PATH = process.env.WORKSPACE_FILE ?? fileURLToPath(new URL('../../../.data/workspaces.json', import.meta.url));
const EMPTY: WorkspaceFile = { version: 1, projects: [] };

export class WorkspaceStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly path = STORE_PATH, private readonly memory = process.env.NODE_ENV === 'test') {}

  private async read(): Promise<WorkspaceFile> {
    if (this.memory) return this.memoryState;
    try {
      const parsed: unknown = JSON.parse(await readFile(this.path, 'utf8'));
      if (typeof parsed === 'object' && parsed !== null && 'version' in parsed &&
          (parsed as WorkspaceFile).version === 1 && Array.isArray((parsed as WorkspaceFile).projects)) {
        return parsed as WorkspaceFile;
      }
      throw new Error('Workspace file has an unsupported format');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY;
      throw error;
    }
  }

  private memoryState: WorkspaceFile = { version: 1, projects: [] };

  private async write(state: WorkspaceFile): Promise<void> {
    if (this.memory) { this.memoryState = state; return; }
    await mkdir(dirname(this.path), { recursive: true });
    const temp = `${this.path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temp, this.path);
  }

  private async update<T>(fn: (state: WorkspaceFile) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const state = await this.read();
      const result = fn(state);
      await this.write(state);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async list(): Promise<WorldProject[]> {
    await this.queue;
    return (await this.read()).projects;
  }

  async create(input: { name: string; seed: string; notes: string }): Promise<WorldProject> {
    return this.update((state) => {
      if (state.projects.length >= 200) throw Object.assign(new Error('This server has reached its 200-project limit.'), { statusCode: 409, code: 'PROJECT_LIMIT_REACHED' });
      const now = new Date().toISOString();
      const project: WorldProject = {
        id: randomUUID(), name: input.name, seed: input.seed, notes: input.notes,
        createdAt: now, updatedAt: now, runs: []
      };
      state.projects.unshift(project);
      return project;
    });
  }

  async addRun(projectId: string, scenario: string, result: unknown): Promise<WorldProject> {
    return this.update((state) => {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) throw Object.assign(new Error('World project not found'), { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
      if (project.runs.length >= 250) throw Object.assign(new Error('This project has reached its 250-run limit.'), { statusCode: 409, code: 'RUN_LIMIT_REACHED' });
      const now = new Date().toISOString();
      project.runs.unshift({ id: randomUUID(), scenario, result, createdAt: now });
      project.updatedAt = now;
      return project;
    });
  }

  async remove(projectId: string): Promise<void> {
    await this.update((state) => {
      const index = state.projects.findIndex((item) => item.id === projectId);
      if (index < 0) throw Object.assign(new Error('World project not found'), { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
      state.projects.splice(index, 1);
    });
  }
}

export const workspaceStore = new WorkspaceStore();
