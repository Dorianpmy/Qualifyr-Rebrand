#!/usr/bin/env python3
"""Audit d'accessibilité et de structure, sur le site réellement rendu."""
import html
import re
import sys
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3300'

PAGES = ['/', '/creation-site-web', '/methode', '/realisations', '/realisations/sw-car-cleaning',
         '/a-propos', '/diagnostic', '/contact',
         '/blog', '/blog/rendre-une-offre-de-services-plus-facile-a-choisir',
         '/mentions-legales', '/politique-de-confidentialite']

problems = []


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return r.read().decode('utf-8')


def strip(v):
    return html.unescape(re.sub(r'<[^>]+>', '', v)).strip()


print('=' * 76)
print('LANDMARKS ET STRUCTURE')
print('=' * 76)
for path in PAGES:
    doc = get(path)
    header = len(re.findall(r'<header', doc))
    main = len(re.findall(r'<main', doc))
    footer = len(re.findall(r'<footer', doc))
    navs = re.findall(r'<nav[^>]*>', doc)
    unlabeled_nav = [n for n in navs if 'aria-label' not in n and 'aria-labelledby' not in n]
    skip = 'Aller au contenu' in doc
    main_id = 'id="contenu"' in doc

    if header != 1:
        problems.append(f'{path} : {header} <header>')
    if main != 1:
        problems.append(f'{path} : {main} <main>')
    expected_footer = 0 if path == '/diagnostic' else 1
    if footer != expected_footer:
        problems.append(
            f'{path} : {footer} <footer> (attendu : {expected_footer})'
        )
    if unlabeled_nav:
        problems.append(f'{path} : {len(unlabeled_nav)} <nav> sans nom accessible')
    if not skip or not main_id:
        problems.append(f'{path} : lien d’évitement incomplet')

    print(f'  {path:<34} header {header} · main {main} · footer {footer} · '
          f'nav {len(navs)} (tous nommés : {"oui" if not unlabeled_nav else "NON"}) · '
          f'skip {"oui" if skip else "NON"}')

print()
print('=' * 76)
print('ORDRE DES TITRES')
print('=' * 76)
for path in PAGES:
    doc = get(path)
    levels = [int(m.group(1)) for m in re.finditer(r'<h([1-6])[^>]*>', doc)]
    h1 = levels.count(1)
    jumps = []
    previous = 0
    for level in levels:
        if previous and level > previous + 1:
            jumps.append(f'h{previous}→h{level}')
        previous = level
    if h1 != 1:
        problems.append(f'{path} : {h1} <h1>')
    if jumps:
        problems.append(f'{path} : saut de niveau {jumps}')
    print(f'  {path:<34} {"".join(str(l) for l in levels)}  '
          f'{"OK" if h1 == 1 and not jumps else "PROBLÈME " + str(jumps)}')

print()
print('=' * 76)
print('FORMULAIRES')
print('=' * 76)
for path in ('/diagnostic', '/contact'):
    doc = get(path)
    ids = set(re.findall(r'<(?:input|select|textarea)[^>]*\bid="([^"]+)"', doc))
    fors = set(re.findall(r'<label[^>]*\bfor="([^"]+)"', doc))
    wrapped = len(re.findall(r'<label[^>]*>(?:(?!</label>).)*?<input', doc, re.S))
    fieldsets = len(re.findall(r'<fieldset', doc))
    legends = len(re.findall(r'<legend', doc))
    placeholders_as_label = len(re.findall(r'placeholder="[^"]+"[^>]*>(?![^<]*<label)', doc))
    checked = len(re.findall(r'<input[^>]*checked', doc))
    orphans = ids - fors
    if orphans:
        problems.append(f'{path} : contrôles sans label ({orphans})')
    if fieldsets != legends:
        problems.append(f'{path} : {fieldsets} fieldset pour {legends} legend')
    if checked:
        problems.append(f'{path} : {checked} case pré-cochée')
    print(f'  {path:<34} contrôles {len(ids)} · label[for] {len(fors)} · '
          f'labels englobants {wrapped} · fieldset/legend {fieldsets}/{legends} · '
          f'pré-cochées {checked}')

print()
print('=' * 76)
print('LIENS ET BOUTONS')
print('=' * 76)
for path in PAGES:
    doc = get(path)
    links = re.findall(r'(<a[^>]*>)(.*?)</a>', doc, re.S)
    empty_links = [(opening, content) for opening, content in links
                   if not strip(content) and 'aria-label' not in opening]
    buttons = re.findall(r'(<button[^>]*>)(.*?)</button>', doc, re.S)
    empty_buttons = [(opening, content) for opening, content in buttons
                     if not strip(content) and 'aria-label' not in opening]
    blank = re.findall(r'<a[^>]*target="_blank"[^>]*>', doc)
    bad_rel = [a for a in blank if 'noopener' not in a or 'noreferrer' not in a]
    if empty_links:
        problems.append(f'{path} : {len(empty_links)} lien sans texte')
    if empty_buttons:
        problems.append(f'{path} : {len(empty_buttons)} bouton sans nom')
    if bad_rel:
        problems.append(f'{path} : target=_blank sans rel complet')
    print(f'  {path:<34} liens vides {len(empty_links)} · boutons {len(buttons)} '
          f'(sans nom {len(empty_buttons)}) · _blank {len(blank)}')

print()
print('=' * 76)
print('IMAGES ET MOUVEMENT')
print('=' * 76)
for path in PAGES:
    doc = get(path)
    imgs = re.findall(r'<img[^>]*>', doc)
    no_alt = [i for i in imgs if 'alt=' not in i]
    no_dim = [i for i in imgs if 'width=' not in i or 'height=' not in i]
    svgs = re.findall(r'<svg[^>]*>', doc)
    svg_no_hidden = [s for s in svgs if 'aria-hidden' not in s and 'role="img"' not in s]
    if no_alt:
        problems.append(f'{path} : {len(no_alt)} <img> sans alt')
    if no_dim:
        problems.append(f'{path} : {len(no_dim)} <img> sans dimensions')
    if svg_no_hidden:
        problems.append(f'{path} : {len(svg_no_hidden)} <svg> ni aria-hidden ni role=img')
    print(f'  {path:<34} img {len(imgs)} (sans alt {len(no_alt)}, sans dim {len(no_dim)}) · '
          f'svg {len(svgs)} (non masqués {len(svg_no_hidden)})')

print()
print('=' * 76)
print('RÉVÉLATION AU DÉFILEMENT')
print('=' * 76)
home = get('/')
home_without_scripts = re.sub(r'<script\b[^>]*>.*?</script>', '', home, flags=re.S | re.I)
targets = len(re.findall(r'<[^>]+\bdata-reveal-target(?:="[^"]*")?[^>]*>', home_without_scripts))
bootstrap = 'prefers-reduced-motion' in home
print(f'  cibles sur l’accueil        : {targets}')
print(f'  script d’amorçage présent   : {"oui" if bootstrap else "NON"}')
print(f'  contenu visible sans JS     : {"oui" if "data-motion" not in home else "à vérifier"}')
if targets > 10:
    problems.append(f'trop de cibles de révélation ({targets})')

print()
print('=' * 76)
if problems:
    print(f'{len(problems)} PROBLÈME(S)')
    for p in problems:
        print(f'  - {p}')
    sys.exit(1)
print('AUCUN PROBLÈME DÉTECTÉ')
