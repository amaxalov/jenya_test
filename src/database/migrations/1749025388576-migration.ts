import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749025388576 implements MigrationInterface {
  name = 'Migration1749025388576';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat" ("id" SERIAL NOT NULL, "messages" jsonb NOT NULL, "taskContext" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "userContext" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_52af74c7484586ef4bdfd8e4dbb" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_52af74c7484586ef4bdfd8e4dbb"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "userContext"`);
    await queryRunner.query(`DROP TABLE "chat"`);
  }
}
