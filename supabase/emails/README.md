# E-mail de confirmação de cadastro (Supabase Auth)

O arquivo `confirmacao-cadastro.html` é o template HTML do e-mail enviado pelo
Supabase quando um usuário cria conta (confirmação de e-mail).

## Como aplicar no Supabase

1. Acesse o painel do projeto em https://supabase.com/dashboard
2. Vá em **Authentication → Email Templates → Confirm signup**
3. Cole o conteúdo de `confirmacao-cadastro.html` no campo de template (HTML)
4. Defina o **Subject** como: `Confirme seu e-mail — Fostern`
5. (Opcional, recomendado) Em **Project Settings → Auth → SMTP Settings**, configure um
   remetente próprio (ex.: `noreply@fostern.com.br` ou `contact.fostern@gmail.com`)
   para que o e-mail não saia do domínio padrão do Supabase.
6. Em **Authentication → URL Configuration**, adicione a URL do site em
   **Redirect URLs** (ex.: `https://seu-dominio.com/auth`).

## Variáveis disponíveis no template

- `{{ .ConfirmationURL }}` — link de confirmação
- `{{ .Email }}` — e-mail do usuário
- `{{ .SiteURL }}` — URL base do site

## Observação

Sem configurar SMTP próprio, o Supabase envia pelo domínio padrão
(`noreply@mail.app.supabase.io`), o que pode cair em spam. Configure SMTP para
garantir entrega e remetente "bonitinho".
