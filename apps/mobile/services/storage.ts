import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TProject, TProjectMetadata } from "@/types/project";

const PROJECTS_KEY_PREFIX = "opencut:project:";
const PROJECTS_INDEX_KEY = "opencut:projects-index";

function projectKey(id: string): string {
  return `${PROJECTS_KEY_PREFIX}${id}`;
}

function serializeProject(project: TProject): string {
  return JSON.stringify({
    ...project,
    metadata: {
      ...project.metadata,
      createdAt: project.metadata.createdAt.toISOString(),
      updatedAt: project.metadata.updatedAt.toISOString(),
    },
    scenes: project.scenes.map((scene) => ({
      ...scene,
      createdAt: scene.createdAt.toISOString(),
      updatedAt: scene.updatedAt.toISOString(),
    })),
  });
}

function deserializeProject(json: string): TProject {
  const data = JSON.parse(json);
  return {
    ...data,
    metadata: {
      ...data.metadata,
      createdAt: new Date(data.metadata.createdAt),
      updatedAt: new Date(data.metadata.updatedAt),
    },
    scenes: (data.scenes ?? []).map(
      (scene: Record<string, unknown> & { createdAt: string; updatedAt: string }) => ({
        ...scene,
        bookmarks: (scene.bookmarks as number[]) ?? [],
        createdAt: new Date(scene.createdAt),
        updatedAt: new Date(scene.updatedAt),
      })
    ),
  };
}

class StorageService {
  async saveProject({ project }: { project: TProject }): Promise<void> {
    const key = projectKey(project.metadata.id);
    await AsyncStorage.setItem(key, serializeProject(project));
    await this.addToIndex({ id: project.metadata.id });
  }

  async loadProject({ id }: { id: string }): Promise<TProject | null> {
    const raw = await AsyncStorage.getItem(projectKey(id));
    if (!raw) return null;
    return deserializeProject(raw);
  }

  async loadAllProjectsMetadata(): Promise<TProjectMetadata[]> {
    const ids = await this.getIndex();
    const metadata: TProjectMetadata[] = [];

    for (const id of ids) {
      const project = await this.loadProject({ id });
      if (project) {
        metadata.push(project.metadata);
      }
    }

    return metadata.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async deleteProject({ id }: { id: string }): Promise<void> {
    await AsyncStorage.removeItem(projectKey(id));
    await this.removeFromIndex({ id });
  }

  private async getIndex(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(PROJECTS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  }

  private async addToIndex({ id }: { id: string }): Promise<void> {
    const ids = await this.getIndex();
    if (!ids.includes(id)) {
      ids.push(id);
      await AsyncStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(ids));
    }
  }

  private async removeFromIndex({ id }: { id: string }): Promise<void> {
    const ids = await this.getIndex();
    const filtered = ids.filter((existing) => existing !== id);
    await AsyncStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(filtered));
  }
}

export const storageService = new StorageService();
