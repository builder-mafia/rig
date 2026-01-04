import type { ExtensionContext } from '@allin/context';
import type { Extension } from '@allin/extension';
import quizExtension from '@allin/extension-quiz';
import { extensionContextImpl } from '@/extension-context-implement/ExtensionContextImpl';

export type LoadedExtension = {
  extension: Extension;
  isActive: boolean;
};

class ExtensionLoader {
  private loadedExtensions = new Map<string, LoadedExtension>();
  private context: ExtensionContext;

  // we could change this to dynamic import in the future
  private registry: Record<string, Extension> = {
    '@allin/extension-quiz': quizExtension,
  };

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  async load(extensionName: string) {
    try {
      if (this.loadedExtensions.has(extensionName)) {
        console.log(`Extension ${extensionName} is already loaded`);
        return;
      }

      let extension: Extension | null = null;

      if (this.registry?.[extensionName]) {
        extension = this.registry[extensionName];
        console.log(`Extension ${extensionName} loaded from registry`);
      }

      if (!extension) {
        throw new Error(`No valid Extension found in module ${extensionName}`);
      }

      console.log(extension);
      this.loadedExtensions.set(extensionName, {
        extension,
        isActive: false,
      });
    } catch (error) {
      console.error(`Failed to load extension ${extensionName}:`, error);
      throw error;
    }
  }

  async activate(extensionName: string): Promise<void> {
    const loaded = this.loadedExtensions.get(extensionName);

    if (!loaded) {
      throw new Error(`Extension ${extensionName} is not loaded`);
    }

    if (loaded.isActive) {
      console.log(`Extension ${extensionName} is already active`);
      return;
    }

    await loaded.extension.activate(this.context);
    loaded.isActive = true;
  }

  async deactivate(extensionName: string): Promise<void> {
    const loaded = this.loadedExtensions.get(extensionName);

    if (!loaded) {
      throw new Error(`Extension ${extensionName} is not loaded`);
    }

    if (!loaded.isActive) {
      return;
    }

    await loaded.extension.deactivate?.(this.context);
    loaded.isActive = false;
  }

  async loadAndActivate(extensionName: string): Promise<void> {
    console.log('==> loading and activating extension', extensionName);
    await this.load(extensionName);
    await this.activate(extensionName);
  }
}

export const extensionLoader = new ExtensionLoader(extensionContextImpl);
