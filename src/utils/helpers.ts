export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
}

export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function removeSpecialCharacters(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, '');
}

export function isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    const digits = cpf.split('').map(x => parseInt(x));
    for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let i = 0; i < 9 + j; i++) {
            sum += digits[i] * (10 + j - i);
        }
        let checkDigit = 11 - (sum % 11);
        if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
        if (checkDigit !== digits[9 + j]) return false;
    }
    return true;
}