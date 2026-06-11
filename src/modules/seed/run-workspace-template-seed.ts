import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { WorkspaceTemplate } from 'src/modules/workspace_templates/domain/entities/workspace_template.entity';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { PageTemplate } from 'src/modules/page_templates/domain/entities/page_template.entity';
import { PageTemplateBlock } from 'src/modules/page_template_blocks/domain/entities/page_template_block.entity';
import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const workspaceTemplateRepo = dataSource.getRepository(WorkspaceTemplate);
  const pageTemplateRepo = dataSource.getRepository(PageTemplate);
  const pageTemplateBlockRepo = dataSource.getRepository(PageTemplateBlock);

  // First, let's define the page templates and their blocks
  const pageTemplatesData = [
    {
      name: 'Software Development Dashboard',
      description: 'Default dashboard for software engineering teams',
      isSystem: true,
      blocks: [
        { type: 'HEADING_1', content: { text: '🚀 Welcome to Software Engineering' }, orderIndex: 1 },
        { type: 'TEXT', content: { text: 'Here is your sprint board and backlog. Keep up the good work!' }, orderIndex: 2 },
        { type: 'DIVIDER', content: {}, orderIndex: 3 },
        { type: 'HEADING_2', content: { text: 'Frontend' }, orderIndex: 4 },
        { type: 'DATABASE_VIEW', content: { boardTemplateKey: 'fe-board', title: 'Frontend Sprint' }, orderIndex: 5 },
        { type: 'HEADING_2', content: { text: 'Backend' }, orderIndex: 6 },
        { type: 'DATABASE_VIEW', content: { boardTemplateKey: 'be-board', title: 'Backend Sprint' }, orderIndex: 7 },
      ]
    },
    {
      name: 'Content Marketing Dashboard',
      description: 'Default dashboard for marketing campaigns',
      isSystem: true,
      blocks: [
        { type: 'HEADING_1', content: { text: '📢 Marketing Campaigns' }, orderIndex: 1 },
        { type: 'TEXT', content: { text: 'Manage all your content in one place.' }, orderIndex: 2 },
        { type: 'DATABASE_VIEW', content: { boardTemplateKey: 'kanban', title: 'Kanban View' }, orderIndex: 3 },
        { type: 'DATABASE_VIEW', content: { boardTemplateKey: 'calendar', title: 'Calendar View' }, orderIndex: 4 },
      ]
    },
    {
      name: 'Blank Dashboard',
      description: 'A clean slate to build your own workspace.',
      isSystem: true,
      blocks: [
        { type: 'HEADING_1', content: { text: 'Welcome to your workspace' }, orderIndex: 1 },
        { type: 'TEXT', content: { text: 'Start adding boards, views, and pages here.' }, orderIndex: 2 },
      ]
    },
    {
      name: 'Personal Tasks Dashboard',
      description: 'Simple layout for personal productivity.',
      isSystem: true,
      blocks: [
        { type: 'HEADING_1', content: { text: 'My Tasks' }, orderIndex: 1 },
        { type: 'DATABASE_VIEW', content: { boardTemplateKey: 'main-board', title: 'Task List' }, orderIndex: 2 },
      ]
    }
  ];

  const pageTemplateIds = {};

  for (const ptData of pageTemplatesData) {
    let pt = await pageTemplateRepo.findOne({ where: { name: ptData.name } });
    if (!pt) {
      pt = await pageTemplateRepo.save(pageTemplateRepo.create({
        name: ptData.name,
        description: ptData.description,
        isSystem: ptData.isSystem,
        status: TemplateStatus.PUBLISHED,
        visibility: TemplateVisibility.PUBLIC,
      }));
      
      const blocks = ptData.blocks.map(b => pageTemplateBlockRepo.create({
        templateId: pt!.id,
        type: b.type as any,
        content: b.content,
        orderIndex: b.orderIndex,
      }));
      await pageTemplateBlockRepo.save(blocks);
      console.log(`Seeded page template: ${pt!.name}`);
    } else {
      let updated = false;
      if (pt.status !== TemplateStatus.PUBLISHED) {
        pt.status = TemplateStatus.PUBLISHED;
        updated = true;
      }
      if (pt.visibility !== TemplateVisibility.PUBLIC) {
        pt.visibility = TemplateVisibility.PUBLIC;
        updated = true;
      }
      if (updated) {
        await pageTemplateRepo.save(pt);
        console.log(`Updated page template status/visibility: ${pt.name}`);
      } else {
        console.log(`Page template already exists: ${pt.name}`);
      }
    }
    pageTemplateIds[pt!.name] = pt!.id;
  }

  const templates = [
    {
      name: 'Software Development',
      description: 'Template for software development teams with Backlog, Sprint, and Bug Tracking.',
      category: 'Engineering',
      coverUrl: null,
      isSystem: true,
      pageTemplateId: pageTemplateIds['Software Development Dashboard'],
      status: TemplateStatus.PUBLISHED,
      visibility: TemplateVisibility.PUBLIC,
      config: {
        projects: [
          { templateKey: 'frontend', name: 'Frontend', key: 'FE' },
          { templateKey: 'backend', name: 'Backend', key: 'BE' }
        ],
        boards: [
          { templateKey: 'fe-board', projectTemplateKey: 'frontend', name: 'Sprint Board', viewType: BoardViewType.BOARD },
          { templateKey: 'fe-backlog', projectTemplateKey: 'frontend', name: 'Backlog', viewType: BoardViewType.LIST },
          { templateKey: 'be-board', projectTemplateKey: 'backend', name: 'Sprint Board', viewType: BoardViewType.BOARD },
        ],
        statuses: [
          { projectTemplateKey: 'frontend', name: 'Todo', position: 1, color: '#94A3B8' },
          { projectTemplateKey: 'frontend', name: 'In Progress', position: 2, color: '#3B82F6' },
          { projectTemplateKey: 'frontend', name: 'Done', position: 3, color: '#22C55E' },
          { projectTemplateKey: 'backend', name: 'Todo', position: 1, color: '#94A3B8' },
          { projectTemplateKey: 'backend', name: 'In Progress', position: 2, color: '#3B82F6' },
          { projectTemplateKey: 'backend', name: 'Done', position: 3, color: '#22C55E' },
        ],
        priorities: [
          { projectTemplateKey: 'frontend', name: 'Low', level: 1, color: '#94A3B8' },
          { projectTemplateKey: 'frontend', name: 'High', level: 3, color: '#F59E0B' },
          { projectTemplateKey: 'backend', name: 'Low', level: 1, color: '#94A3B8' },
          { projectTemplateKey: 'backend', name: 'High', level: 3, color: '#F59E0B' },
        ],
        tasks: [
          { projectTemplateKey: 'frontend', title: 'Setup React Project', statusName: 'Done', priorityName: 'High', estimateMinutes: 120 },
          { projectTemplateKey: 'frontend', title: 'Implement Login UI', statusName: 'Todo', priorityName: 'High', estimateMinutes: 240 },
          { projectTemplateKey: 'backend', title: 'Setup NestJS', statusName: 'Done', priorityName: 'High', estimateMinutes: 120 },
          { projectTemplateKey: 'backend', title: 'Implement Auth API', statusName: 'Todo', priorityName: 'High', estimateMinutes: 240 },
        ]
      }
    },
    {
      name: 'Content Calendar',
      description: 'Manage blog posts, social media and content pipeline.',
      category: 'Marketing',
      coverUrl: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=600',
      isSystem: true,
      pageTemplateId: pageTemplateIds['Content Marketing Dashboard'],
      status: TemplateStatus.PUBLISHED,
      visibility: TemplateVisibility.PUBLIC,
      config: {
        projects: [
          { templateKey: 'main', name: 'Content Pipeline', key: 'MKT' },
        ],
        boards: [
          { templateKey: 'kanban', projectTemplateKey: 'main', name: 'Board View', viewType: BoardViewType.BOARD },
          { templateKey: 'calendar', projectTemplateKey: 'main', name: 'Calendar View', viewType: BoardViewType.CALENDAR },
        ],
        statuses: [
          { projectTemplateKey: 'main', name: 'Todo', position: 1, color: '#94A3B8' },
          { projectTemplateKey: 'main', name: 'In Progress', position: 2, color: '#3B82F6' },
          { projectTemplateKey: 'main', name: 'Done', position: 3, color: '#22C55E' },
        ],
        priorities: [
          { projectTemplateKey: 'main', name: 'Low', level: 1, color: '#94A3B8' },
          { projectTemplateKey: 'main', name: 'High', level: 3, color: '#EF4444' },
        ],
        tasks: [
          { projectTemplateKey: 'main', title: 'Write Q3 Marketing Plan', statusName: 'In Progress', priorityName: 'High', estimateMinutes: 600 },
        ]
      }
    },
    {
      name: 'Blank Workspace',
      description: 'Start from scratch with a completely blank workspace to customize exactly how you want.',
      category: 'General',
      coverUrl: null,
      isSystem: true,
      pageTemplateId: pageTemplateIds['Blank Dashboard'],
      status: TemplateStatus.PUBLISHED,
      visibility: TemplateVisibility.PUBLIC,
      config: {
        projects: [
          { templateKey: 'general', name: 'General', key: 'GEN' },
        ],
        boards: [
          { templateKey: 'main-board', projectTemplateKey: 'general', name: 'Main Board', viewType: BoardViewType.BOARD },
        ],
        statuses: [
          { projectTemplateKey: 'general', name: 'Todo', position: 1, color: '#94A3B8' },
          { projectTemplateKey: 'general', name: 'In Progress', position: 2, color: '#3B82F6' },
          { projectTemplateKey: 'general', name: 'Done', position: 3, color: '#22C55E' },
        ],
        priorities: [
          { projectTemplateKey: 'general', name: 'Low', level: 1, color: '#94A3B8' },
          { projectTemplateKey: 'general', name: 'Medium', level: 2, color: '#F59E0B' },
          { projectTemplateKey: 'general', name: 'High', level: 3, color: '#EF4444' },
        ],
        tasks: []
      }
    },
    {
      name: 'Personal Task Management',
      description: 'A lightweight workspace optimized for individual productivity and daily task tracking.',
      category: 'Productivity',
      coverUrl: null,
      isSystem: true,
      pageTemplateId: pageTemplateIds['Personal Tasks Dashboard'],
      status: TemplateStatus.PUBLISHED,
      visibility: TemplateVisibility.PUBLIC,
      config: {
        projects: [
          { templateKey: 'personal', name: 'My Tasks', key: 'ME' },
        ],
        boards: [
          { templateKey: 'main-board', projectTemplateKey: 'personal', name: 'To-do List', viewType: BoardViewType.LIST },
          { templateKey: 'calendar', projectTemplateKey: 'personal', name: 'Calendar', viewType: BoardViewType.CALENDAR },
        ],
        statuses: [
          { projectTemplateKey: 'personal', name: 'Todo', position: 1, color: '#94A3B8' },
          { projectTemplateKey: 'personal', name: 'In Progress', position: 2, color: '#3B82F6' },
          { projectTemplateKey: 'personal', name: 'Done', position: 3, color: '#22C55E' },
        ],
        priorities: [
          { projectTemplateKey: 'personal', name: 'Normal', level: 1, color: '#94A3B8' },
          { projectTemplateKey: 'personal', name: 'Urgent', level: 3, color: '#EF4444' },
        ],
        tasks: [
          { projectTemplateKey: 'personal', title: 'Plan the week', statusName: 'Todo', priorityName: 'Normal', estimateMinutes: 30 },
        ]
      }
    }
  ];

  for (const t of templates) {
    const existing = await workspaceTemplateRepo.findOne({ where: { name: t.name } });
    if (!existing) {
      await workspaceTemplateRepo.save(workspaceTemplateRepo.create(t as any));
      console.log(`Seeded workspace template: ${t.name}`);
    } else {
      // Update pageTemplateId, status/visibility, and config if needed
      let updated = false;
      if (!existing.pageTemplateId) {
        existing.pageTemplateId = t.pageTemplateId;
        updated = true;
      }
      if (existing.status !== t.status) {
        existing.status = t.status;
        updated = true;
      }
      if (existing.visibility !== t.visibility) {
        existing.visibility = t.visibility;
        updated = true;
      }
      // Always overwrite config to ensure updates like removing Backlog are applied
      if (JSON.stringify(existing.config) !== JSON.stringify(t.config)) {
        existing.config = t.config as any;
        updated = true;
      }
      
      if (updated) {
        await workspaceTemplateRepo.save(existing);
        console.log(`Updated workspace template fields: ${t.name}`);
      } else {
        console.log(`Template already exists: ${t.name}`);
      }
    }
  }

  await app.close();
}

bootstrap();
