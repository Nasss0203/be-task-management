import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import type {
  DatabasePeopleReader,
  DatabasePerson,
} from '../../ports/database-people-reader.port';

@Injectable()
export class GetDatabasePeopleHandler {
  constructor(
    @Inject(DATABASE_TYPES.ports.DatabasePeopleReader)
    private readonly peopleReader: DatabasePeopleReader,
  ) {}

  execute(databaseId: string): Promise<DatabasePerson[]> {
    return this.peopleReader.findByDatabaseId(databaseId);
  }
}
