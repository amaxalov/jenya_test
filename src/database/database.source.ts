import { DataSource } from 'typeorm';

export const databaseSource = {
  type: 'postgres',
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
