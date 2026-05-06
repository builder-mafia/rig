import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  AIEditChatMessage,
  AIEditHunk,
  AIEditHunkDecision,
  AIEditPhase,
  AIEditProposal,
} from './types';

type UseAIEditArgs = {
  fileId: string;
  baseContent: string;
  onApply: (nextContent: string, appliedHunkIds: string[]) => Promise<void> | void;
};

export const useAIEdit = ({ fileId, baseContent, onApply }: UseAIEditArgs) => {
  const [phase, setPhase] = useState<AIEditPhase>('idle');
  const [messages, setMessages] = useState<AIEditChatMessage[]>([]);
  const [proposal, setProposal] = useState<AIEditProposal | null>(null);
  const [decisions, setDecisions] = useState<Map<string, AIEditHunkDecision>>(
    new Map(),
  );
  const pendingUserEdits = useRef<string | null>(null);

  const send = useCallback(
    async (prompt: string) => {
      if (phase !== 'idle') {
        return;
      }

      const now = Date.now();
      const userMessage: AIEditChatMessage = {
        id: `m_${now}`,
        role: 'user',
        text: prompt,
        createdAt: now,
      };

      setMessages(prev => [...prev, userMessage]);
      setPhase('working');

      const result = await runMockAIEdit({ fileId, baseContent, prompt });
      const assistantMessage: AIEditChatMessage = {
        id: `m_${Date.now()}`,
        role: 'assistant',
        text: result.summary ?? 'Proposed changes. Review and apply.',
        proposalId: result.id,
        createdAt: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setProposal(result);
      setDecisions(
        new Map(result.hunks.map(hunk => [hunk.id, 'pending' as const])),
      );
      setPhase('proposal-pending');
    },
    [baseContent, fileId, phase],
  );

  const decide = useCallback(
    (hunkId: string, decision: AIEditHunkDecision) => {
      setDecisions(prev => {
        const next = new Map(prev);
        next.set(hunkId, decision);
        return next;
      });
    },
    [],
  );

  const applyAll = useCallback(async () => {
    if (!proposal) {
      return;
    }

    setPhase('applying');
    await onApply(
      proposal.after,
      proposal.hunks.map(hunk => hunk.id),
    );
    setProposal(null);
    setDecisions(new Map());
    setPhase('idle');
  }, [onApply, proposal]);

  const flush = useCallback(async () => {
    if (!proposal) {
      return;
    }

    const acceptedIds = [...decisions.entries()]
      .filter(([, decision]) => decision === 'applied')
      .map(([id]) => id);

    setPhase('applying');
    await onApply(applyHunks(baseContent, proposal.hunks, new Set(acceptedIds)), acceptedIds);
    setProposal(null);
    setDecisions(new Map());
    setPhase('idle');
  }, [baseContent, decisions, onApply, proposal]);

  const dismiss = useCallback(() => {
    setProposal(null);
    setDecisions(new Map());
    setPhase('idle');
  }, []);

  const stats = useMemo(() => {
    if (!proposal) {
      return { add: 0, del: 0, hunks: 0 };
    }

    let add = 0;
    let del = 0;
    for (const hunk of proposal.hunks) {
      for (const line of hunk.lines) {
        if (line.kind === 'add') {
          add += 1;
        }
        if (line.kind === 'del') {
          del += 1;
        }
      }
    }

    return { add, del, hunks: proposal.hunks.length };
  }, [proposal]);

  return {
    phase,
    messages,
    proposal,
    decisions,
    stats,
    pendingUserEdits,
    send,
    decide,
    applyAll,
    flush,
    dismiss,
  };
};

export const applyHunks = (
  original: string,
  hunks: AIEditHunk[],
  accepted: Set<string>,
): string => {
  const lines = original.split('\n');
  const sortedHunks = [...hunks].sort((a, b) => a.origStart - b.origStart);
  const output: string[] = [];
  let cursor = 1;

  for (const hunk of sortedHunks) {
    while (cursor < hunk.origStart) {
      output.push(lines[cursor - 1] ?? '');
      cursor += 1;
    }

    if (accepted.has(hunk.id)) {
      for (const line of hunk.lines) {
        if (line.kind === 'add' || line.kind === 'ctx') {
          output.push(line.text);
        }
      }
    } else {
      for (let index = 0; index < hunk.origLen; index += 1) {
        output.push(lines[hunk.origStart - 1 + index] ?? '');
      }
    }

    cursor = hunk.origStart + hunk.origLen;
  }

  while (cursor <= lines.length) {
    output.push(lines[cursor - 1] ?? '');
    cursor += 1;
  }

  return output.join('\n');
};

const runMockAIEdit = async ({
  fileId,
  baseContent,
  prompt,
}: {
  fileId: string;
  baseContent: string;
  prompt: string;
}): Promise<AIEditProposal> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const originalLines = baseContent.split('\n');
  const note = `# AI edit draft: ${prompt}`;
  const after = baseContent.endsWith('\n')
    ? `${baseContent}${note}\n`
    : `${baseContent}\n${note}\n`;

  return {
    id: `proposal_${Date.now()}`,
    fileId,
    basedOnUpdatedAt: Date.now(),
    prompt,
    after,
    summary: 'Mock proposal generated. Real AI edit command will replace this.',
    hunks: [
      {
        id: 'append-ai-note',
        header: 'append AI edit note',
        origStart: originalLines.length + 1,
        origLen: 0,
        lines: [{ kind: 'add', text: note }],
      },
    ],
  };
};
