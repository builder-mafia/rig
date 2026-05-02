import { StateSubject } from '@allin/utils';
import type { Observable } from 'rxjs';
import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type {
  LocalPathCheckInput,
  LocalPathCheckResult,
  ScannedFile,
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';

const omitUndefined = <T extends Record<string, unknown>>(
  value: T,
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>;
};

export class ConfigFileManager {
  private static instance: ConfigFileManager;

  private _configFiles$ = new StateSubject<StorageConfigFile[]>([]);
  private _groups$ = new StateSubject<StorageGroup[]>([]);

  private constructor() {}

  public static getInstance() {
    if (!ConfigFileManager.instance) {
      ConfigFileManager.instance = new ConfigFileManager();
    }
    return ConfigFileManager.instance;
  }

  public get files(): StorageConfigFile[] {
    return this._configFiles$.getValue();
  }

  public get files$(): Observable<StorageConfigFile[]> {
    return this._configFiles$.asObservable();
  }

  public get groups(): StorageGroup[] {
    return this._groups$.getValue();
  }

  public get groups$(): Observable<StorageGroup[]> {
    return this._groups$.asObservable();
  }

  public async fetchFiles() {
    const configFiles = await configFileGateway.getFiles();
    this._configFiles$.next(configFiles);

    return configFiles;
  }

  public async fetchGroups() {
    const groups = await configFileGateway.getGroups();
    this._groups$.next(groups);

    return groups;
  }

  public async createConfigFile(
    file: StorageConfigFile,
  ): Promise<StorageConfigFile> {
    await configFileGateway.create(file);
    await this.fetchFiles();
    return file;
  }

  public async checkLocalPath(
    input: LocalPathCheckInput,
  ): Promise<LocalPathCheckResult> {
    return configFileGateway.checkLocalPath(input);
  }

  public async updateConfigFile(
    id: string,
    params: Partial<Exclude<StorageConfigFile, 'id'>>,
  ) {
    const current = this.files.find(configFile => configFile.id === id);
    if (!current) {
      throw new Error(`Config file with id ${id} not found`);
    }

    await configFileGateway.update({
      ...current,
      ...omitUndefined(params),
      updatedAt: Date.now(),
    });

    await this.fetchFiles();
  }

  public async deleteConfigFile(id: string) {
    await configFileGateway.delete(id);
    await this.fetchFiles();
  }

  public async createGroup(group: StorageGroup): Promise<StorageGroup> {
    await configFileGateway.createGroup(group);
    await this.fetchGroups();
    return group;
  }

  public async updateGroup(
    id: string,
    params: Partial<Exclude<StorageGroup, 'id'>>,
  ) {
    const current = this.groups.find(group => group.id === id);
    if (!current) {
      throw new Error(`Group with id ${id} not found`);
    }

    await configFileGateway.updateGroup({
      ...current,
      ...omitUndefined(params),
      updatedAt: Date.now(),
    });

    await this.fetchGroups();
  }

  public async deleteGroup(groupId: string) {
    await configFileGateway.deleteGroup(groupId);
    await this.fetchGroups();
  }

  public async read(path: string) {
    return configFileGateway.readContent(path);
  }

  public async readDirectoryFiles(path: string): Promise<ScannedFile[]> {
    return configFileGateway.readDirectoryEntries(path);
  }

  public async write(path: string, content: string) {
    await configFileGateway.writeContent(path, content);
  }
}
