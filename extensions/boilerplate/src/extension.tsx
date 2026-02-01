import type { Extension } from '@allin/extension';

export const {{pascalName}}Extension: Extension = ({ event, ui }) => {
  const sub1 = event['extension.activate']('{{name}}').subscribe(({ id, name }) => {
    console.log('==> extension activated', id, name);
  });

  const sub2 = event['extension.open']('{{name}}').subscribe(({ id, name }) => {
    console.log('==> extension opened', id, name);
    ui.render({
      id: '{{name}}',
      component: (
        <div className='w-full h-full flex justify-center items-center'>
          <h1>{{pascalName}} Extension</h1>
        </div>
      ),
    });
  });

  return {
    id: '{{name}}',
    name: '{{name}}',
    description: '{{description}}',
    version: '0.1.0',
    cleanup: () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    },
  };
};
