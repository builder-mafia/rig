import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigHub } from './components/ConfigHub';
import type { ConfigPlugin } from './types';

const { invoke, open } = vi.hoisted(() => ({ invoke: vi.fn(), open: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open }));
const makePlugin = (id = 'fixture', installed = false): ConfigPlugin => ({
  id,
  name: id === 'fixture' ? 'Fixture tool' : 'Shell tool',
  version: '1.0',
  description: 'Explore settings',
  icon: 'settings',
  homepage: null,
  installed,
  builtin: true,
  files: [
    {
      id: 'config',
      label: 'config.json',
      path: '/fixture/config.json',
      format: 'json',
      exists: true,
      hasSchema: id === 'fixture',
      error: null,
    },
  ],
});
let plugins: ConfigPlugin[];
let clients: QueryClient[] = [];
const document = () => ({
  path: '/fixture/config.json',
  format: 'json',
  exists: true,
  content: '{"enabled":false,"api_key":"fixture-secret"}',
  value: { enabled: false, api_key: 'fixture-secret', extra: null },
  parseError: null,
  revision: 'revision',
  schema: {
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Enable the feature',
        default: true,
        enum: [true, false],
      },
      api_key: { type: 'string' },
      credentials_store: { type: 'string', enum: ['file', 'keyring'] },
      model: {
        type: 'string',
        description: 'Model name',
        enum: ['small', 'large'],
      },
    },
  },
});
beforeEach(() => {
  localStorage.clear();
  invoke.mockReset();
  open.mockReset();
  plugins = [makePlugin()];
  invoke.mockImplementation(async (command, args) => {
    if (command === 'list_config_plugins') return structuredClone(plugins);
    if (command === 'install_config_plugin') {
      plugins = plugins.map(plugin => ({
        ...plugin,
        installed: plugin.id === args.pluginId || plugin.installed,
      }));
      return;
    }
    if (command === 'remove_config_plugin') {
      plugins = plugins.map(plugin => ({
        ...plugin,
        installed: plugin.id !== args.pluginId && plugin.installed,
      }));
      return;
    }
    if (command === 'read_config_file') return document();
    if (command === 'preview_config_plugin')
      return {
        plugin: { ...makePlugin(), builtin: false },
        revision: 'preview-revision',
      };
    if (command === 'import_config_plugin') {
      plugins = [{ ...makePlugin(), builtin: false, installed: true }];
      return 'fixture';
    }
    throw new Error(`Unexpected command ${command}`);
  });
});
afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear());
  clients = [];
});
const TestHub = () => {
  const [editing, setEditing] = useState(false);
  return <ConfigHub editing={editing} onEditingChange={setEditing} />;
};
const setup = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <TestHub />
    </QueryClientProvider>,
  );
  return client;
};

describe('Config Hub', () => {
  it('installs viewers, shows current values, guides and masked secrets, then removes only the plugin', async () => {
    const client = setup();
    await screen.findByText(
      'Understand your tools, one configuration at a time. Add a plugin to browse files and discover available properties.',
    );
    expect(
      invoke.mock.calls.some(([command]) => command === 'read_config_file'),
    ).toBe(false);
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add config plugins' })[0],
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Install Fixture tool plugin',
      }),
    );
    await screen.findByText('Enable the feature');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('fixture-secret')).toBeNull();
    expect(screen.getByText('keyring')).toBeTruthy();
    expect(screen.getAllByText('false').length).toBeGreaterThan(0);
    expect(screen.getByText('Schema default')).toBeTruthy();
    expect(
      screen.getByText('Additional property; no schema description.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal value' }));
    expect(screen.getByText('fixture-secret')).toBeTruthy();
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search properties' }),
      { target: { value: 'model' } },
    );
    await waitFor(() =>
      expect(screen.queryByText('Enable the feature')).toBeNull(),
    );
    expect(screen.getByText('small')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Source' }));
    expect(screen.getByLabelText('Configuration source').textContent).toBe(
      document().content,
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add config plugins' })[0],
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Fixture tool plugin' }),
    );
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('remove_config_plugin', {
        pluginId: 'fixture',
      }),
    );
    await waitFor(() =>
      expect(
        client.getQueryCache().findAll({ queryKey: ['config-file'] }),
      ).toHaveLength(0),
    );
    expect(
      invoke.mock.calls.every(([command]) => command !== 'save_config_file'),
    ).toBe(true);
  });

  it('previews imported manifests before installing the exact reviewed revision', async () => {
    setup();
    await screen.findByText('Config Hub');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add config plugins' })[0],
    );
    open.mockResolvedValue('/fixtures/plugin.json');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Import plugin manifest' }),
    );
    await screen.findByText('Review plugin');
    expect(
      invoke.mock.calls.some(([command]) => command === 'import_config_plugin'),
    ).toBe(false);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Install plugin',
      }),
    );
    await screen.findByText('Enable the feature');
    expect(invoke).toHaveBeenCalledWith('import_config_plugin', {
      manifestPath: '/fixtures/plugin.json',
      expectedRevision: 'preview-revision',
    });
  });

  it('shows missing-file schemas and source fallback for malformed or raw files', async () => {
    plugins = [makePlugin('fixture', true)];
    const read = document();
    invoke.mockImplementation(async command =>
      command === 'list_config_plugins'
        ? plugins
        : { ...read, exists: false, content: null, value: null },
    );
    const client = setup();
    await screen.findByText(
      'This file does not exist yet. Available properties are shown below.',
    );
    expect(screen.getByText('Model name')).toBeTruthy();
    invoke.mockImplementation(async command =>
      command === 'list_config_plugins'
        ? plugins
        : {
            ...read,
            parseError: 'Invalid JSON',
            value: null,
            content: '{invalid',
          },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Refresh configuration' }),
    );
    await screen.findByText(
      'This file could not be parsed. Fix the syntax in Source.',
    );
    expect(screen.getByLabelText('Configuration source').textContent).toBe(
      '{invalid',
    );
    cleanup();
    client.clear();
    plugins = [makePlugin('shell', true)];
    invoke.mockImplementation(async command =>
      command === 'list_config_plugins'
        ? plugins
        : {
            ...read,
            schema: null,
            format: 'text',
            value: null,
            content: 'export SHELL_FIXTURE=1',
          },
    );
    setup();
    await screen.findByText('export SHELL_FIXTURE=1');
    expect(screen.queryByRole('tab', { name: 'Properties' })).toBeNull();
  });

  it('saves an inline table value on blur and updates the source without refetching', async () => {
    plugins = [makePlugin('fixture', true)];
    const current = document();
    const updated = {
      ...current,
      value: { ...current.value, enabled: true },
      content: current.content.replace('false', 'true'),
      revision: 'updated',
    };
    invoke.mockImplementation(async command => {
      if (command === 'list_config_plugins') return plugins;
      if (command === 'read_config_file') return current;
      if (command === 'save_config_file') return updated;
      throw new Error(`Unexpected command ${command}`);
    });
    setup();
    const table = await screen.findByRole('table', { name: 'Properties' });
    fireEvent.click(
      within(table).getByRole('button', { name: 'Edit enabled' }),
    );
    fireEvent.change(
      within(table).getByRole('combobox', { name: 'Value for enabled' }),
      { target: { value: 'true' } },
    );
    expect(
      screen.getByRole('tab', { name: 'Source' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.blur(
      within(table).getByRole('combobox', { name: 'Value for enabled' }),
    );
    await waitFor(() =>
      expect(
        within(table).getByRole('button', { name: 'Edit enabled' }).textContent,
      ).toBe('true'),
    );
    expect(invoke).toHaveBeenCalledWith('save_config_file', {
      pluginId: 'fixture',
      fileId: 'config',
      expectedRevision: 'revision',
      edit: { kind: 'property', path: ['enabled'], value: 'true' },
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Source' }));
    expect(screen.getByLabelText('Configuration source').textContent).toBe(
      updated.content,
    );
    expect(
      invoke.mock.calls.filter(([command]) => command === 'read_config_file'),
    ).toHaveLength(1);
  });

  it('removes a cleared key when the user clicks outside its editor', async () => {
    plugins = [makePlugin('fixture', true)];
    const current = document();
    const updated = {
      ...current,
      value: { enabled: false, extra: null },
      content: '{"enabled":false,"extra":null}',
      revision: 'removed',
    };
    invoke.mockImplementation(async command => {
      if (command === 'list_config_plugins') return plugins;
      if (command === 'read_config_file') return current;
      if (command === 'save_config_file') return updated;
      throw new Error(`Unexpected command ${command}`);
    });
    setup();
    const table = await screen.findByRole('table', { name: 'Properties' });
    const edit = () =>
      fireEvent.click(
        within(table).getByRole('button', { name: 'Edit api_key' }),
      );
    edit();
    fireEvent.change(within(table).getByLabelText('Value for api_key'), {
      target: { value: '' },
    });
    fireEvent.pointerDown(
      within(table).getByRole('columnheader', { name: 'File value' }),
    );
    await waitFor(() =>
      expect(
        within(table).getByRole('button', { name: 'Edit api_key' }).textContent,
      ).toBe('Not set'),
    );
    expect(invoke).toHaveBeenCalledWith('save_config_file', {
      pluginId: 'fixture',
      fileId: 'config',
      expectedRevision: 'revision',
      edit: { kind: 'removeProperty', path: ['api_key'] },
    });
    edit();
    fireEvent.pointerDown(
      within(table).getByRole('columnheader', { name: 'File value' }),
    );
    expect(
      invoke.mock.calls.filter(([command]) => command === 'save_config_file'),
    ).toHaveLength(1);
  });

  it('keeps a source draft after a conflict and reloads only when the draft is discarded', async () => {
    plugins = [makePlugin('fixture', true)];
    const current = document();
    const external = {
      ...current,
      content: '{"enabled":true}',
      revision: 'external',
    };
    let stale = false;
    invoke.mockImplementation(async command => {
      if (command === 'list_config_plugins') return plugins;
      if (command === 'read_config_file') return stale ? external : current;
      if (command === 'save_config_file') {
        stale = true;
        throw { code: 'conflict' };
      }
      throw new Error(`Unexpected command ${command}`);
    });
    setup();
    fireEvent.click(await screen.findByRole('tab', { name: 'Source' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit source' }));
    const editor = screen.getByRole('textbox', {
      name: 'Edit configuration source',
    }) as HTMLTextAreaElement;
    const draft = '{"enabled":false,"model":"small"}';
    fireEvent.change(editor, { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(
      'This file changed in another app. Your edits are kept here.',
    );
    expect(editor.value).toBe(draft);
    expect(invoke).toHaveBeenCalledWith('save_config_file', {
      pluginId: 'fixture',
      fileId: 'config',
      expectedRevision: 'revision',
      edit: { kind: 'source', content: draft },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard edits and reload' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Configuration source').textContent).toBe(
        external.content,
      ),
    );
  });
});
