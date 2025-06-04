import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749026569102 implements MigrationInterface {
  name = 'Migration1749026569102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat" ADD "step" character varying`);
    await queryRunner.query(`ALTER TABLE "chat" ADD "collectedData" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "collectedData"`);
    await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "step"`);
  }
}
