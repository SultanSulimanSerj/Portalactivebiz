import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Project Portal API',
      description: 'API для управления проектами, документами, финансами и согласованиями',
      version: '1.0.0',
      contact: {
        name: 'Project Portal Support',
        email: 'support@projectportal.com'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'] },
            position: { type: 'string' },
            companyId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            budget: { type: 'number' },
            companyId: { type: 'string' },
            creatorId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            dueDate: { type: 'string', format: 'date' },
            projectId: { type: 'string' },
            creatorId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            fileName: { type: 'string' },
            filePath: { type: 'string' },
            fileSize: { type: 'number' },
            mimeType: { type: 'string' },
            version: { type: 'number' },
            documentNumber: { type: 'string' },
            projectId: { type: 'string' },
            creatorId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Finance: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            description: { type: 'string' },
            amount: { type: 'number' },
            date: { type: 'string', format: 'date' },
            projectId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Вход в систему',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Успешный вход',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Неверные учетные данные',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/projects': {
        get: {
          tags: ['Projects'],
          summary: 'Получить список проектов',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] }
            }
          ],
          responses: {
            '200': {
              description: 'Список проектов',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      projects: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Project' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
        },
        post: {
          tags: ['Projects'],
          summary: 'Создать новый проект',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    budget: { type: 'number' }
                  },
                  required: ['name']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Проект создан',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Project' }
                }
              }
            },
            '400': {
              description: 'Ошибка валидации',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/projects/{id}': {
        get: {
          tags: ['Projects'],
          summary: 'Получить детали проекта',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Детали проекта',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Project' }
                }
              }
            },
            '404': {
              description: 'Проект не найден',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          tags: ['Projects'],
          summary: 'Обновить проект',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    budget: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Проект обновлен',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Project' }
                }
              }
            }
          }
        }
      },
      '/api/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'Получить список задач',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'projectId',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Список задач',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tasks: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Task' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
        },
        post: {
          tags: ['Tasks'],
          summary: 'Создать новую задачу',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                    dueDate: { type: 'string', format: 'date' },
                    projectId: { type: 'string' },
                    assigneeIds: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  },
                  required: ['title', 'projectId']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Задача создана',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Task' }
                }
              }
            }
          }
        }
      },
      '/api/documents': {
        get: {
          tags: ['Documents'],
          summary: 'Получить список документов',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'projectId',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Список документов',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      documents: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Document' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
        }
      },
      '/api/documents/upload': {
        post: {
          tags: ['Documents'],
          summary: 'Загрузить документ',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary'
                    },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    projectId: { type: 'string' }
                  },
                  required: ['file', 'title']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Документ загружен',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Document' }
                }
              }
            }
          }
        }
      },
      '/api/finance': {
        get: {
          tags: ['Finance'],
          summary: 'Получить финансовые данные',
          parameters: [
            {
              name: 'projectId',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] }
            },
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date' }
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date' }
            }
          ],
          responses: {
            '200': {
              description: 'Финансовые данные',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      finances: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Finance' }
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          income: { type: 'number' },
                          expenses: { type: 'number' },
                          profit: { type: 'number' },
                          margin: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
        },
        post: {
          tags: ['Finance'],
          summary: 'Добавить финансовую операцию',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    amount: { type: 'number' },
                    date: { type: 'string', format: 'date' },
                    projectId: { type: 'string' }
                  },
                  required: ['type', 'amount', 'projectId']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Операция добавлена',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Finance' }
                }
              }
            }
          }
        }
      },
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Получить список пользователей',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'role',
              in: 'query',
              schema: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'] }
            }
          ],
          responses: {
            '200': {
              description: 'Список пользователей',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
        },
        post: {
          tags: ['Users'],
          summary: 'Создать нового пользователя',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'] },
                    position: { type: 'string' },
                    password: { type: 'string' }
                  },
                  required: ['name', 'email', 'role', 'password']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Пользователь создан',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      },
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Проверка состояния системы',
          responses: {
            '200': {
              description: 'Система работает',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      uptime: { type: 'number' },
                      database: {
                        type: 'object',
                        properties: {
                          status: { type: 'string' },
                          responseTime: { type: 'number' },
                          healthy: { type: 'boolean' }
                        }
                      },
                      performance: {
                        type: 'object',
                        properties: {
                          averageResponseTime: { type: 'number' },
                          errorRate: { type: 'number' },
                          systemHealth: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json(swaggerDocument)
}
