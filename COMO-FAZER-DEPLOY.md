# Estúdio de Design — Guia de Deploy

## O que você vai precisar (tudo gratuito)
- Conta no GitHub: github.com
- Conta no Supabase: supabase.com
- Conta no Vercel: vercel.com

---

## PASSO 1 — Criar o banco de dados no Supabase

1. Acesse supabase.com e clique em "Start your project"
2. Crie uma conta (pode usar Google)
3. Clique em "New project"
4. Escolha um nome: `studio-design`
5. Crie uma senha para o banco (anote ela!)
6. Aguarde criar (1-2 minutos)

Quando abrir o projeto:
7. No menu da esquerda, clique em **"SQL Editor"**
8. Cole este SQL e clique em **"Run"**:

```sql
create table clientes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  site text,
  instagram text,
  cidade text,
  segmento text,
  cores text,
  fontes text,
  sobre text
);

alter table clientes enable row level security;

create policy "Acesso público" on clientes
  for all using (true) with check (true);
```

9. Vá em **Settings > API**
10. Copie a **"Project URL"** e a **"anon public"** key — você vai precisar delas no Passo 3.

---

## PASSO 2 — Subir o código no GitHub

1. Acesse github.com e crie uma conta se não tiver
2. Clique em **"New repository"**
3. Nome: `studio-design`
4. Deixe **Public** (gratuito)
5. Clique em **"Create repository"**
6. Clique em **"uploading an existing file"**
7. Arraste todos os arquivos desta pasta para lá
8. Clique em **"Commit changes"**

---

## PASSO 3 — Deploy no Vercel

1. Acesse vercel.com e clique em "Sign Up"
2. Entre com sua conta do **GitHub**
3. Clique em **"Add New Project"**
4. Selecione o repositório `studio-design`
5. Clique em **"Environment Variables"** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = a URL que você copiou do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a chave anon que você copiou
6. Clique em **"Deploy"**
7. Aguarde 2-3 minutos

Pronto! O Vercel vai te dar um link tipo: `studio-design-seunome.vercel.app`

---

## Compartilhando com o time

Envie o link para sua equipe. Todos acessam a mesma base de clientes em tempo real.

Caso queira um domínio personalizado (ex: studio.suaagencia.com.br), você pode configurar nas configurações do projeto no Vercel gratuitamente.

---

## Atualizações futuras

Sempre que quiser adicionar funcionalidades, basta atualizar os arquivos no GitHub que o Vercel republica automaticamente em segundos.
