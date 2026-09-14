import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = Number(process.env.DB_PORT) || 1433;
    const dbName = process.env.DB_NAME || 'transformc_db';
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;

    if (!dbUser || !dbPassword) {
      throw new Error(
        'Configuración crítica ausente: Se deben definir DB_USER y DB_PASSWORD en el archivo .env o en las variables de entorno.',
      );
    }

    const adapter = new PrismaMssql({
      server: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
