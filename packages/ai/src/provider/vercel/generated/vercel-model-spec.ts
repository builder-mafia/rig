import type { ModelSpec } from '../../model-spec';
import type { VercelModelId } from '../vercel-models';

export const vercelModelSpec = {
  "alibaba/qwen3.5-flash": {
    "id": "alibaba/qwen3.5-flash",
    "name": "Qwen 3.5 Flash",
    "family": "qwen",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-24",
    "last_updated": "2026-02-24",
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
      "input": 0.1,
      "output": 0.4,
      "cache_read": 0.001,
      "cache_write": 0.125
    },
    "limit": {
      "context": 1000000,
      "output": 64000
    }
  },
  "alibaba/qwen3-embedding-0.6b": {
    "id": "alibaba/qwen3-embedding-0.6b",
    "name": "Qwen3 Embedding 0.6B",
    "family": "qwen",
    "attachment": false,
    "reasoning": false,
    "tool_call": false,
    "temperature": false,
    "release_date": "2025-11-14",
    "last_updated": "2025-11-14",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.01,
      "output": 0
    },
    "limit": {
      "context": 32768,
      "output": 32768
    }
  },
  "alibaba/qwen3-coder-next": {
    "id": "alibaba/qwen3-coder-next",
    "name": "Qwen3 Coder Next",
    "family": "qwen",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2025-07-22",
    "last_updated": "2026-02-19",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.5,
      "output": 1.2
    },
    "limit": {
      "context": 256000,
      "output": 256000
    }
  },
  "alibaba/qwen3.5-plus": {
    "id": "alibaba/qwen3.5-plus",
    "name": "Qwen 3.5 Plus",
    "family": "qwen",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-16",
    "last_updated": "2026-02-19",
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
      "input": 0.4,
      "output": 2.4,
      "cache_read": 0.04,
      "cache_write": 0.5
    },
    "limit": {
      "context": 1000000,
      "output": 64000
    }
  },
  "deepseek/deepseek-v3.2-thinking": {
    "id": "deepseek/deepseek-v3.2-thinking",
    "name": "DeepSeek V3.2 Thinking",
    "family": "deepseek-thinking",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-07",
    "release_date": "2025-12-01",
    "last_updated": "2025-12-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "interleaved": true,
    "cost": {
      "input": 0.28,
      "output": 0.42,
      "cache_read": 0.03
    },
    "limit": {
      "context": 128000,
      "output": 64000
    }
  },
  "deepseek/deepseek-v3.2": {
    "id": "deepseek/deepseek-v3.2",
    "name": "DeepSeek V3.2",
    "family": "deepseek",
    "attachment": false,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "knowledge": "2024-07",
    "release_date": "2025-12-01",
    "last_updated": "2025-12-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.27,
      "output": 0.4,
      "cache_read": 0.22
    },
    "limit": {
      "context": 163842,
      "output": 8000
    }
  },
  "arcee-ai/trinity-mini": {
    "id": "arcee-ai/trinity-mini",
    "name": "Trinity Mini",
    "family": "trinity",
    "attachment": false,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12",
    "last_updated": "2025-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.05,
      "output": 0.15
    },
    "limit": {
      "context": 131072,
      "output": 131072
    }
  },
  "zai/glm-4.7": {
    "id": "zai/glm-4.7",
    "name": "GLM 4.7",
    "family": "glm",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12-22",
    "last_updated": "2025-12-22",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "interleaved": true,
    "cost": {
      "input": 0.43,
      "output": 1.75,
      "cache_read": 0.08
    },
    "limit": {
      "context": 202752,
      "output": 120000
    }
  },
  "zai/glm-5": {
    "id": "zai/glm-5",
    "name": "GLM-5",
    "family": "glm",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-12",
    "last_updated": "2026-02-19",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": true,
    "cost": {
      "input": 1,
      "output": 3.2,
      "cache_read": 0.2
    },
    "limit": {
      "context": 202800,
      "output": 131072
    }
  },
  "prime-intellect/intellect-3": {
    "id": "prime-intellect/intellect-3",
    "name": "INTELLECT 3",
    "family": "intellect",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-11-26",
    "last_updated": "2025-11-26",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.2,
      "output": 1.1
    },
    "limit": {
      "context": 131072,
      "output": 131072
    }
  },
  "xai/grok-imagine-image": {
    "id": "xai/grok-imagine-image",
    "name": "Grok Imagine Image",
    "family": "grok",
    "attachment": false,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "release_date": "2026-01-28",
    "last_updated": "2026-02-19",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "open_weights": false,
    "limit": {
      "context": 0,
      "output": 0
    }
  },
  "xai/grok-imagine-image-pro": {
    "id": "xai/grok-imagine-image-pro",
    "name": "Grok Imagine Image Pro",
    "family": "grok",
    "attachment": false,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "release_date": "2026-01-28",
    "last_updated": "2026-02-19",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "open_weights": false,
    "limit": {
      "context": 0,
      "output": 0
    }
  },
  "openai/gpt-5.3-codex": {
    "id": "openai/gpt-5.3-codex",
    "name": "GPT 5.3 Codex",
    "family": "gpt",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-24",
    "last_updated": "2026-02-24",
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
  "openai/gpt-5.2-codex": {
    "id": "openai/gpt-5.2-codex",
    "name": "GPT-5.2-Codex",
    "family": "gpt-codex",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12",
    "last_updated": "2025-12",
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
  "mistral/ministral-14b": {
    "id": "mistral/ministral-14b",
    "name": "Ministral 14B",
    "family": "ministral",
    "attachment": true,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12-01",
    "last_updated": "2025-12-01",
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
      "input": 0.2,
      "output": 0.2
    },
    "limit": {
      "context": 256000,
      "output": 256000
    }
  },
  "mistral/devstral-2": {
    "id": "mistral/devstral-2",
    "name": "Devstral 2",
    "family": "devstral",
    "attachment": false,
    "reasoning": false,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12-09",
    "last_updated": "2025-12-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "limit": {
      "context": 256000,
      "output": 256000
    }
  },
  "mistral/mistral-large-3": {
    "id": "mistral/mistral-large-3",
    "name": "Mistral Large 3",
    "family": "mistral-large",
    "attachment": true,
    "reasoning": false,
    "tool_call": false,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12-02",
    "last_updated": "2025-12-02",
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
      "input": 0.5,
      "output": 1.5
    },
    "limit": {
      "context": 256000,
      "output": 256000
    }
  },
  "minimax/minimax-m2": {
    "id": "minimax/minimax-m2",
    "name": "MiniMax M2",
    "family": "minimax",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-10-27",
    "last_updated": "2025-10-27",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": true,
    "interleaved": true,
    "cost": {
      "input": 0.27,
      "output": 1.15,
      "cache_read": 0.03,
      "cache_write": 0.38
    },
    "limit": {
      "context": 262114,
      "output": 262114
    }
  },
  "minimax/minimax-m2.5": {
    "id": "minimax/minimax-m2.5",
    "name": "MiniMax M2.5",
    "family": "minimax",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-12",
    "last_updated": "2026-02-19",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.3,
      "output": 1.2,
      "cache_read": 0.03,
      "cache_write": 0.375
    },
    "limit": {
      "context": 204800,
      "output": 131000
    }
  },
  "google/gemini-3.1-pro-preview": {
    "id": "google/gemini-3.1-pro-preview",
    "name": "Gemini 3.1 Pro Preview",
    "family": "gemini",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "release_date": "2026-02-19",
    "last_updated": "2026-02-24",
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
      "input": 2,
      "output": 12,
      "cache_read": 0.2
    },
    "limit": {
      "context": 1000000,
      "output": 64000
    }
  },
  "google/gemini-3-pro-preview": {
    "id": "google/gemini-3-pro-preview",
    "name": "Gemini 3 Pro Preview",
    "family": "gemini-pro",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-01",
    "release_date": "2025-11-18",
    "last_updated": "2025-11-18",
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 2,
      "output": 12,
      "cache_read": 0.2,
      "context_over_200k": {
        "input": 4,
        "output": 18,
        "cache_read": 0.4
      }
    },
    "limit": {
      "context": 1000000,
      "output": 64000
    }
  },
  "google/gemini-3.1-flash-image-preview": {
    "id": "google/gemini-3.1-flash-image-preview",
    "name": "Gemini 3.1 Flash Image Preview (Nano Banana 2)",
    "family": "gemini",
    "attachment": true,
    "reasoning": true,
    "tool_call": false,
    "temperature": true,
    "release_date": "2026-02-26",
    "last_updated": "2026-03-06",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.5,
      "output": 3
    },
    "limit": {
      "context": 131072,
      "output": 32768
    }
  },
  "google/gemini-3-flash": {
    "id": "google/gemini-3-flash",
    "name": "Gemini 3 Flash",
    "family": "gemini-flash",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-03",
    "release_date": "2025-12-17",
    "last_updated": "2025-12-17",
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
      "input": 0.5,
      "output": 3,
      "cache_read": 0.05
    },
    "limit": {
      "context": 1000000,
      "output": 64000
    }
  },
  "moonshotai/kimi-k2.5": {
    "id": "moonshotai/kimi-k2.5",
    "name": "Kimi K2.5",
    "family": "kimi",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-01",
    "release_date": "2026-01-26",
    "last_updated": "2026-01-26",
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": true,
    "interleaved": true,
    "cost": {
      "input": 0.6,
      "output": 1.2
    },
    "limit": {
      "context": 262144,
      "output": 262144
    }
  },
  "moonshotai/kimi-k2-thinking-turbo": {
    "id": "moonshotai/kimi-k2-thinking-turbo",
    "name": "Kimi K2 Thinking Turbo",
    "family": "kimi-thinking",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-08",
    "release_date": "2025-11-06",
    "last_updated": "2025-11-06",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "interleaved": true,
    "cost": {
      "input": 1.15,
      "output": 8,
      "cache_read": 0.15
    },
    "limit": {
      "context": 262114,
      "output": 262114
    }
  },
  "moonshotai/kimi-k2-thinking": {
    "id": "moonshotai/kimi-k2-thinking",
    "name": "Kimi K2 Thinking",
    "family": "kimi-thinking",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-08",
    "release_date": "2025-11-06",
    "last_updated": "2025-11-06",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "interleaved": true,
    "cost": {
      "input": 0.47,
      "output": 2,
      "cache_read": 0.14
    },
    "limit": {
      "context": 216144,
      "output": 216144
    }
  },
  "anthropic/claude-opus-4.6": {
    "id": "anthropic/claude-opus-4.6",
    "name": "Claude Opus 4.6",
    "family": "claude-opus",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-05-31",
    "release_date": "2026-02",
    "last_updated": "2026-02",
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
    "interleaved": true,
    "cost": {
      "input": 5,
      "output": 25,
      "cache_read": 0.5,
      "cache_write": 6.25
    },
    "limit": {
      "context": 1000000,
      "output": 128000
    }
  },
  "anthropic/claude-opus-4.5": {
    "id": "anthropic/claude-opus-4.5",
    "name": "Claude Opus 4.5",
    "family": "claude-opus",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-03-31",
    "release_date": "2025-11-24",
    "last_updated": "2025-11-24",
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
    "interleaved": true,
    "cost": {
      "input": 5,
      "output": 25,
      "cache_read": 0.5,
      "cache_write": 18.75
    },
    "limit": {
      "context": 200000,
      "output": 64000
    }
  },
  "anthropic/claude-sonnet-4.6": {
    "id": "anthropic/claude-sonnet-4.6",
    "name": "Claude Sonnet 4.6",
    "family": "claude-sonnet",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2025-08-31",
    "release_date": "2026-02-17",
    "last_updated": "2026-02-17",
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
    "interleaved": true,
    "cost": {
      "input": 3,
      "output": 15,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context_over_200k": {
        "input": 6,
        "output": 22.5,
        "cache_read": 0.6,
        "cache_write": 7.5
      }
    },
    "limit": {
      "context": 1000000,
      "output": 128000
    }
  },
  "xiaomi/mimo-v2-flash": {
    "id": "xiaomi/mimo-v2-flash",
    "name": "MiMo V2 Flash",
    "family": "mimo",
    "attachment": false,
    "reasoning": true,
    "tool_call": true,
    "temperature": true,
    "knowledge": "2024-10",
    "release_date": "2025-12-17",
    "last_updated": "2025-12-17",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.1,
      "output": 0.29
    },
    "limit": {
      "context": 262144,
      "output": 32000
    }
  }
} as const satisfies Record<VercelModelId, ModelSpec>;
