import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ErrorCode } from './common/constants/error-code.constant';
import { HttpExceptionFilter } from './common/filter/http-exception';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { MyLogger } from './log/my.logger';

function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints || {}),
    ...formatValidationErrors(error.children || []),
  ]);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: formatValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));
  // app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.use(cookieParser());

  const clientUrl =
    configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
  app.enableCors({
    origin: clientUrl,
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
