import type { ToolModule } from '../core/types';
import { aesModule } from './aes/module';
import { base64Module } from './base64/module';
import { docsModule } from './docs/module';
import { quotationsModule } from './quotations/module';
import { timesheetModule } from './timesheet/module';

export const MODULES: readonly ToolModule[] = [timesheetModule, quotationsModule, aesModule, base64Module, docsModule];
