import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export const getDatabaseConfig = (configService: ConfigService) => ({
  type: 'postgres' as const,
  host: configService.get<string>('POSTGRES_HOST'),
  port: 5432,
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_DB'),
  logging: true,
  synchronize: false,
});

export const databaseSource = {
  type: 'postgres' as const,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  logging: true,
  synchronize: false,
} as const;

export default new DataSource({
  ...databaseSource,
  entities: ['src/**/**.entity{.ts,.js}'],
  migrations: ['src/database/migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migration_table',
});
