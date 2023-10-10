// Compression Middleware -----------------------------------------
const compression = require('express-compression')
// https://tools.keycdn.com/brotli-test


module.exports = compression({
    // filter: compress/don't compress
    filter: (req, res) => {
        // don't compress responses with this request header
        if (req.headers['x-no-compression']) {
            return false
        }
        // fallback to standard filter function
        // return compression.filter(req, res)
        return true;
    },
    // use Brotli compression
    brotli: {
        enabled: true,
        zlib: {}
    }
});
