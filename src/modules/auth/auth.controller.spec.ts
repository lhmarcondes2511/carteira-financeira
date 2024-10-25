import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let service: AuthService;

    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should call authService.register', async () => {
            const registerDto = {
                username: 'testuser',
                password: 'Test@123',
            };
            const expectedResult = { access_token: 'token' };

            mockAuthService.register.mockResolvedValue(expectedResult);

            const result = await controller.register(registerDto);

            expect(result).toBe(expectedResult);
            expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
        });
    });

    describe('login', () => {
        it('should call authService.login', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'Test@123',
            };
            const expectedResult = { access_token: 'token' };

            mockAuthService.login.mockResolvedValue(expectedResult);

            const result = await controller.login(loginDto);

            expect(result).toBe(expectedResult);
            expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
        });
    });
});