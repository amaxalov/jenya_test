import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748951958438 implements MigrationInterface {
  name = 'Migration1748951958438';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_context" RENAME COLUMN "userId" TO "userIdId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_context" ALTER COLUMN "userIdId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_context" ADD CONSTRAINT "FK_6b8de5cdaeffabe261516565ae2" FOREIGN KEY ("userIdId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_context" DROP CONSTRAINT "FK_6b8de5cdaeffabe261516565ae2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_context" ALTER COLUMN "userIdId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_context" RENAME COLUMN "userIdId" TO "userId"`,
    );
  }
}
