import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Auth (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    describe('Authentication', () => {
        const timestamp = Date.now();
        const testUser = {
            username: `testuser_${timestamp}`,
            password: 'Test@123'
        };

        it('should register a new user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
        });

        it('should not register duplicate username', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(409);
        });

        it('should login with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(testUser)
                .expect(200);

            expect(response.body).toHaveProperty('access_token');
        });

        it('should not login with wrong password', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: testUser.username,
                    password: 'wrongpassword'
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
        await app.close();
    });
});