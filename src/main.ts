import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  const port = configService.get('APP_PORT');
  console.log('port : ', port);
  await app.listen(port);
  console.log(`AI EMAIL GENERATOR running on: ${await app.getUrl()}`);
}
bootstrap();
