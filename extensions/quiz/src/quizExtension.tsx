import type { Extension } from '@allin/extension';

export const quizExtension: Extension = {
  id: 'quiz',
  name: 'Quiz Extension',
  version: '1.0.0-beta',
  description: 'An extension that creates a quiz when you select text',
  activate(api) {
    api.TextSelectionFloatingButtonList.add(
      'quiz',
      ({ close, selectedText }) => {
        return <span>Create Quiz</span>;
      },
    );
  },
  deactivate(api) {
    api.TextSelectionFloatingButtonList.remove('quiz');
  },
};
