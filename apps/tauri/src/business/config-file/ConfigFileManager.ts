import { StateSubject } from '@allin/utils';
import type { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type {
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';

type ConfigFileProps = {
  name: string;
  path: string;
  isDirectory: boolean;
  iconUrl: string | null;
  groupId: string | null;
};

type GroupProps = {
  name: string;
  iconUrl: string | null;
};

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
  private _selectedConfigFileId$ = new StateSubject<string | null>(null);

  private constructor() {}

  public static getInstance() {
    if (!ConfigFileManager.instance) {
      ConfigFileManager.instance = new ConfigFileManager();
    }
    return ConfigFileManager.instance;
  }

  public get configFiles(): StorageConfigFile[] {
    return this._configFiles$.getValue();
  }

  public get configFiles$(): Observable<StorageConfigFile[]> {
    return this._configFiles$.asObservable();
  }

  public get groups(): StorageGroup[] {
    return this._groups$.getValue();
  }

  public get groups$(): Observable<StorageGroup[]> {
    return this._groups$.asObservable();
  }

  public get selectedConfigFileId(): string | null {
    return this._selectedConfigFileId$.getValue();
  }

  public get selectedConfigFileId$(): Observable<string | null> {
    return this._selectedConfigFileId$.asObservable();
  }

  public get selectedConfigFile(): StorageConfigFile | null {
    const selectedId = this._selectedConfigFileId$.getValue();
    if (!selectedId) {
      return null;
    }

    return (
      this.configFiles.find(configFile => configFile.id === selectedId) ?? null
    );
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
    params: ConfigFileProps,
  ): Promise<StorageConfigFile> {
    const now = Date.now();
    const configFile: StorageConfigFile = {
      id: v4(),
      name: params.name,
      path: params.path,
      isDirectory: params.isDirectory,
      iconUrl: params.iconUrl,
      groupId: params.groupId,
      createdAt: now,
      updatedAt: now,
    };

    await configFileGateway.create(configFile);
    await this.fetchFiles();
    this._selectedConfigFileId$.next(configFile.id);
    return configFile;
  }

  public async checkLocalPath(
    input: LocalPathCheckInput,
  ): Promise<LocalPathCheckResult> {
    return configFileGateway.checkLocalPath(input);
  }

  public async updateConfigFile(
    configFileId: string,
    params: Partial<ConfigFileProps>,
  ) {
    const current = this.configFiles.find(
      configFile => configFile.id === configFileId,
    );
    if (!current) {
      throw new Error(`Config file with id ${configFileId} not found`);
    }

    await configFileGateway.update({
      ...current,
      ...omitUndefined(params),
      updatedAt: Date.now(),
    });

    await this.fetchFiles();
  }

  public async deleteConfigFile(configFileId: string) {
    await configFileGateway.delete(configFileId);
    await this.fetchFiles();
  }

  public async createGroup(params: GroupProps): Promise<StorageGroup> {
    const now = Date.now();
    const group = await configFileGateway.createGroup({
      id: v4(),
      name: params.name,
      iconUrl: params.iconUrl,
      createdAt: now,
      updatedAt: now,
    });

    await this.fetchGroups();

    return group;
  }

  public async updateGroup(groupId: string, params: Partial<GroupProps>) {
    const current = this.groups.find(group => group.id === groupId);
    if (!current) {
      throw new Error(`Group with id ${groupId} not found`);
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

  public selectConfigFile(configFileId: string) {
    this._selectedConfigFileId$.next(configFileId);
  }

  public clearSelectedConfigFile() {
    this._selectedConfigFileId$.next(null);
  }

  public async readConfigFile(path: string) {
    return configFileGateway.readContent(path);
  }

  public async writeConfigFile(path: string, content: string) {
    await configFileGateway.writeContent(path, content);
  }
}
