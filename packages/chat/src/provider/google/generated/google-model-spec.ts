
  import type { ModelSpec } from '../../model-spec';
  import type { GoogleAiModelId } from '../google-models';

  export const googleModelSpec = {
  "gemini-3-pro-preview": {
    "id": "gemini-3-pro-preview",
    "name": "Gemini 3 Pro Preview",
    "family": "gemini-pro",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
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
  "gemini-2.5-flash": {
    "id": "gemini-2.5-flash",
    "name": "Gemini 2.5 Flash",
    "family": "gemini-flash",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2025-01",
    "release_date": "2025-03-20",
    "last_updated": "2025-06-05",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 0.3,
      "output": 2.5,
      "cache_read": 0.075,
      "input_audio": 1
    },
    "limit": {
      "context": 1048576,
      "output": 65536
    }
  },
  "gemini-2.5-flash-lite": {
    "id": "gemini-2.5-flash-lite",
    "name": "Gemini 2.5 Flash Lite",
    "family": "gemini-flash-lite",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2025-01",
    "release_date": "2025-06-17",
    "last_updated": "2025-06-17",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
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
      "cache_read": 0.025
    },
    "limit": {
      "context": 1048576,
      "output": 65536
    }
  },
  "gemini-2.5-pro": {
    "id": "gemini-2.5-pro",
    "name": "Gemini 2.5 Pro",
    "family": "gemini-pro",
    "attachment": true,
    "reasoning": true,
    "tool_call": true,
    "structured_output": true,
    "temperature": true,
    "knowledge": "2025-01",
    "release_date": "2025-03-20",
    "last_updated": "2025-06-05",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "open_weights": false,
    "cost": {
      "input": 1.25,
      "output": 10,
      "cache_read": 0.31
    },
    "limit": {
      "context": 1048576,
      "output": 65536
    }
  }
} as const satisfies Record<GoogleAiModelId, ModelSpec>;