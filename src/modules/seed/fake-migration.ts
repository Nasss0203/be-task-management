import dataSource from '../../database/data-source';

async function run() {
  try {
    await dataSource.initialize();
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        timestamp bigint NOT NULL,
        name varchar NOT NULL
      );
    `);
    // Thử insert để đánh lừa TypeORM rằng file này đã chạy rồi
    await dataSource.query(`
      INSERT INTO migrations (timestamp, name) 
      SELECT 1782034112824, 'InitSchema1782034112824'
      WHERE NOT EXISTS (
        SELECT 1 FROM migrations WHERE timestamp = 1782034112824
      );
    `);
    console.log('Successfully faked InitSchema1782034112824');
  } catch (error) {
    console.error('Error faking migration:', error);
  } finally {
    process.exit(0);
  }
}

run();
