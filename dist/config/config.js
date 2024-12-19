"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    jwt: {
        secret: process.env.JWT_SECRET || 'SECRET_KEY',
        expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
    },
});
//# sourceMappingURL=config.js.map