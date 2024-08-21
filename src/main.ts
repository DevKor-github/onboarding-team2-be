import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { errorHandler } from './util/errorHandler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const options = new DocumentBuilder()
    .setTitle('TagTing')
    .setDescription('DevKor onboarding TEAM2 ')
    .setVersion('1.0')
    .addServer(`${process.env.DEV_API_URI}`, 'Dev environment')
    .addServer(`${process.env.PROD_API_URI}`, 'Prod environment')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${process.env.SWAGGER_ENDPOINT}`, app, document);

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['authorization'],
  });

  app.use(errorHandler);

  await app.listen(process.env.PORT);
}
bootstrap();
