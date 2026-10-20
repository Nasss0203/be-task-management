import { Injectable } from '@nestjs/common';
import {
  getPagePreset,
  PAGE_PRESET_OPTIONS,
} from 'src/modules/content/application/services/page-presets';

@Injectable()
export class ListPagePresetsHandler {
  execute() {
    return PAGE_PRESET_OPTIONS.map((key) => {
      const preset = getPagePreset(key);
      return { key: preset.key, title: preset.title, icon: preset.icon };
    });
  }
}
