import type { Extension } from '@allin/extension';

export const quizExtension: Extension = ({ event, aui }) => {
  const sub1 = event['extension.activate']('quiz').subscribe(({ id, name }) => {
    console.log('==> extension activated', id, name);
  });

  const sub2 = event['extension.open']('quiz').subscribe(({ id, name }) => {
    console.log('==> extension opened', id, name);
    aui.render({
      id: 'quiz',
      component: (
        <div className='w-full h-full flex justify-center items-center'>
          <h1>Coming Soon</h1>
        </div>
      ),
    });
  });

  return {
    id: 'quiz',
    name: 'quiz',
    description: 'create multiple choice quiz',
    version: '0.1.0',
    cleanup: () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    },
  };
};
