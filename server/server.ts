import express from 'express';
import { mkdir } from 'fs/promises';
import serveIndex from 'serve-index';
import { getNstDir } from '../cli/utils';

export interface NstrumentaServerOptions {
  apiKey: string;
  port?: string;
  debug?: boolean;
}

export class NstrumentaServer {
  private options: NstrumentaServerOptions;
  private cwd: string;

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    this.cwd = process.cwd();
  }

  public async run() {
    const { debug } = this.options;
    const port = this.options.port ?? 8088;
    
    // Server makes a local .nst folder at the cwd
    // This allows multiple servers and working directories on the same machine
    const cwdNstDir = `${this.cwd}/.nst`;
    await mkdir(cwdNstDir, { recursive: true });

    if (debug) {
      console.log(`nstrumenta working directory: ${cwdNstDir}`);
    }

    const app = express();
    app.set('views', __dirname + '/../..');

    // Serves from npm path for admin page
    app.use(express.static(__dirname + '/../../public'));

    // Serves public subfolder from execution path for serving sandboxes
    const sandboxPath = `${await getNstDir(this.cwd)}/modules`;
    app.use('/modules', express.static(sandboxPath), serveIndex(sandboxPath, { icons: false }));

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
