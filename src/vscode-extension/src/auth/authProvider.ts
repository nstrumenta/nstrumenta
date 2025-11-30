import * as vscode from 'vscode';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class AuthProvider {
  private authStatusBarItem: vscode.StatusBarItem;
  private currentUser: UserInfo | null = null;
  private onAuthStateChangedEmitter = new vscode.EventEmitter<UserInfo | null>();
  public readonly onAuthStateChanged = this.onAuthStateChangedEmitter.event;

  constructor(
    private context: vscode.ExtensionContext,
    private config: FirebaseConfig
  ) {
    this.authStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.authStatusBarItem.command = 'nstrumenta.auth.login';
    this.updateStatusBar();
    this.authStatusBarItem.show();
    context.subscriptions.push(this.authStatusBarItem);
  }

  private updateStatusBar() {
    if (this.currentUser) {
      this.authStatusBarItem.text = `$(account) ${this.currentUser.email || 'User'}`;
      this.authStatusBarItem.tooltip = `Logged in as ${this.currentUser.email || this.currentUser.uid}`;
      this.authStatusBarItem.command = 'nstrumenta.auth.logout';
    } else {
      this.authStatusBarItem.text = '$(account) Not logged in';
      this.authStatusBarItem.tooltip = 'Click to log in to Nstrumenta';
      this.authStatusBarItem.command = 'nstrumenta.auth.login';
    }
  }

  async login(): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      const panel = vscode.window.createWebviewPanel(
        'nstrumentaAuth',
        'Nstrumenta Login',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = this.getLoginWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case 'authSuccess':
              const user: UserInfo = {
                uid: message.user.uid,
                email: message.user.email,
                displayName: message.user.displayName,
              };
              const idToken = message.idToken;
              
              this.currentUser = user;
              
              await this.context.secrets.store('nstrumenta.firebase.idToken', idToken);
              await this.context.secrets.store('nstrumenta.user.uid', user.uid);
              await this.context.secrets.store('nstrumenta.user.email', user.email || '');
              
              this.updateStatusBar();
              this.onAuthStateChangedEmitter.fire(user);
              
              panel.dispose();
              vscode.window.showInformationMessage(`Logged in as ${user.email}`);
              resolve(user);
              break;
              
            case 'authError':
              panel.dispose();
              vscode.window.showErrorMessage(`Login failed: ${message.error}`);
              reject(new Error(message.error));
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );
    });
  }

  async logout(): Promise<void> {
    await this.context.secrets.delete('nstrumenta.firebase.idToken');
    await this.context.secrets.delete('nstrumenta.user.uid');
    await this.context.secrets.delete('nstrumenta.user.email');
    
    this.currentUser = null;
    this.updateStatusBar();
    this.onAuthStateChangedEmitter.fire(null);
    
    vscode.window.showInformationMessage('Logged out successfully');
  }

  async getIdToken(): Promise<string | null> {
    return await this.context.secrets.get('nstrumenta.firebase.idToken') || null;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }

  async restoreSession(): Promise<UserInfo | null> {
    const uid = await this.context.secrets.get('nstrumenta.user.uid');
    const email = await this.context.secrets.get('nstrumenta.user.email');
    const idToken = await this.context.secrets.get('nstrumenta.firebase.idToken');

    if (uid && idToken) {
      this.currentUser = {
        uid,
        email: email || null,
        displayName: null,
      };
      this.updateStatusBar();
      this.onAuthStateChangedEmitter.fire(this.currentUser);
      return this.currentUser;
    }

    return null;
  }

  private getLoginWebviewContent(): string {
    const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = this.config;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nstrumenta Login</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input {
            width: 100%;
            padding: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 10px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-top: 10px;
            display: none;
        }
        .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Login to Nstrumenta</h1>
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" />
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" />
        </div>
        <button id="loginBtn">Login</button>
        <div class="loading">Logging in...</div>
        <div class="error" id="error"></div>
    </div>

    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

        const firebaseConfig = {
            apiKey: '${apiKey}',
            authDomain: '${authDomain}',
            projectId: '${projectId}',
            storageBucket: '${storageBucket}',
            messagingSenderId: '${messagingSenderId}',
            appId: '${appId}'
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        const vscode = acquireVsCodeApi();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('error');
        const loadingDiv = document.querySelector('.loading');

        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }

            loginBtn.disabled = true;
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const idToken = await user.getIdToken();

                vscode.postMessage({
                    command: 'authSuccess',
                    user: {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    },
                    idToken: idToken
                });
            } catch (error) {
                showError(error.message);
                loginBtn.disabled = false;
                loadingDiv.style.display = 'none';
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    </script>
</body>
</html>`;
  }
}
