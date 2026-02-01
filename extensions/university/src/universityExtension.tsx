import type { Extension } from '@allin/extension';

export const universityExtension: Extension = ({ event, ui }) => {
  const sub1 = event['extension.activate']('university').subscribe(
    ({ id, name }) => {
      console.log('==> extension activated', id, name);
    },
  );

  const sub2 = event['extension.open']('university').subscribe(
    ({ id, name }) => {
      console.log('==> extension opened', id, name);
      ui.render({
        id: 'university',
        component: (
          <div className='w-full h-full flex justify-center items-center'>
            <h1>University Extension</h1>
          </div>
        ),
      });
    },
  );

  return {
    id: 'university',
    name: 'university',
    description: 'A new ALLIN extension',
    version: '0.1.0',
    cleanup: () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    },
  };
};
