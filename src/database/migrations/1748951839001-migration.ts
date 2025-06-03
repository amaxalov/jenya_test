import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748951839001 implements MigrationInterface {
  name = 'Migration1748951839001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_context" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "messages" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09d133925c2f37b0edd221cd3ce" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "chat_context"`);
  }
}
