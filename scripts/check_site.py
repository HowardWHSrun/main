#!/usr/bin/env python3
"""Check this static site's navigation, local assets, and bilingual markup.

Run from any directory: python3 scripts/check_site.py
Uses only Python's standard library; no network access or build step required.
"""
from __future__ import annotations

import argparse
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
CSS_URL = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)''', re.I)


class Page(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids: list[str] = []
        self.references: list[tuple[str, int]] = []
        self.tags: list[tuple[str, dict, int]] = []
        self.errors: list[str] = []
        self.stack: list[tuple[str, dict, int]] = []
        self.style_depth = 0

    def error(self, line: int, message: str):
        self.errors.append(f'{self.path}:{line}: {message}')

    def handle_starttag(self, tag, attrs):
        line = self.getpos()[0]
        attributes = dict(attrs)
        for key, count in Counter(key for key, _ in attrs).items():
            if count > 1:
                self.error(line, f'duplicate {key!r} attribute')
        if self.stack:
            parent_tag, parent_attrs, parent_line = self.stack[-1]
            if 'data-en' in parent_attrs or 'data-zh' in parent_attrs:
                self.error(parent_line, f'translatable <{parent_tag}> contains <{tag}>; textContent would erase it')
        if ('data-en' in attributes) != ('data-zh' in attributes):
            self.error(line, 'translation must include both data-en and data-zh')
        if 'id' in attributes:
            self.ids.append(attributes['id'])
        for name in ('href', 'src', 'poster'):
            if attributes.get(name):
                self.references.append((attributes[name], line))
        for name in ('srcset', 'imagesrcset'):
            # Data URLs contain commas and do not reference local files.
            if attributes.get(name) and not attributes[name].lstrip().startswith('data:'):
                self.references.extend((item.strip().split()[0], line)
                                       for item in attributes[name].split(',') if item.strip())
        if 'style' in attributes:
            self.references.extend((next(x for x in match.groups() if x is not None), line)
                                   for match in CSS_URL.finditer(attributes['style']))
        if tag == 'img' and 'alt' not in attributes:
            self.error(line, 'image is missing an alt attribute')
        if tag == 'a' and attributes.get('target') == '_blank':
            if 'noopener' not in (attributes.get('rel') or '').split():
                self.error(line, 'new-tab link is missing rel="noopener"')
        self.tags.append((tag, attributes, line))
        if tag not in VOID:
            self.stack.append((tag, attributes, line))
        if tag == 'style':
            self.style_depth += 1

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack or self.stack[-1][0] != tag:
            self.error(self.getpos()[0], f'misnested closing </{tag}>')
            return
        self.stack.pop()
        if tag == 'style':
            self.style_depth -= 1

    def handle_data(self, data):
        if self.style_depth:
            self.references.extend((next(x for x in match.groups() if x is not None), self.getpos()[0])
                                   for match in CSS_URL.finditer(data))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--base-url', default='https://howardwhsrun.github.io/main/')
    args = parser.parse_args()
    root = args.root.resolve()
    base = args.base_url.rstrip('/') + '/'
    base_parts = urlsplit(base)
    errors: list[str] = []
    pages: dict[Path, Page] = {}
    references: list[tuple[Path, str, int]] = []
    source_paths = [p for p in root.rglob('*') if p.is_file() and
                    not any(part.startswith('.') or part == 'node_modules' for part in p.relative_to(root).parts)]

    for path in source_paths:
        if path.suffix in ('.html', '.css', '.js', '.svg', '.xml', '.txt'):
            data = path.read_bytes()
            if b'\0' in data:
                errors.append(f'{path.relative_to(root)}: contains NUL bytes')
        if path.suffix == '.html':
            page = Page(path.relative_to(root))
            page.feed(path.read_text(encoding='utf-8'))
            page.close()
            if page.stack:
                errors.append(f'{page.path}: unclosed elements: {[tag for tag, _, _ in page.stack]}')
            errors.extend(page.errors)
            pages[path] = page
            references.extend((path, ref, line) for ref, line in page.references)
            for ident, count in Counter(page.ids).items():
                if count > 1:
                    errors.append(f'{page.path}: duplicate id {ident!r}')
            for tag in ('h1', 'main', 'title'):
                if sum(t == tag for t, _, _ in page.tags) != 1:
                    errors.append(f'{page.path}: expected exactly one <{tag}>')
            canonical = [a.get('href') for t, a, _ in page.tags if t == 'link' and a.get('rel') == 'canonical']
            expected = base if page.path == Path('index.html') else urljoin(base, page.path.as_posix())
            if canonical != [expected]:
                errors.append(f'{page.path}: canonical must be {expected}')
        elif path.suffix == '.css':
            css = re.sub(r'/\*.*?\*/', '', path.read_text(encoding='utf-8'), flags=re.S)
            references.extend((path, next(x for x in match.groups() if x is not None),
                               css.count('\n', 0, match.start()) + 1) for match in CSS_URL.finditer(css))

    def resolve_reference(source: Path, reference: str, line: int):
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            if url.scheme not in ('http', 'https') or url.netloc != base_parts.netloc:
                return
            if not url.path.startswith(base_parts.path):
                return
            relative = unquote(url.path[len(base_parts.path):])
            target = root / relative
        elif url.path.startswith('/'):
            if not url.path.startswith(base_parts.path):
                errors.append(f'{source.relative_to(root)}:{line}: root URL escapes the project site: {reference}')
                return
            target = root / unquote(url.path[len(base_parts.path):])
        else:
            target = source.parent / unquote(url.path) if url.path else source
        target = target.resolve()
        if not target.is_relative_to(root):
            errors.append(f'{source.relative_to(root)}:{line}: path escapes site: {reference}')
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'{source.relative_to(root)}:{line}: missing local target {reference}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{source.relative_to(root)}:{line}: missing anchor {reference}')

    for source, reference, line in references:
        resolve_reference(source, reference, line)

    sitemap = root / 'sitemap.xml'
    try:
        sitemap_urls = [node.text for node in ET.parse(sitemap).findall('.//{*}loc')]
        expected_urls = {base if path == root / 'index.html' else urljoin(base, path.relative_to(root).as_posix())
                         for path in pages}
        if set(sitemap_urls) != expected_urls or len(sitemap_urls) != len(expected_urls):
            errors.append('sitemap.xml: entries must match the canonical HTML pages exactly')
        for url in sitemap_urls:
            resolve_reference(sitemap, url, 1)
    except (OSError, ET.ParseError) as exc:
        errors.append(f'sitemap.xml: {exc}')
    robots = root / 'robots.txt'
    if not robots.is_file() or f'Sitemap: {base}sitemap.xml' not in robots.read_text():
        errors.append('robots.txt: missing correct sitemap URL')

    if errors:
        print('\n'.join(f'FAIL {error}' for error in errors))
        return 1
    print(f'PASS {len(pages)} HTML pages; {len(references)} URL references; local assets/anchors, '
          'HTML structure, translations, metadata, sitemap, and source encoding.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
