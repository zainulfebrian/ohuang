const fs = require('fs');
const path = require('path');

// Configuration
const PATCH_FILE = 'patch.xml';

// ANSI Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

function applyPatch() {
    console.log(`${colors.cyan}=== Starting Auto-Patcher ===${colors.reset}`);

    if (!fs.existsSync(PATCH_FILE)) {
        console.error(`${colors.red}Error: File '${PATCH_FILE}' tidak ditemukan.${colors.reset}`);
        console.log(`Silakan buat file '${PATCH_FILE}' dan paste output XML dari AI ke dalamnya.`);
        return;
    }

    const xmlContent = fs.readFileSync(PATCH_FILE, 'utf8');

    // Regex to extract file path and content
    // Looks for: <file>PATH</file> ... <content><![CDATA[CONTENT]]></content>
    const regex = /<change>\s*<file>(.*?)<\/file>[\s\S]*?<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>\s*<\/change>/g;

    let match;
    let count = 0;

    while ((match = regex.exec(xmlContent)) !== null) {
        const relativePath = match[1].trim();
        const fileContent = match[2];
        const fullPath = path.resolve(__dirname, relativePath);
        const dirName = path.dirname(fullPath);

        try {
            // Ensure directory exists
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
                console.log(`${colors.yellow}Created directory: ${dirName}${colors.reset}`);
            }

            // Write the file
            fs.writeFileSync(fullPath, fileContent, 'utf8');
            console.log(`${colors.green}Updated: ${relativePath}${colors.reset}`);
            count++;
        } catch (err) {
            console.error(`${colors.red}Failed to write ${relativePath}: ${err.message}${colors.reset}`);
        }
    }

    if (count === 0) {
        console.log(`${colors.yellow}Tidak ada perubahan yang ditemukan dalam '${PATCH_FILE}'. Pastikan format XML benar.${colors.reset}`);
    } else {
        console.log(`${colors.cyan}=== Selesai! ${count} file berhasil diperbarui ===${colors.reset}`);
        
        // Optional: Clear the patch file after success to avoid double patching
        // fs.writeFileSync(PATCH_FILE, '', 'utf8'); 
    }
}

applyPatch();