import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { RbacSeedService } from './rbac.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedService = app.get(RbacSeedService);
    await seedService.seed();
    console.log('RBAC seed success');
  } catch (error) {
    console.error('RBAC seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
