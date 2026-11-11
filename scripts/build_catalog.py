#!/usr/bin/env python3
"""Gera data/catalog.json (privado) a partir de data/drive_files.json.

Uso:  python3 scripts/build_catalog.py
      CATALOG_PASSWORD="senha" node scripts/encrypt_catalog.mjs

O segundo comando criptografa o catálogo em assets/catalog.enc.js, que é o
único arquivo de receitas publicado no site. A pasta data/ não vai para o
GitHub (.gitignore), para que os nomes e links das receitas não fiquem expostos.

data/drive_files.json é a listagem da pasta do Google Drive
(id, title, mimeType, size, created, folder). Este script:
  * descarta arquivos que não são receitas (áudios, prints, atalhos .lnk...)
  * remove duplicados (mesmo nome + mesmo tamanho)
  * limpa os nomes ("boneca_Luna (1).pdf" -> "Boneca Luna")
  * classifica cada receita em categorias por palavras-chave
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "drive_files.json"
OUT = ROOT / "data" / "catalog.json"

RECIPE_MIMES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
SKIP_TITLES = {"leitor de pdf"}
MIN_SIZE = 8_000  # PDFs minúsculos são lixo do WhatsApp

# (id, nome, emoji, cor, palavras-chave) — a ordem define a categoria principal.
# Palavras-chave casam com o início de palavras do nome normalizado (sem acento).
CATEGORIES = [
    ("natal", "Natal", "🎄", "#e8b4b4", [
        "natal", "grinch", "papai noel", "mamae noel", "noel", "rena", "renas", "boneco de neve", "bonecao de neve",
        "bonevo de neve", "snowman", "snegovik", "xmas", "christmas", "ded moroz", "elfo", "elf ",
        "arvore de natal", "presepio", "anjo", "angel", "guirlanda", "wreath", "mrs claus", "mrs clauss",
        "santa", "pinheiro", "sino", "rudolph", "gingerbread", "biscoito",
    ]),
    ("pascoa", "Páscoa", "🐣", "#f3e3a6", ["pascoa", "easter", "ovo de", "cenoura"]),
    ("halloween", "Halloween", "🎃", "#f2c7a0", [
        "halloween", "frankenstein", "abobora", "pumpkin", "bruxa", "witch", "fantasma", "ghost", "caveira", "morcego",
        "vampir", "zumbi", "dracula", "esqueleto",
    ]),
    ("bonecas", "Bonecas e bonecos", "🧸", "#f6c9d6", [
        "boneca", "boneco", "lalka", "brautpaar", "indigena", "velhinh", "velhinha", "vovozinh", "amelia", "emily", "sonechka", "bonequinha", "bonequinho", "bonecas", "bonecos", "doll", "dolls", "kukla",
        "menina", "menino", "garota", "garoto", "girl", "boy", "devochka", "malchik", "princesa", "princess",
        "principe", "prince", "fada", "fairy", "feya", "fee", "bailarina", "ballerina", "sereia", "mermaid",
        "palhaco", "palhacinho", "clown", "kloun", "pirata", "pirate", "bebe", "bebes", "baby", "neném",
        "nenem", "vovo", "vovó", "avo", "noiva", "noivo", "bride", "nevesta", "zhenikh", "tilda", "astronauta",
        "aviador", "policial", "bombeiro", "enfermeira", "medico", "medica", "chef", "cozinheira",
        "professora", "fotografo", "jogador", "karate", "ninja", "cavaleiro", "knight", "rytsar", "rei ",
        "rainha", "queen", "king", "lady", "mocinha", "indio", "india", "gnomo", "gnome", "duende",
        "anao", "troll", "lili", "frida", "josefina", "olivia", "alice", "emma", "luna", "sofia", "sophie",
    ]),
    ("personagens", "Personagens famosos", "⭐", "#c9d8f6", [
        "disney", "pixachu", "minjon", "goonies", "belle", "mickey", "minnie", "minie", "pato donald", "donald", "pateta", "pluto", "frozen", "elsa",
        "olaf", "ariel", "moana", "rapunzel", "cinderela", "branca de neve", "bela", "aurora", "jasmine",
        "mulan", "stitch", "simba", "rei leao", "nemo", "dory", "toy stor", "woody", "buzz", "harry potter",
        "hermione", "star wars", "dart", "darth", "vader", "yoda", "chewbacca", "mario", "luigi", "sonic",
        "pikachu", "pokemon", "hello kit", "hellokit", "kitty", "snoopy", "garfield", "garfild", "simpson",
        "minion", "patati", "patata", "pocoyo", "peppa", "galinha pintadinha", "turma da monica", "monica",
        "cebolinha", "magali", "chaves", "chapolin", "super homem", "superman", "batman", "homem aranha",
        "spider", "capitao america", "hulk", "thor", "iron man", "homem de ferro", "coringa", "joker",
        "arlequina", "harley", "mulher maravilha", "flash", "vingadores", "avengers", "bob esponja",
        "spongebob", "plankton", "patrick", "lula molusco", "smurf", "smonks", "ursinho pooh", "pooh",
        "tigrao", "tigger", "leitao", "bisonho", "pernalonga", "piu piu", "frajola", "pica pau", "scooby",
        "tom e jerry", "pequeno principe", "chapeuzinho", "caperucita", "pinoquio", "peter pan", "sininho",
        "tinker", "wall e", "shrek", "madagascar", "era do gelo", "kung fu", "dumbo", "bambi", "marie",
        "aristogatas", "cruella", "dalmata", "rei julien", "my little pony", "pony", "celestia", "twilight",
        "unicornio rainbow", "lol ", "barbie", "ken", "tio patinhas", "patinhas", "huguinho", "sobrinho do tio",
        "alvin", "esquilos", "smurfette", "pikachu", "totoro", "naruto", "goku", "dragon ball", "chucky",
        "frida kahlo", "frida kalo", "et ", "e.t", "pinguins de madagascar", "carros", "mate", "mcqueen",
        "relampago", "mate cars", "patrulha canina", "paw patrol", "chase", "marshall", "lilo",
    ]),
    ("coelhos", "Coelhos", "🐰", "#f7d6e0", [
        "coelh", "zaik", "zaichik", "bunny", "rabbit", "rabit", "lapin", "lapine", "zaj", "zay", "zaich", "zaych", "zayats",
        "lebre", "hare", "conejo", "conejit",
    ]),
    ("ursos", "Ursos", "🐻", "#e3cdb5", [
        "urso", "ursa", "ursinho", "ursinha", "ursao", "ursos", "bear", "teddy", "mishka", "mishk",
        "medved", "oso", "panda", "koala", "coala", "tolly", "molly",
    ]),
    ("gatos", "Gatos", "🐱", "#f5dcc2", [
        "gat", "cat ", "cat.", "cats", "kitten", "kitty", "kot", "koshk", "kotik", "gatito", "gatita",
        "michi", "felino",
    ]),
    ("cachorros", "Cachorros", "🐶", "#e6d3c3", [
        "cachorr", "sobach", "pupp", "cao", "caes", "caozinho", "cãozinho", "cadela", "cachorrinha", "dog", "puppy", "pyos",
        "sobak", "shchenok", "perro", "perrito", "salsich", "dalmata", "poodle", "pug", "husky", "beagle",
        "bulldog", "yorkshire", "chihuahua", "lulu", "spitz", "labrador",
    ]),
    ("fazenda", "Animais da fazenda", "🐄", "#d6e8c4", [
        "vaca", "galinh", "galinho", "poney", "vaquinha", "vaquinhas", "boi", "touro", "bezerro", "cow", "korova", "porc", "porqu",
        "leitao", "pig", "piglet", "svin", "porqinho", "ovelh", "carneir", "cordeiro", "sheep", "lamb",
        "barash", "ovechk", "bode", "cabra", "cabrit", "goat", "kozel", "cavalo", "cavalinho", "egua",
        "potro", "pony", "horse", "loshad", "burro", "burrinho", "jegue", "jumento", "asno", "donkey",
        "galinha", "galo", "pintinho", "pintinhos", "chicken", "hen", "rooster", "petukh", "kuritsa",
        "tsyplenok", "pato", "pata", "patinho", "patinha", "patao", "duck", "utk", "utyon", "ganso", "goose",
        "peru", "lhama", "llama", "alpaca", "fazenda", "farm",
    ]),
    ("selva", "Animais da selva e savana", "🦁", "#f1e2a8", [
        "leao", "onc", "giraf", "gitafa", "surikat", "suricat", "leoa", "leaozinho", "lion", "lev ", "lyov", "tigre", "tigres", "tigrinho", "tiger", "tigr",
        "tivre", "onca", "jaguar", "leopard", "guepardo", "girafa", "giraffe", "zhiraf", "jirafa", "elefant",
        "elephant", "slon", "hipopotam", "hippo", "begemot", "zebra", "rinoceronte", "rhino", "macac",
        "monkey", "mono", "obezyan", "orangotango", "gorila", "chimpanze", "suricato", "camelo", "crocodil",
        "jacare", "krokodil", "safari", "selva", "jungle", "savana", "bicho preguica", "preguica", "sloth",
        "tucano", "papagaio", "arara", "parrot", "flamingo", "canguru", "kangaroo", "lemure", "tamandua",
    ]),
    ("floresta", "Animais da floresta", "🦊", "#f0cfb0", [
        "raposa", "abelh", "chipmunk", "stinktier", "sapao", "sapinho", "sapinha", "raposinha", "raosa", "fox", "lis ", "lisa ", "lisich", "lisenok", "zorro", "lobo",
        "wolf", "volk", "esquilo", "squirrel", "belk", "ardilla", "cervo", "veado", "deer", "olen", "alce",
        "moose", "bambi", "ourico", "hedgehog", "ezh", "erizo", "erizin", "coruja", "corujinha", "owl",
        "sov", "buho", "guaxinim", "raccoon", "enot", "texugo", "gamba", "skunk", "castor", "beaver",
        "biber", "bobr", "toupeira", "mole", "javali", "rato", "ratinho", "ratinha", "ratazana", "camundongo",
        "mouse", "mice", "mysh", "mish", "raton", "hamster", "esquilinho", "passaro", "passarinho",
        "bird", "ptich", "pajaro", "sapo", "frog", "lyagush", "ra ", "lagarta", "joaninha", "abelha",
        "bee", "borboleta", "butterfly", "inseto", "formiga", "caracol", "lesma", "minhoca", "lagartixa",
        "bukash", "pica pau", "pinguim", "penguin", "pingvin", "foca", "urso polar",
    ]),
    ("mar", "Fundo do mar", "🐙", "#bfe0ea", [
        "polvo", "tartarug", "pingu", "ijsbeer", "tux", "octopus", "osminog", "baleia", "whale", "kit ", "golfinho", "dolphin", "tubarao", "shark",
        "akula", "peixe", "peixes", "peixinho", "fish", "ryb", "pez ", "tartaruga", "turtle", "cherepakh",
        "tortuga", "caranguejo", "crab", "siri", "lagosta", "estrela do mar", "starfish", "cavalo marinho",
        "seahorse", "agua viva", "jellyfish", "medusa", "lula", "foca", "seal", "morsa", "mar ", "marinho",
        "sea ", "ocean",
    ]),
    ("fantasia", "Unicórnios, dragões e fantasia", "🦄", "#dcc9f0", [
        "unicornio", "unicorn", "edinorog", "dragao", "dragon", "drakon", "draak", "dinossauro", "dino",
        "t rex", "t-rex", "trex", "dinozavr", "monstr", "monster", "alien", "aliens", "et ", "robo", "robot",
        "pegasus", "pegaso", "fenix", "grifo", "yeti", "sereio",
    ]),
    ("bebe", "Para bebês", "🍼", "#d7e9f5", [
        "mantinha", "naninha", "chocalho", "rattle", "mobile", "mobil", "chupeta", "prendedor de chupeta",
        "apego", "dormilon", "sonolento", "sapatinho", "sapatinhos", "pantufa", "pezinho", "pezinhos",
        "body", "babador", "touca", "touquinha", "gorro", "manta", "cobertor", "kit bebe", "enxoval",
        "mordedor", "teether", "bebe conforto", "rammelaar", "rassel", "lovey", "security blanket",
    ]),
    ("acessorios", "Roupas e acessórios", "👜", "#e9d6ef", [
        "bolsa", "bolsas", "bolda", "mochila", "carteira", "necessaire", "estojo", "chaveiro", "chaveir",
        "chapeu", "boina", "touca", "gorro", "cachecol", "luva", "luvas", "meia", "chinelo", "pantufa",
        "sandalia", "sapatilha", "tiara", "laco", "faixa", "presilha", "brinco", "colar", "pulseira",
        "vestido", "saia", "blusa", "calca", "casaco", "macacao", "pelerine", "capa", "biquini", "roupa",
        "roupinha", "roupas", "oculos", "eyeglasses", "porta celular", "capinha", "argola", "broche",
    ]),
    ("casa", "Casa e decoração", "🏡", "#cfe3d6", [
        "porta papel", "caneta", "lapis", "casinha", "casinhas", "travesseiro", "caixa", "daisy", "violeta", "porta joia", "porta", "cesto", "cesta", "tapete", "almofada", "sousplat", "jogo de",
        "caminho de mesa", "toalha", "puxa saco", "pano de prato", "vaso", "cacto", "cactos", "suculenta",
        "flor", "flores", "florzinha", "rosa", "girassol", "tulipa", "margarida", "planta", "alfineteiro",
        "peso de porta", "guirlanda", "enfeite", "mobile", "banquinho", "banquinhos", "regador", "lixeirinha",
        "xicara", "caneca", "pote", "potinho", "letras", "numeros", "abc", "coracao", "coracoes", "heart",
        "lembrancinha", "marcador", "luminaria", "abajur", "relogio", "quadro",
    ]),
    ("comidinhas", "Comidinhas e frutinhas", "🍓", "#f6d0c8", [
        "bolo", "cupcake", "cup cake", "doce", "docinho", "sorvete", "picole", "donut", "rosquinha",
        "biscoito", "cookie", "pizza", "hamburguer", "sanduiche", "morango", "morangos", "maca ", "macas ", "macazinha", "pera ",
        "banana", "abacaxi", "melancia", "laranja", "limao", "uva", "cereja", "fruta", "frutas", "legume",
        "cenoura", "milho", "cogumelo", "abacate", "chocolate", "pirulito", "pao", "ovo", "cafe", "cha ",
        "chopp", "comida", "food",
    ]),
    ("veiculos", "Carrinhos e veículos", "🚗", "#d3dbe6", [
        "carro", "carrinho", "car ", "cars", "aviao", "aviaozinho", "plane ", "trem", "train", "barco",
        "navio", "submarino", "foguete", "rocket", "onibus", "caminhao", "moto", "bicicleta", "trator",
        "helicoptero", "balao",
    ]),
    ("revistas", "Revistas e coletâneas", "📚", "#e7e1d2", [
        "revista", "revidta", "zoomigurumi", "amigurumis variados", "animais", "bichos", "pontos de croch", "explicativo", "revistas", "coletanea", "colecao", "apostila", "livro", "book", "vol ", "volume",
        "edicao", "magazine", "graficos", "melhores", "patterns", "receitas", "catalogo", "world of",
    ]),
]


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s: str) -> str:
    s = strip_accents(s.lower())
    s = re.sub(r"[_\-\.\(\)\[\],;:!?/\\+]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return f" {s.strip()} "


# Transliteração simples do russo (alguns nomes vêm em cirílico)
CYR = dict(zip(
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    ["a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t",
     "u", "f", "kh", "ts", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya"],
))


def translit(s: str) -> str:
    return "".join(CYR.get(c, CYR.get(c.lower(), c)) for c in s)


EXT_RE = re.compile(r"\.(pdf|docx?|bin|jpe?g)\b", re.I)


def clean_title(raw: str) -> tuple[str, str]:
    """Retorna (nome bonito, nome original do arquivo)."""
    original = raw.strip()
    t = original
    t = re.sub(r"\s*·\s*vers[aã]o\s*\d+", "", t, flags=re.I)
    # "Good_Witch_pattern.pdf bruxinha" -> o texto depois do .pdf é o nome em português
    m = re.match(r"^(.*?\.(?:pdf|docx?))\s+(.+)$", t, flags=re.I)
    if m and len(m.group(2).strip(" .-")) >= 3:
        t = m.group(2)
    t = EXT_RE.sub("", t)
    t = re.sub(r"\(\s*\d+\s*\)", "", t)            # (1)
    t = re.sub(r"[-_ ]\d{9,}", "", t)                # timestamps -1524999727
    t = re.sub(r"(?i)(?<=\w)doc\d{6,}(_\d+)?", "", t)  # "Cachorrodoc585772629"
    t = re.sub(r"(?i)\b(enviando|perevod|traduzido|clean|compressed|fixed)\b", "", t)
    t = t.replace("_", " ")
    # CamelCase em nomes ingleses: "RainbowZebraCrochetPattern" -> "Rainbow Zebra Crochet Pattern"
    if " " not in t.strip() and re.search(r"[a-z][A-Z]", t):
        t = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", t)
    t = re.sub(r"(?i)\s*(crochet pattern|pattern|by gurumiland design|gurumiland design|gurumiland)\s*", " ", t)
    t = re.sub(r"\s*-\s*$", "", t)
    t = re.sub(r"^[\s\-–·.]+|[\s\-–·.]+$", "", t)
    t = re.sub(r"^[^\w(]+", "", t)  # emojis/símbolos no começo atrapalham a ordem A-Z
    t = re.sub(r"\s{2,}", " ", t).strip()
    if not t:
        t = EXT_RE.sub("", original).strip() or "Receita sem nome"
    # Só capitaliza a primeira letra para não estragar nomes próprios
    t = t[0].upper() + t[1:]
    return t, original


def detect_lang(original: str, n: str) -> str:
    if re.search(r"[А-Яа-яЁё]", original):
        return "Russo"
    if re.search(r"\b(rus|perevod|mk|kukla|zajka|zajchulja|myshka|mishka|zhiraf|begemoshka|barashki)\b", n):
        return "Russo"
    if re.search(r"\b(esp|espanol|patron|y |conejo|munequ|osito)\b", n) or " esp " in n:
        return "Espanhol"
    if re.search(r"\b(pattern|crochet|the|and|english|en|free|doll|bunny|bear|by|little|tiny)\b", n):
        return "Inglês"
    if re.search(r"\b(deutsch|anleitung|hakel)\b", n):
        return "Alemão"
    if re.search(r"\b(patroon|haken|rammelaar|moppie|poesje)\b", n):
        return "Holandês"
    return "Português"


def classify(n: str) -> list[str]:
    cats = []
    for cid, _name, _emoji, _color, keys in CATEGORIES:
        for k in keys:
            # casa no início de palavra; chave terminada em espaço = palavra inteira
            kk = norm(k) if k.endswith(" ") else norm(k).rstrip()
            if kk in n:
                cats.append(cid)
                break
    return cats or ["outros"]


def main() -> None:
    files = json.loads(SRC.read_text(encoding="utf-8"))
    seen_ids, seen_keys = set(), set()
    recipes = []
    skipped = 0
    for f in files:
        if f["mimeType"] not in RECIPE_MIMES:
            skipped += 1
            continue
        title, original = clean_title(f["title"])
        n0 = norm(translit(original) + " " + title)
        if title.lower() in SKIP_TITLES or (f.get("size") and f["size"] < MIN_SIZE):
            skipped += 1
            continue
        key = (norm(title), f.get("size") or 0)
        if f["id"] in seen_ids or key in seen_keys:
            skipped += 1
            continue
        seen_ids.add(f["id"])
        seen_keys.add(key)
        kind = "pdf" if f["mimeType"] == "application/pdf" else "doc"
        recipes.append({
            "id": f["id"],
            "t": title,
            "o": original if original != title else "",
            "c": classify(n0),
            "l": detect_lang(original, n0),
            "s": f.get("size") or 0,
            "d": (f.get("created") or "")[:10],
            "k": kind,
            "f": f.get("folder", ""),
        })

    recipes.sort(key=lambda r: strip_accents(r["t"].lower()))
    cats = [{"id": c[0], "name": c[1], "emoji": c[2], "color": c[3]} for c in CATEGORIES]
    cats.append({"id": "outros", "name": "Outros", "emoji": "🧶", "color": "#e5ddd5"})

    payload = {"generated": __import__("datetime").date.today().isoformat(),
               "categories": cats, "recipes": recipes}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    from collections import Counter
    cc = Counter(c for r in recipes for c in r["c"])
    print(f"{len(recipes)} receitas ({skipped} arquivos ignorados)")
    for c in cats:
        print(f"  {c['emoji']} {c['name']}: {cc.get(c['id'], 0)}")
    print("Idiomas:", Counter(r["l"] for r in recipes).most_common())


if __name__ == "__main__":
    main()
