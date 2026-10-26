/** A user referenced by a Person cell; no email, viewers may be outside the workspace. */
export interface DatabasePerson {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface DatabasePeopleReader {
  findByDatabaseId(databaseId: string): Promise<DatabasePerson[]>;
}
