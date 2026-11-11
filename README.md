# 🧶 Cantinho do Amigurumi

Site que reúne em um só lugar as **3.913 receitas de crochê e amigurumi** da pasta
"Amigurumis variados" do Google Drive (incluindo as subpastas "Bolsas de crochê" e "Gurumiland").

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
3. Em 1 ou 2 minutos o endereço aparece ali mesmo, algo como `https://SEU-USUARIO.github.io/Geral-principal/`.

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

## Como atualizar quando entrarem receitas novas

1. Atualize `data/drive_files.json` com a listagem nova da pasta. Peça ao Claude: *"atualize o catálogo do site com as receitas novas do Drive"*.
2. Rode:
   ```bash
   python3 scripts/build_catalog.py
   ```
   Isso gera de novo o `assets/recipes.js`: limpa os nomes, tira duplicados e separa em categorias.
3. Para mudar ou criar categorias, edite a lista `CATEGORIES` em `scripts/build_catalog.py`.
   Cada categoria tem nome, emoji, cor e as palavras-chave que a identificam.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página do site |
| `assets/styles.css` | Cores, fontes e layout |
| `assets/app.js` | Busca, filtros, favoritas, contador… |
| `assets/recipes.js` | Catálogo de receitas (gerado automaticamente) |
| `data/drive_files.json` | Listagem dos arquivos do Drive |
| `scripts/build_catalog.py` | Gera o catálogo a partir da listagem |
