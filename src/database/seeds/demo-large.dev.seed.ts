import { DEMO_SEED_KEY } from './demo-seed.constants';

process.env.NODE_ENV = 'development';
process.env.ALLOW_DEMO_SEED = 'true';
process.env.DEMO_SEED_VERSION = process.env.DEMO_SEED_VERSION ?? DEMO_SEED_KEY;
process.env.DEMO_USER_PASSWORD =
  process.env.DEMO_USER_PASSWORD ?? 'DemoPassword123!';

require('./demo-large.seed');
