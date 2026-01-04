
  import type { ModelSpec } from '../../model-spec';
  import type { OpenAiModelId } from '../openai-models';

  export const openaiModelSpec = {
  "gpt-4.1-nano": {
    "id": "gpt-4.1-nano",
    "name": "GPT-4.1 nano",
    "family": "gpt-4.1-nano",
    "attachment": true,
    "reasoning": false,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2024-04",
    "release_date": "2025-04-14",
    "last_updated": "2025-04-14",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.1,
      "output": 0.4,
      "cache_read": 0.03
    },
    "limit": {
      "context": 1047576,
      "output": 32768
    }
  },
  "gpt-5.1-codex": {
    "id": "gpt-5.1-codex",
    "name": "GPT-5.1 Codex",
    "family": "gpt-5-codex",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-09-30",
    "release_date": "2025-11-13",
    "last_updated": "2025-11-13",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 1.25,
      "output": 10,
      "cache_read": 0.125
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-4.1-mini": {
    "id": "gpt-4.1-mini",
    "name": "GPT-4.1 mini",
    "family": "gpt-4.1-mini",
    "attachment": true,
    "reasoning": false,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2024-04",
    "release_date": "2025-04-14",
    "last_updated": "2025-04-14",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.4,
      "output": 1.6,
      "cache_read": 0.1
    },
    "limit": {
      "context": 1047576,
      "output": 32768
    }
  },
  "gpt-5.1-codex-mini": {
    "id": "gpt-5.1-codex-mini",
    "name": "GPT-5.1 Codex mini",
    "family": "gpt-5-codex-mini",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-09-30",
    "release_date": "2025-11-13",
    "last_updated": "2025-11-13",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.25,
      "output": 2,
      "cache_read": 0.025
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-5.1": {
    "id": "gpt-5.1",
    "name": "GPT-5.1",
    "family": "gpt-5",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": false,
    "knowledge": "2024-09-30",
    "release_date": "2025-11-13",
    "last_updated": "2025-11-13",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 1.25,
      "output": 10,
      "cache_read": 0.13
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-5-nano": {
    "id": "gpt-5-nano",
    "name": "GPT-5 Nano",
    "family": "gpt-5-nano",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-05-30",
    "release_date": "2025-08-07",
    "last_updated": "2025-08-07",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.05,
      "output": 0.4,
      "cache_read": 0.01
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-5-codex": {
    "id": "gpt-5-codex",
    "name": "GPT-5-Codex",
    "family": "gpt-5-codex",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-09-30",
    "release_date": "2025-09-15",
    "last_updated": "2025-09-15",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 1.25,
      "output": 10,
      "cache_read": 0.125
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-4.1": {
    "id": "gpt-4.1",
    "name": "GPT-4.1",
    "family": "gpt-4.1",
    "attachment": true,
    "reasoning": false,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2024-04",
    "release_date": "2025-04-14",
    "last_updated": "2025-04-14",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 2,
      "output": 8,
      "cache_read": 0.5
    },
    "limit": {
      "context": 1047576,
      "output": 32768
    }
  },
  "gpt-5-mini": {
    "id": "gpt-5-mini",
    "name": "GPT-5 Mini",
    "family": "gpt-5-mini",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-05-30",
    "release_date": "2025-08-07",
    "last_updated": "2025-08-07",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.25,
      "output": 2,
      "cache_read": 0.03
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  },
  "gpt-5": {
    "id": "gpt-5",
    "name": "GPT-5",
    "family": "gpt-5",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2024-09-30",
    "release_date": "2025-08-07",
    "last_updated": "2025-08-07",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 1.25,
      "output": 10,
      "cache_read": 0.13
    },
    "limit": {
      "context": 400000,
      "output": 128000
    }
  }
} as const satisfies Record<OpenAiModelId, ModelSpec>;