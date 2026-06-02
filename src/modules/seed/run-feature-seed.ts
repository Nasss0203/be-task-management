import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { FeatureSeedService } from './feature.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedService = app.get(FeatureSeedService);
    await seedService.seed();
  } finally {
    await app.close();
  }
}

bootstrap();
