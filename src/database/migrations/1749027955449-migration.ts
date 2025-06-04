import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749027955449 implements MigrationInterface {
  name = 'Migration1749027955449';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "chat" SET "step" = 'initial' WHERE "step" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ALTER COLUMN "step" SET DEFAULT 'initial'`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ALTER COLUMN "step" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat" ALTER COLUMN "step" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ALTER COLUMN "step" DROP NOT NULL`,
    );
  }
}
