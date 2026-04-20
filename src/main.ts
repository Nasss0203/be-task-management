import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter/http-exception';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { MyLogger } from './log/my.logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));
  // app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.useLogger(
    new MyLogger({
      appColor: 'bgGray',
      level: 'debug',
      appName: 'Nest Application',
      logDir: 'logs/app',
    }),
  );
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  await app.listen(configService.get<string | any>('PORT'));
}
bootstrap();
