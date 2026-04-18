import { StateSubject } from '@allin/utils';
import type { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type {
  ConfigDirectoryEntry,
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageConfigFile,
} from '@/lib/gateway/config-file/types';

type ConfigFileProps = {
  name: string;
  path: string;
  isDirectory: boolean;
  iconType: 'preset' | 'uploaded' | null;
  iconValue: string | null;
};

export class ConfigFileManager {
  private static instance: ConfigFileManager;

  private _configFiles$ = new StateSubject<StorageConfigFile[]>([]);
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
    const configFiles = await configFileGateway.getAll();
    this._configFiles$.next(configFiles);

    return configFiles;
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
      iconType: params.iconType,
      iconValue: params.iconValue,
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
      ...params,
      updatedAt: Date.now(),
    });

    await this.fetchFiles();
  }

  public async deleteConfigFile(configFileId: string) {
    await configFileGateway.delete(configFileId);
    await this.fetchFiles();
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
