import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { Connection } from 'typeorm';

describe('Auth (e2e)', () => {
    let app: INestApplication;
    let connection: Connection;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));

        connection = moduleFixture.get<Connection>(Connection);
        await app.init();
        await connection.synchronize(true);
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: `testuser_${Date.now()}`,
                    password: 'Test@123'
                })
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
        });

        it('should not register with existing username', async () => {
            const username = `existing_${Date.now()}`;
            
            // Primeiro registro
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username,
                    password: 'Test@123'
                });

            // Tentativa de registro duplicado
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username,
                    password: 'Test@123'
                })
                .expect(409);
        });

        it('should not register with invalid data', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: 'test',
                    password: '123'
                })
                .expect(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully', async () => {
            const username = `logintest_${Date.now()}`;
            const password = 'Test@123';

            // Criar usuário
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ username, password });

            // Tentar login
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ username, password })
                .expect(200);

            expect(response.body).toHaveProperty('access_token');
        });

        it('should not login with wrong password', async () => {
            const username = `wrongpass_${Date.now()}`;
            
            // Criar usuário
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username,
                    password: 'Test@123'
                });

            // Tentar login com senha errada
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username,
                    password: 'wrongpassword'
                })
                .expect(401);
        });

        it('should not login with non-existent username', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'Test@123'
                })
                .expect(401);
        });

        it('should not login with invalid data', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: '',
                    password: ''
                })
                .expect(400);
        });
    });

    afterAll(async () => {
        await connection.close();
        await app.close();
    });
});