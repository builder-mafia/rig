import type { ModelSpec } from '../../model-spec';
import type { OpenAiModelId } from '../openai-models';

export const openaiModelSpec = {
  "gpt-5.4-pro": {
    "id": "gpt-5.4-pro",
    "name": "GPT-5.4 Pro",
    "family": "gpt-pro",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": false,
    "temperature": false,
    "knowledge": "2025-08-31",
    "release_date": "2026-03-05",
    "last_updated": "2026-03-05",
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
      "input": 30,
      "output": 180,
      "context_over_200k": {
        "input": 60,
        "output": 270
      }
    },
    "limit": {
      "context": 1050000,
      "output": 128000,
      "input": 922000
    }
  },
  "gpt-5-mini": {
    "id": "gpt-5-mini",
    "name": "GPT-5 Mini",
    "family": "gpt-mini",
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
      "cache_read": 0.025
    },
    "limit": {
      "context": 400000,
      "output": 128000,
      "input": 272000
    }
  },
  "gpt-5.4": {
    "id": "gpt-5.4",
    "name": "GPT-5.4",
    "family": "gpt",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2025-08-31",
    "release_date": "2026-03-05",
    "last_updated": "2026-03-05",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 2.5,
      "output": 15,
      "cache_read": 0.25,
      "context_over_200k": {
        "input": 5,
        "output": 22.5,
        "cache_read": 0.5
      }
    },
    "limit": {
      "context": 1050000,
      "output": 128000,
      "input": 922000
    }
  },
  "gpt-5.2": {
    "id": "gpt-5.2",
    "name": "GPT-5.2",
    "family": "gpt",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": false,
    "knowledge": "2025-08-31",
    "release_date": "2025-12-11",
    "last_updated": "2025-12-11",
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
      "input": 1.75,
      "output": 14,
      "cache_read": 0.175
    },
    "limit": {
      "context": 400000,
      "output": 128000,
      "input": 272000
    }
  },
  "gpt-5.1": {
    "id": "gpt-5.1",
    "name": "GPT-5.1",
    "family": "gpt",
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
      "cache_read": 0.13
    },
    "limit": {
      "context": 400000,
      "output": 128000,
      "input": 272000
    }
  },
  "gpt-5-nano": {
    "id": "gpt-5-nano",
    "name": "GPT-5 Nano",
    "family": "gpt-nano",
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
      "cache_read": 0.005
    },
    "limit": {
      "context": 400000,
      "output": 128000,
      "input": 272000
    }
  },
  "gpt-5.2-pro": {
    "id": "gpt-5.2-pro",
    "name": "GPT-5.2 Pro",
    "family": "gpt-pro",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": false,
    "temperature": false,
    "knowledge": "2025-08-31",
    "release_date": "2025-12-11",
    "last_updated": "2025-12-11",
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
      "input": 21,
      "output": 168
    },
    "limit": {
      "context": 400000,
      "output": 128000,
      "input": 272000
    }
  }
} as const satisfies Record<OpenAiModelId, ModelSpec>;
