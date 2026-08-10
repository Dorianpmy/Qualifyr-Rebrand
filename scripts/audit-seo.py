#!/usr/bin/env python3
"""Audit SEO et qualité, exécuté sur le site réellement rendu."""
import html
import json
import re
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3177'

PAGES = [
    '/', '/creation-site-web', '/methode', '/realisations', '/realisations/sw-car-cleaning',
    '/a-propos', '/diagnostic', '/contact',
    '/blog', '/blog/rendre-une-offre-de-services-plus-facile-a-choisir',
    '/mentions-legales', '/politique-de-confidentialite',
]


def get(path):
    try:
        with urllib.request.urlopen(BASE + path) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode('utf-8')


def tag(pattern, doc, flags=re.S):
    return re.findall(pattern, doc, flags)


def strip(value):
    return html.unescape(re.sub(r'<[^>]+>', '', value)).strip()


problems = []
titles, descriptions = {}, {}
internal_links = set()
pages_html = {}

print('=' * 74)
print('AUDIT SEO — pages')
print('=' * 74)

for path in PAGES:
    status, doc = get(path)
    pages_html[path] = doc
    if status != 200:
        problems.append(f'{path} renvoie {status}')
        continue

    h1 = [strip(x) for x in tag(r'<h1[^>]*>(.*?)</h1>', doc)]
    h2 = [strip(x) for x in tag(r'<h2[^>]*>(.*?)</h2>', doc)]
    h3 = tag(r'<h3[^>]*>', doc)
    title = tag(r'<title>(.*?)</title>', doc)
    desc = tag(r'<meta name="description" content="([^"]*)"', doc)
    canonical = tag(r'<link rel="canonical" href="([^"]*)"', doc)
    og_title = tag(r'<meta property="og:title" content="([^"]*)"', doc)
    og_image = tag(r'<meta property="og:image" content="([^"]*)"', doc)
    tw_card = tag(r'<meta name="twitter:card" content="([^"]*)"', doc)
    robots = tag(r'<meta name="robots" content="([^"]*)"', doc)
    lang = tag(r'<html[^>]*lang="([^"]*)"', doc)

    if len(h1) != 1:
        problems.append(f'{path} : {len(h1)} <h1> (1 attendu)')
    if not h2:
        problems.append(f'{path} : aucun <h2>')
    if not title:
        problems.append(f'{path} : <title> manquant')
    if not desc:
        problems.append(f'{path} : meta description manquante')
    if not canonical:
        problems.append(f'{path} : canonical manquant')
    if not og_title or not og_image:
        problems.append(f'{path} : Open Graph incomplet')
    if not tw_card:
        problems.append(f'{path} : Twitter card manquante')
    if lang != ['fr']:
        problems.append(f'{path} : lang={lang}')

    if title:
        titles.setdefault(html.unescape(title[0]), []).append(path)
    if desc:
        descriptions.setdefault(html.unescape(desc[0]), []).append(path)

    # Longueurs recommandées
    t_len = len(html.unescape(title[0])) if title else 0
    d_len = len(html.unescape(desc[0])) if desc else 0
    if t_len > 65:
        problems.append(f'{path} : <title> de {t_len} caractères (> 65)')
    if desc and not (110 <= d_len <= 165):
        problems.append(f'{path} : description de {d_len} caractères (110–165 conseillé)')

    # alt manquants
    imgs = tag(r'<img[^>]*>', doc)
    without_alt = [i for i in imgs if 'alt=' not in i]
    empty_alt = [i for i in imgs if re.search(r'alt=""', i)]
    if without_alt:
        problems.append(f'{path} : {len(without_alt)} <img> sans attribut alt')

    for href in tag(r'href="(/[^"#?]*)"', doc, re.I):
        internal_links.add(href.rstrip('/') or '/')

    print(f'\n{path}')
    print(f'  h1 : {h1[0][:58] if h1 else "MANQUANT"}')
    print(f'  h2/h3            : {len(h2)} / {len(h3)}')
    print(f'  title ({t_len:>2})       : {html.unescape(title[0])[:60] if title else "—"}')
    print(f'  description ({d_len:>3}) : ok' if desc else '  description : MANQUANTE')
    print(f'  canonical        : {canonical[0] if canonical else "MANQUANT"}')
    print(f'  og:image         : {"oui" if og_image else "NON"}   twitter : {tw_card[0] if tw_card else "NON"}')
    print(f'  robots           : {robots[0] if robots else "(hérité)"}')
    print(f'  images           : {len(imgs)} (sans alt : {len(without_alt)}, alt vide : {len(empty_alt)})')

print('\n' + '=' * 74)
print('UNICITÉ')
print('=' * 74)
dup_t = {k: v for k, v in titles.items() if len(v) > 1}
dup_d = {k: v for k, v in descriptions.items() if len(v) > 1}
print(f'  titres uniques       : {len(titles)}/{len(PAGES)}  {"OK" if not dup_t else dup_t}')
print(f'  descriptions uniques : {len(descriptions)}/{len(PAGES)}  {"OK" if not dup_d else dup_d}')
if dup_t:
    problems.append(f'titres dupliqués : {dup_t}')
if dup_d:
    problems.append(f'descriptions dupliquées : {dup_d}')

print('\n' + '=' * 74)
print('LIENS INTERNES')
print('=' * 74)
for link in sorted(internal_links):
    if link.startswith(('/api', '/_next')):
        continue
    status, _ = get(link)
    flag = 'OK ' if status == 200 else 'CASSÉ'
    if status != 200:
        problems.append(f'lien cassé : {link} ({status})')
    print(f'  {flag} {status}  {link}')

print('\n' + '=' * 74)
print('PAGES ORPHELINES')
print('=' * 74)
linked = {l.rstrip('/') or '/' for l in internal_links}
for path in PAGES:
    key = path.rstrip('/') or '/'
    if key not in linked:
        problems.append(f'page orpheline : {path}')
        print(f'  ORPHELINE  {path}')
    else:
        print(f'  liée       {path}')

print('\n' + '=' * 74)
print('ANCRES INTERNES')
print('=' * 74)
for path in PAGES:
    doc = pages_html.get(path, '')
    for anchor in set(tag(r'href="#([a-z0-9-]+)"', doc, re.I)):
        present = f'id="{anchor}"' in doc
        if not present:
            problems.append(f'ancre morte : {path}#{anchor}')
        print(f'  {"OK " if present else "MORTE"}  {path}#{anchor}')

print('\n' + '=' * 74)
print('LIENS EXTERNES ET rel')
print('=' * 74)
external = set()
for path, doc in pages_html.items():
    for match in tag(r'<a[^>]*href="(https?://[^"]+)"[^>]*>', doc):
        external.add(match)
    for anchor in tag(r'<a[^>]*target="_blank"[^>]*>', doc):
        if 'noopener' not in anchor or 'noreferrer' not in anchor:
            problems.append(f'{path} : target=_blank sans noopener noreferrer')
print(f'  liens externes visibles : {sorted(external) or "aucun"}')

print('\n' + '=' * 74)
print('DONNÉES STRUCTURÉES')
print('=' * 74)
allowed = {
    'Organization', 'ProfessionalService', 'WebSite', 'WebPage',
    'BreadcrumbList', 'Service', 'Blog', 'BlogPosting',
}
for path, doc in pages_html.items():
    blocks = tag(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', doc)
    types = []
    for block in blocks:
        try:
            data = json.loads(html.unescape(block))
            schema_type = data.get('@type')
            if isinstance(schema_type, list):
                types.extend(schema_type)
            else:
                types.append(schema_type)
        except json.JSONDecodeError:
            problems.append(f'{path} : JSON-LD invalide')
    forbidden = [t for t in types if t not in allowed]
    if forbidden:
        problems.append(f'{path} : type JSON-LD interdit {forbidden}')
    if types:
        print(f'  {path:<34} {types}')

print('\n' + '=' * 74)
print('ROBOTS ET SITEMAP')
print('=' * 74)
for path in ('/robots.txt', '/sitemap.xml', '/manifest.webmanifest'):
    status, doc = get(path)
    print(f'  {path} → {status}')
    print('    ' + doc.strip().replace('\n', '\n    ')[:400])

print('\n' + '=' * 74)
if problems:
    print(f'{len(problems)} PROBLÈME(S)')
    for problem in problems:
        print(f'  - {problem}')
    sys.exit(1)

print('AUCUN PROBLÈME DÉTECTÉ')
