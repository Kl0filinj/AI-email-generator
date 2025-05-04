import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:3050',
      'https://llama-rich-kodiak.ngrok-free.app',
      'https://ai-email-generator-admin-panel.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600,
  });

  const port = configService.get('APP_PORT');
  console.log('port : ', port);
  await app.listen(port);
  console.log(`AI EMAIL GENERATOR running on: ${await app.getUrl()}`);
}
bootstrap();
