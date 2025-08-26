import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // use the cookie-parser middleware to parse cookies in incoming requests
  app.use(cookieParser());
  // Enable CORS with credentials support for cross-origin requests from the frontend with cookies enabled
  // so that the browser can send cookies along with requests
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
