import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

import type { PreparedTemplateSnapshot } from './template-version-content-snapshot.service';

@Injectable()
export class TemplateSnapshotFingerprintService {
  compute(snapshot: PreparedTemplateSnapshot): string {
    // Match factory defaults and trimming. Keep live identities needed for
    // hierarchy and references; persistence identities never enter this input.
    const semanticSnapshot = {
      blocks: snapshot.blocks.map((block) => ({
        sourceId: block.sourceId,
        parentSourceId: block.parentSourceId || null,
        type: block.type,
        title: block.title ?? null,
        positionX: block.positionX ?? null,
        positionY: block.positionY ?? null,
        width: block.width ?? null,
        height: block.height ?? null,
        orderIndex: block.orderIndex ?? 0,
        content: block.content ?? null,
        styleConfig: block.styleConfig ?? null,
        dataConfig: block.dataConfig ?? null,
        isOpen: block.isOpen ?? true,
      })),
      databases: snapshot.databases.map((snapshot) => ({
        sourceId: snapshot.database.id,
        name: snapshot.database.name.trim(),
        properties: snapshot.properties.map((property) => ({
          sourceId: property.id,
          name: property.name.trim(),
          type: property.type,
          isDefault: property.isDefault ?? false,
          isHideable: property.isHideable ?? true,
          position: property.position.trim(),
          options: property.options.map((option) => ({
            sourceId: option.id,
            name: option.name.trim(),
            color: option.color ?? null,
            position: option.position.trim(),
          })),
        })),
        rows: snapshot.rows.map((row) => ({
          values: row.values.map((value) => ({
            propertyId: value.propertyId,
            value: value.value,
          })),
        })),
        views: snapshot.views.map((view) => ({
          sourceId: view.id,
          name: view.name.trim(),
          type: view.type,
          position: view.position.trim(),
          properties: view.properties.map((property) => ({
            propertyId: property.propertyId,
            position: property.position.trim(),
            visible: property.visible ?? true,
            width: property.width ?? null,
          })),
        })),
      })),
    };

    return createHash('sha256')
      .update(this.canonicalJson(semanticSnapshot))
      .digest('hex');
  }

  private canonicalJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${Array.from(value, (item: unknown) => this.canonicalJson(item)).join(',')}]`;
    }
    if (value !== null && typeof value === 'object') {
      const object = value as Record<string, unknown>;
      return `{${Object.keys(object)
        .filter((key) => object[key] !== undefined)
        .sort()
        .map(
          (key) => `${JSON.stringify(key)}:${this.canonicalJson(object[key])}`,
        )
        .join(',')}}`;
    }
    // JSONB semantics: missing object keys are omitted; array undefined is null.
    return JSON.stringify(value) ?? 'null';
  }
}
