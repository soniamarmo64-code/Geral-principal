# 🧶 Cantinho do Amigurumi

Site particular que reúne receitas de crochê e amigurumi guardadas no Google Drive.
A página de abertura é pública; **as receitas só aparecem para quem tem o código do tema**.

## O que o site faz

- **Busca** por nome. Não precisa de acento e aceita várias palavras: "urso panda", "coelha vestido".
- **20 categorias**, como Bonecas, Coelhos, Ursos, Natal, Personagens famosos, Fundo do mar, Para bebês e Casa e decoração.
- **Filtro por idioma** (Português, Inglês, Russo, Espanhol…) e **ordem** A→Z, Z→A, mais recentes ou mais antigas.
- **Página de cada receita** com o PDF aberto dentro do site e botão de tela cheia. O site **não tem botão de baixar**: as receitas são só para visualizar.
- **❤️ Favoritas**, **✅ Já fiz** e **🕘 Vistas recentemente**.
- **🔢 Contador de carreiras** e **📝 anotações** para cada receita (ex.: "usei agulha 2,5").
- **🎲 Me surpreenda**: abre uma receita aleatória.
- Funciona bem no **celular**, no tablet e no computador, e tem modo escuro automático.

> Favoritas, anotações e contadores ficam salvos **no navegador do aparelho**.
> No celular e no computador eles ficam separados.

## Como abrir

**No computador:** dê dois cliques no arquivo `index.html`.

**Publicar na internet de graça (GitHub Pages):**
1. No GitHub, abra o repositório → **Settings** → **Pages**.
2. Em *Branch*, escolha o branch do site e a pasta `/ (root)` → **Save**.
3. Em 1 ou 2 minutos o site fica no ar em **https://cantinhodereceitasamigurumi.github.io**.

## Fotos e PDFs: quem consegue ver

O site mostra a receita direto do Google Drive. Por isso:

- **Logada na sua conta Google** (a dona da pasta), você vê as miniaturas e os PDFs normalmente.
- **Outras pessoas** só conseguem abrir as receitas se a pasta estiver compartilhada como
  *"Qualquer pessoa com o link pode ver"* (no Drive: botão direito na pasta → Compartilhar → Acesso geral).
- Quando a miniatura não carrega, o card mostra um desenho da categoria (🐰, 🧸, 🎄…).

## Bloquear o download das receitas

O site não oferece download, mas o bloqueio de verdade é feito no Google Drive.
Só a dona dos arquivos consegue configurar isso:

1. No Google Drive da sua conta pessoal (a dona da pasta), abra a pasta "Amigurumis variados".
2. Selecione todos os arquivos (Ctrl+A no computador).
3. Clique em **Compartilhar** → ícone de engrenagem ⚙️.
4. **Desmarque** "Leitores e comentaristas podem ver a opção de fazer download, imprimir e copiar".
5. Salve.

Assim, quem tem acesso só como leitor consegue **ver** o PDF, mas não baixar nem imprimir.
Você, como dona, continua podendo baixar normalmente.

## Códigos de acesso por tema

- A página de abertura mostra os temas (categorias) com a quantidade de receitas e um botão
  **Quero acesso**, que abre o WhatsApp ou o e-mail com a mensagem pronta.
- **Cada tema tem o seu código** (ex.: `NATAL-XXXX-XXXX`). Quem digita o código vê só as receitas daquele tema.
  Vários códigos podem ser somados no mesmo aparelho.
- O **código mestre** (`MESTRE-…`) abre todos os temas.
- As receitas de cada tema ficam **criptografadas com a chave daquele tema** em `assets/catalog.enc.js`.
  Sem o código, ninguém consegue ler os nomes nem os links — nem olhando o código do site.
- Os códigos ficam guardados em `secrets.enc.json`, criptografado com o código mestre.
  A lista legível é gerada em `data/codigos.txt`, que **não vai para o GitHub**.
- **Trocar o código de um tema** (por exemplo, se ele vazou):
  ```bash
  MASTER_CODE="MESTRE-…" node scripts/encrypt_catalog.mjs --rotate natal
  ```
  O código antigo deixa de funcionar; os outros temas continuam iguais.
- Os PDFs continuam protegidos pelo compartilhamento do Google Drive.

## Como atualizar quando entrarem receitas novas

1. Atualize `data/drive_files.json` com a listagem nova da pasta. Peça ao Claude: *"atualize o catálogo do site com as receitas novas do Drive"*.
2. Rode:
   ```bash
   python3 scripts/build_catalog.py
   ```
   Isso gera `data/catalog.json` (privado): limpa os nomes, tira duplicados e separa em categorias.
3. Criptografe o catálogo (mantém os mesmos códigos):
   ```bash
   MASTER_CODE="MESTRE-…" node scripts/encrypt_catalog.mjs
   ```
4. Para mudar ou criar categorias, edite a lista `CATEGORIES` em `scripts/build_catalog.py`.
   Cada categoria tem nome, emoji, cor e as palavras-chave que a identificam.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página do site |
| `assets/styles.css` | Cores, fontes e layout |
| `assets/app.js` | Busca, filtros, favoritas, contador… |
| `assets/gate.js` | Página de abertura (ilustrações, temas, pedir acesso) e códigos |
| `assets/catalog.enc.js` | Catálogo de receitas criptografado por tema |
| `secrets.enc.json` | Códigos dos temas, criptografados com o código mestre |
| `scripts/build_catalog.py` | Gera o catálogo a partir da listagem do Drive |
| `scripts/encrypt_catalog.mjs` | Gera/mantém os códigos e criptografa cada tema |
