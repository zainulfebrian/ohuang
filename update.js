import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for ESM __dirname

// --- ESM Fix for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -----------------------------

// Colors
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

// Load Metadata to get Repo Info
const metadataPath = path.join(__dirname, 'metadata.json');
if (!fs.existsSync(metadataPath)) {
    console.error(`${colors.red}Error: metadata.json tidak ditemukan.${colors.reset}`);
    process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const { username, repo, branch } = metadata.github;

if (username === "USERNAME_GITHUB_ANDA" || repo === "NAMA_REPO_ANDA") {
    console.error(`${colors.red}Error: Harap edit file 'metadata.json' dan masukkan username & repo GitHub Anda.${colors.reset}`);
    process.exit(1);
}

const BASE_URL = `https://raw.githubusercontent.com/${username}/${repo}/${branch}`;

// List of files to sync
const FILES_TO_SYNC = [
    'App.tsx',
    'index.tsx',
    'index.html',
    'types.ts',
    'constants.ts',
    'style.css',
    'metadata.json',
    'utils/formatters.ts',
    'utils/excel.ts',
];

console.log(`${colors.cyan}=== Memulai Update dari GitHub: ${username}/${repo} ===${colors.reset}`);

function downloadFile(relativePath) {
    const url = `${BASE_URL}/${relativePath}`;
    const localPath = path.join(__dirname, relativePath);
    const dir = path.dirname(localPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const fileStream = fs.createWriteStream(localPath);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`${colors.green}Updated: ${relativePath}${colors.reset}`);
                    resolve();
                });
            } else {
                console.error(`${colors.yellow}Skipped (Not Found): ${relativePath} (Status: ${res.statusCode})${colors.reset}`);
                resolve(); 
            }
        }).on('error', (err) => {
            console.error(`${colors.red}Error downloading ${relativePath}: ${err.message}${colors.reset}`);
            reject(err);
        });
    });
}

async function runUpdate() {
    try {
        for (const file of FILES_TO_SYNC) {
            await downloadFile(file);
        }
        console.log(`${colors.cyan}=== Update Selesai! Silakan refresh browser Anda. ===${colors.reset}`);
    } catch (e) {
        console.error("Update gagal:", e);
    }
}

runUpdate();