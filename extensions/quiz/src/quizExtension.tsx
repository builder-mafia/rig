import type { Extension } from '@allin/extension';

export const quizExtension: Extension = {
  id: 'quiz',
  name: 'Quiz',
  description: 'create multiple choice quiz',
  version: '1.0.0-beta',
  activate(context) {
    context.TextSelectionFloatingButtonList.add(
      'quiz',
      ({ close, selectedText }) => {
        return <span>Create Quiz</span>;
      },
    );
  },
  deactivate(context) {
    context.TextSelectionFloatingButtonList.remove('quiz');
  },
};
