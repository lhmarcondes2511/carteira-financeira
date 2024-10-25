import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                    return typeof value === 'string' && regex.test(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character`;
                },
            },
        });
    };
}

export function IsPositiveNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPositiveNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return typeof value === 'number' && value > 0;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a positive number`;
                },
            },
        });
    };
}