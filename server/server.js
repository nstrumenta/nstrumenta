"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NstrumentaServer = void 0;
const express_1 = __importDefault(require("express"));
const promises_1 = require("fs/promises");
const serve_index_1 = __importDefault(require("serve-index"));
const utils_1 = require("../cli/utils");
class NstrumentaServer {
    constructor(options) {
        this.options = options;
        this.cwd = process.cwd();
    }
    async run() {
        const { debug } = this.options;
        const port = this.options.port ?? 8088;
        // Server makes a local .nst folder at the cwd
        // This allows multiple servers and working directories on the same machine
        const cwdNstDir = `${this.cwd}/.nst`;
        await (0, promises_1.mkdir)(cwdNstDir, { recursive: true });
        if (debug) {
            console.log(`nstrumenta working directory: ${cwdNstDir}`);
        }
        const app = (0, express_1.default)();
        app.set('views', __dirname + '/../..');
        // Serves from npm path for admin page
        app.use(express_1.default.static(__dirname + '/../../public'));
        // Serves public subfolder from execution path for serving sandboxes
        const sandboxPath = `${await (0, utils_1.getNstDir)(this.cwd)}/modules`;
        app.use('/modules', express_1.default.static(sandboxPath), (0, serve_index_1.default)(sandboxPath, { icons: false }));
        app.get('/health', function (req, res) {
            res.status(200).send('OK');
        });
        const server = app.listen(port, () => {
            console.log(`nstrumenta server listening on port ${port}`);
            console.log(`modules directory: ${sandboxPath}`);
        });
        return server;
    }
}
exports.NstrumentaServer = NstrumentaServer;
//# sourceMappingURL=server.js.map