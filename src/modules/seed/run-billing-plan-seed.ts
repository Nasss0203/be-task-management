import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { BillingPlanSeedService } from './billing-plan.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedService = app.get(BillingPlanSeedService);
    await seedService.seed();
    console.log('Billing plan seed success');
  } catch (error) {
    console.error('Billing plan seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
