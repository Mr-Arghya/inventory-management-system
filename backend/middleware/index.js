const AuthMiddleware = require('./auth/auth.middleware');
const UserMiddleware = require('./user.middleware');
const CategoryMiddleware = require('./category.middleware');
const Formatter = require('./filter-format.middleware');

module.exports = {
    AuthMiddleware,
    UserMiddleware,
    CategoryMiddleware,
    Formatter
}