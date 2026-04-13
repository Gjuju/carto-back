function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${escapeHtml(title)} — Carto</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --danger: #dc2626;
      --success: #16a34a;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card);
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 700;
    }
    p.sub {
      margin: 0 0 24px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.5;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--text);
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input[type="password"]:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .field { margin-bottom: 18px; }
    button {
      width: 100%;
      padding: 13px 16px;
      background: var(--primary);
      color: white;
      border: 0;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    button:hover { background: var(--primary-hover); }
    .alert {
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 18px;
    }
    .alert-error {
      background: #fef2f2;
      color: var(--danger);
      border: 1px solid #fecaca;
    }
    .alert-success {
      background: #f0fdf4;
      color: var(--success);
      border: 1px solid #bbf7d0;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    .icon-success { background: #f0fdf4; color: var(--success); }
    .icon-error { background: #fef2f2; color: var(--danger); }
    .center { text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      ${body}
    </div>
  </div>
</body>
</html>`
}

export function renderResetPasswordForm(options: {
  token: string
  error?: string
}): string {
  const { token, error } = options
  const errorBlock = error
    ? `<div class="alert alert-error">${escapeHtml(error)}</div>`
    : ''

  const body = `
    <h1>Nouveau mot de passe</h1>
    <p class="sub">Choisissez un nouveau mot de passe pour votre compte Carto. Il doit contenir au moins 8 caractères.</p>
    ${errorBlock}
    <form method="POST" action="/auth/reset-password" autocomplete="off">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <div class="field">
        <label for="password">Nouveau mot de passe</label>
        <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password" />
      </div>
      <div class="field">
        <label for="password_confirmation">Confirmation</label>
        <input type="password" id="password_confirmation" name="password_confirmation" required minlength="8" autocomplete="new-password" />
      </div>
      <button type="submit">Réinitialiser le mot de passe</button>
    </form>
  `
  return layout('Réinitialisation du mot de passe', body)
}

export function renderResetPasswordSuccess(): string {
  const body = `
    <div class="center">
      <div class="icon icon-success">✓</div>
      <h1>Mot de passe réinitialisé</h1>
      <p class="sub">Votre mot de passe a bien été modifié. Vous pouvez maintenant vous reconnecter depuis l'application Carto.</p>
    </div>
  `
  return layout('Mot de passe réinitialisé', body)
}

export function renderResetPasswordInvalid(): string {
  const body = `
    <div class="center">
      <div class="icon icon-error">!</div>
      <h1>Lien invalide ou expiré</h1>
      <p class="sub">Ce lien de réinitialisation n'est plus valide. Les liens expirent au bout d'une heure et ne peuvent être utilisés qu'une seule fois. Veuillez redemander un nouveau lien depuis l'application.</p>
    </div>
  `
  return layout('Lien invalide', body)
}
