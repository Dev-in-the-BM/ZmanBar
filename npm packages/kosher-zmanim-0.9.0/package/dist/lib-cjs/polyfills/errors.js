"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedError = exports.IllegalArgumentException = exports.NullPointerException = void 0;
/* eslint-disable max-classes-per-file */
class BaseCustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class NullPointerException extends BaseCustomError {
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor() {
        super();
    }
}
exports.NullPointerException = NullPointerException;
class IllegalArgumentException extends BaseCustomError {
}
exports.IllegalArgumentException = IllegalArgumentException;
class UnsupportedError extends BaseCustomError {
}
exports.UnsupportedError = UnsupportedError;
//# sourceMappingURL=errors.js.map