import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1721000000000 implements MigrationInterface {
  name = 'InitialSchema1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE "income_type" AS ENUM ('SALARIO','EXTRA')`);
    await queryRunner.query(`CREATE TYPE "income_recurrence" AS ENUM ('UNICA','MENSAL')`);
    await queryRunner.query(`CREATE TYPE "credit_card_type" AS ENUM ('CREDITO')`);
    await queryRunner.query(
      `CREATE TYPE "bank_connection_status" AS ENUM ('CONECTADO','PENDENTE','ERRO','DESCONECTADO')`,
    );
    await queryRunner.query(`CREATE TYPE "transaction_status" AS ENUM ('PENDENTE','QUALIFICADA')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "senhaHash" varchar(255) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`);
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" varchar(255) NOT NULL, "expiresAt" timestamptz NOT NULL, "revokedAt" timestamptz, "jti" uuid NOT NULL, "replacedByJti" uuid, "createdAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"), CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_refresh_tokens_jti" ON "refresh_tokens" ("jti")`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "nome" varchar(80) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_categories" PRIMARY KEY ("id"), CONSTRAINT "UQ_categories_user_nome" UNIQUE ("userId","nome"), CONSTRAINT "FK_categories_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_categories_user_id" ON "categories" ("userId")`);
    await queryRunner.query(
      `CREATE TABLE "incomes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tipo" "income_type" NOT NULL, "nome" varchar(120) NOT NULL, "valor" numeric(14,2) NOT NULL, "recorrencia" "income_recurrence" NOT NULL, "dataRecebimento" date NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_incomes" PRIMARY KEY ("id"), CONSTRAINT "CHK_incomes_valor_positive" CHECK ("valor" > 0), CONSTRAINT "FK_incomes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incomes_user_data_recebimento" ON "incomes" ("userId","dataRecebimento")`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "nome" varchar(80) NOT NULL, "diaFechamento" smallint NOT NULL, "diaVencimento" smallint NOT NULL, "tipo" "credit_card_type" NOT NULL DEFAULT 'CREDITO', "ativo" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_credit_cards" PRIMARY KEY ("id"), CONSTRAINT "CHK_credit_cards_dia_fechamento" CHECK ("diaFechamento" BETWEEN 1 AND 31), CONSTRAINT "CHK_credit_cards_dia_vencimento" CHECK ("diaVencimento" BETWEEN 1 AND 31), CONSTRAINT "FK_credit_cards_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_credit_cards_user_id" ON "credit_cards" ("userId")`);
    await queryRunner.query(
      `CREATE TABLE "fixed_bills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "nome" varchar(120) NOT NULL, "valor" numeric(14,2) NOT NULL, "diaVencimento" smallint NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_fixed_bills" PRIMARY KEY ("id"), CONSTRAINT "CHK_fixed_bills_valor_positive" CHECK ("valor" > 0), CONSTRAINT "CHK_fixed_bills_dia_vencimento" CHECK ("diaVencimento" BETWEEN 1 AND 31), CONSTRAINT "FK_fixed_bills_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_fixed_bills_user_id" ON "fixed_bills" ("userId")`);
    await queryRunner.query(
      `CREATE TABLE "bank_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "pluggyItemId" varchar(255) NOT NULL, "status" "bank_connection_status" NOT NULL DEFAULT 'PENDENTE', "lastSyncAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_bank_connections" PRIMARY KEY ("id"), CONSTRAINT "FK_bank_connections_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bank_connections_user_id" ON "bank_connections" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bank_connections_active_user" ON "bank_connections" ("userId") WHERE "status" <> 'DESCONECTADO'`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bankConnectionId" uuid NOT NULL, "categoriaId" uuid, "creditCardId" uuid, "nomeOriginal" varchar(160) NOT NULL, "descricao" varchar(160), "valor" numeric(14,2) NOT NULL, "data" date NOT NULL, "status" "transaction_status" NOT NULL DEFAULT 'PENDENTE', "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_transactions" PRIMARY KEY ("id"), CONSTRAINT "FK_transactions_bank" FOREIGN KEY ("bankConnectionId") REFERENCES "bank_connections"("id") ON DELETE RESTRICT, CONSTRAINT "FK_transactions_category" FOREIGN KEY ("categoriaId") REFERENCES "categories"("id") ON DELETE RESTRICT, CONSTRAINT "FK_transactions_card" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_bank_data" ON "transactions" ("bankConnectionId","data")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_categoria" ON "transactions" ("categoriaId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "bank_connections"`);
    await queryRunner.query(`DROP TABLE "fixed_bills"`);
    await queryRunner.query(`DROP TABLE "credit_cards"`);
    await queryRunner.query(`DROP TABLE "incomes"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "transaction_status"`);
    await queryRunner.query(`DROP TYPE "bank_connection_status"`);
    await queryRunner.query(`DROP TYPE "credit_card_type"`);
    await queryRunner.query(`DROP TYPE "income_recurrence"`);
    await queryRunner.query(`DROP TYPE "income_type"`);
  }
}
