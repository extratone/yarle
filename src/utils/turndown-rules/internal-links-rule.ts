import marked, { Token } from 'marked';

import { normalizeTitle } from '../filename-utils';
import { OutputFormat } from '../../output-format';
import { yarleOptions } from '../../yarle';
import { getTurndownService } from '../turndown-service';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';

export const removeBrackets = (str: string): string => {
    return str.replace(/\[|\]/g, '');
};
export const wikiStyleLinksRule = {
    filter: filterByNodeName('A'),
    replacement: (content: any, node: any) => {
        const nodeProxy = getAttributeProxy(node);
        if (nodeProxy.href) {
            /*internalLink [[]]
            realLink []()
            anchor [[a#v|c]]
            */
            /*if (nodeProxy.href.value.startsWith('evernote://'))
                return `[[${removeBrackets(node.innerHTML)}]]`
            else*/
            const internalTurndownedContent = getTurndownService().turndown(removeBrackets(node.innerHTML));
            const lexer = new marked.Lexer({});
            const tokens = lexer.lex(internalTurndownedContent) as any;
            let token: any = {
                mdKeyword: '',
                text: internalTurndownedContent,
            };
            if (tokens.length > 0 && tokens[0]['type'] === 'heading') {
                token = tokens[0];
                token['mdKeyword'] = `${'#'.repeat(tokens[0]['depth'])} `;
            }

            if (nodeProxy.href.value.startsWith('http') ||
                nodeProxy.href.value.startsWith('www') ||
                nodeProxy.href.value.startsWith('file')) {

                    return `${token['mdKeyword']}[${token['text']}](${nodeProxy.href.value})`;
                }
            if (nodeProxy.href.value.startsWith('evernote://')) {
                const fileName = normalizeTitle(token['text']);
                const displayName = token['text'];
                if (yarleOptions.outputFormat === OutputFormat.ObsidianMD) {
                    return `${token['mdKeyword']}[[${fileName}|${displayName}]]`;
                }

                if (yarleOptions.outputFormat === OutputFormat.UrlEncodeMD) {
                    return  `${token['mdKeyword']}[${displayName}](${encodeURI(fileName)})`;
                }

                return  `${token['mdKeyword']}[${displayName}](${fileName})`;

            }

            return (yarleOptions.outputFormat === OutputFormat.ObsidianMD)
            ? `${token['mdKeyword']}[[${nodeProxy.href.value} | ${token['text']}]]`
            : `${token['mdKeyword']}[[${nodeProxy.href.value}]]`;
            // todo embed

            /*return (
                (!nodeProxy.href.value.startsWith('http') &&
                 !nodeProxy.href.value.startsWith('www')) ||
                 nodeProxy.href.value.startsWith('evernote://')
                )
                ? `[[${removeBrackets(node.innerHTML)}]]`
                : (yarleOptions.outputFormat === OutputFormat.ObsidianMD)
                    ? `![[${removeBrackets(node.innerHTML)}]]`
                    : `[${removeBrackets(node.innerHTML)}](${nodeProxy.href.value})`;
            */
        }
    },
};
