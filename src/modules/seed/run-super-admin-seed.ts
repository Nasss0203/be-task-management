import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SuperAdminSeedService } from './super-admin.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedService = app.get(SuperAdminSeedService);
    await seedService.seed();
    console.log('Super admin seed success');
  } catch (error) {
    console.error('Super admin seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
