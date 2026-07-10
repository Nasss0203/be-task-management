import { Schema, Type } from '@google/genai';

/**
 * Default Gemini model dùng cho AI Task Draft.
 * Chọn gemini-2.5-flash để tối ưu chi phí và tốc độ phản hồi.
 * Có thể nâng cấp sang gemini-3.5-flash cho các tác vụ reasoning/planning phức tạp hơn.
 * Có thể override qua biến môi trường GEMINI_MODEL.
 */
export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';

export const GEMINI_TASK_DRAFT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ['tasks'],
  properties: {
    tasks: {
      type: Type.ARRAY,
      description: 'Danh sach cac Task can tao.',
      items: {
        type: Type.OBJECT,
        required: [
          'title',
          'description',
          'priority',
          'estimatedHours',
          'subtasks',
          'acceptanceCriteria',
          'risks',
        ],
        properties: {
          title: {
            type: Type.STRING,
            description: 'Ten ngan gon cua ban nhap Task.',
          },
          description: {
            type: Type.STRING,
            description: 'Mo ta bang tieng Viet cho ban nhap Task.',
          },
          priority: {
            type: Type.STRING,
            format: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          },
          estimatedHours: {
            type: Type.INTEGER,
          },
          subtasks: {
            type: Type.ARRAY,
            description: 'Cac buoc thuc hien nho hon cho task nay.',
            items: {
              type: Type.OBJECT,
              required: ['title', 'description', 'estimatedHours'],
              properties: {
                title: {
                  type: Type.STRING,
                },
                description: {
                  type: Type.STRING,
                },
                estimatedHours: {
                  type: Type.INTEGER,
                },
              },
            },
          },
          acceptanceCriteria: {
            type: Type.ARRAY,
            description: 'Tieu chi nghiem thu cho task.',
            items: {
              type: Type.STRING,
            },
          },
          risks: {
            type: Type.ARRAY,
            description: 'Cac rui ro tiem an cua task.',
            items: {
              type: Type.STRING,
            },
          },
        },
      },
    },
  },
};


export const GEMINI_WORKSPACE_DRAFT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ['name', 'slug'],
  propertyOrdering: ['name', 'slug'],
  properties: {
    name: {
      type: Type.STRING,
      minLength: '2',
      maxLength: '180',
      description: 'Ten cua Workspace moi.',
    },
    slug: {
      type: Type.STRING,
      minLength: '2',
      maxLength: '50',
      description:
        'Đuong dan url slug viet thuong, chi chua chu, so va dau gach ngang.',
    },
  },
};

export const GEMINI_PROJECT_DRAFT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ['name', 'key', 'visibility', 'description'],
  propertyOrdering: ['name', 'key', 'visibility', 'description', 'tasks'],
  properties: {
    name: {
      type: Type.STRING,
      minLength: '2',
      maxLength: '180',
      description: 'Ten cua Project moi.',
    },
    key: {
      type: Type.STRING,
      minLength: '2',
      maxLength: '10',
      description: 'Ma viet tat Project viet hoa (vi du: API, UI, TASK).',
    },
    visibility: {
      type: Type.STRING,
      format: 'enum',
      enum: ['PRIVATE', 'INTERNAL'],
      description: 'Che do hien thi cua Project (PRIVATE hoac INTERNAL).',
    },
    description: {
      type: Type.STRING,
      minLength: '10',
      maxLength: '1000',
      description: 'Mo ta ngan gon ve Project.',
    },
    tasks: {
      type: Type.ARRAY,
      description: 'Danh sach cac Task thuoc Project nay (neu co).',
      items: {
        type: Type.OBJECT,
        required: ['title', 'description', 'priority', 'estimatedHours'],
        properties: {
          title: {
            type: Type.STRING,
            description: 'Ten ngan gon cua ban nhap Task.',
          },
          description: {
            type: Type.STRING,
            description: 'Mo ta chi tiet cho Task.',
          },
          priority: {
            type: Type.STRING,
            format: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          },
          estimatedHours: {
            type: Type.INTEGER,
          },
        },
      },
    },
  },
};

export const GEMINI_WORKSPACE_TREE_DRAFT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ['workspaces'],
  properties: {
    workspaces: {
      type: Type.ARRAY,
      description: 'Danh sach cac Workspace can tao.',
      items: {
        type: Type.OBJECT,
        required: ['name', 'slug', 'projects'],
        properties: {
          name: {
            type: Type.STRING,
            description: 'Ten cua Workspace moi.',
          },
          slug: {
            type: Type.STRING,
            description: 'Đuong dan url slug viet thuong, chi chua chu, so va dau gach ngang.',
          },
          projects: {
            type: Type.ARRAY,
            description: 'Danh sach cac Project thuoc Workspace nay.',
            items: {
              type: Type.OBJECT,
              required: ['name', 'key', 'visibility', 'description', 'tasks'],
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Ten cua Project moi.',
                },
                key: {
                  type: Type.STRING,
                  description: 'Ma viet tat Project viet hoa (vi du: API, UI, TASK).',
                },
                visibility: {
                  type: Type.STRING,
                  format: 'enum',
                  enum: ['PRIVATE', 'INTERNAL'],
                  description: 'Che do hien thi cua Project (PRIVATE hoac INTERNAL).',
                },
                description: {
                  type: Type.STRING,
                  description: 'Mo ta ngan gon ve Project.',
                },
                tasks: {
                  type: Type.ARRAY,
                  description: 'Danh sach cac Task thuoc Project nay.',
                  items: {
                    type: Type.OBJECT,
                    required: ['title', 'description', 'priority', 'estimatedHours'],
                    properties: {
                      title: {
                        type: Type.STRING,
                        description: 'Ten ngan gon cua ban nhap Task.',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Mo ta chi tiet cho Task.',
                      },
                      priority: {
                        type: Type.STRING,
                        format: 'enum',
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                      },
                      estimatedHours: {
                        type: Type.INTEGER,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const GEMINI_SUBTASK_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ['subtasks'],
  properties: {
    subtasks: {
      type: Type.ARRAY,
      description: 'Danh sach tieu de cac tac vu con (subtasks) de hoan thanh cong viec.',
      items: {
        type: Type.STRING,
      },
    },
  },
};



