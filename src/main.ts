import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtGuard } from './auth/guards/jwt.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'SYS:HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
      },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.useGlobalGuards(new JwtGuard(app.get(Reflector)));

  await app.listen(4000, '0.0.0.0');
}

bootstrap()
  .then(() => {
    console.log('Server is running on port 4000');
  })
  .catch(console.error);
