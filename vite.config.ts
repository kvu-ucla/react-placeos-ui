import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Build stamp for the SupportModal on-glass diagnostics — the staleness
// check when debugging the physical panel, where devtools can't attach.
let gitSha = 'unknown';
try {
    gitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
    /* not a git checkout (e.g. tarball CI) — keep 'unknown' */
}
const BUILD_INFO = `${gitSha} @ ${new Date().toISOString()}`;

//////////////////////////////////////////////////////////////
///////////////////   Proxy Configuration   //////////////////
//////////////////////////////////////////////////////////////

/** FQDN to proxy requests. i.e. No protocol and path should be in the value */
const domain = 'placeos-prod.avit.it.ucla.edu';
/** Whether the proxied endpoints use SSL */
const secure = true;
/** Whether the SSL certificate used is valid on the internet */
const valid_ssl = true;

const context = [
    '/control',
    '/auth',
    '/api',
    '/styles',
    '/scripts',
    '/login',
    '/backoffice',
    '/r',
];
const ws_context = ['/control/websocket', '/api'];

const PROXY_MAP: Record<string, ProxyOptions> = {};

const baseConfig: ProxyOptions = {
    target: `http${secure ? 's' : ''}://${domain}`,
    secure: valid_ssl,
    changeOrigin: true,
};

context.forEach((path) => {
    PROXY_MAP[path] = { ...baseConfig };
});

ws_context.forEach((path) => {
    PROXY_MAP[path] = { ...baseConfig, ws: true };
});

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/@placeos/ts-client/dist/oauth-resp.html',
                    dest: '.',
                },
            ],
        }),
    ],
    base: './',
    define: {
        __BUILD_INFO__: JSON.stringify(BUILD_INFO),
    },
    server: {
        proxy: PROXY_MAP,
    },
});
