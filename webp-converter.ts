import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';
import { globby } from 'globby';

/**
 * 설정
 */
const PROJECT_ROOT = process.cwd();
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backup/png-originals');
const IMAGE_DIRS = [path.join(PROJECT_ROOT, 'src/assets/images'), path.join(PROJECT_ROOT, 'public/images')];

const FILE_PATTERNS = ['index.html', 'src/main.ts', 'src/pages/**/*.ts', 'src/pages/**/*.html'];

async function convertPngToWebpWithBackup() {
  // 1. 모든 코드 파일 경로 수집
  const TARGET_FILES = await globby(FILE_PATTERNS);

  const pngPaths = new Set<string>();

  // 2. 각 코드 파일에서 .png 경로 수집
  for (const filePath of TARGET_FILES) {
    const content = await fs.readFile(filePath, 'utf-8');
    const matches = content.match(/["']([^"']+\.png)["']/g);
    if (!matches) continue;

    matches.forEach(match => {
      const cleaned = match.replace(/['"]/g, '');
      pngPaths.add(cleaned);
    });
  }

  // 3. PNG -> WebP 변환 + 백업 + 삭제
  for (const pngPath of pngPaths) {
    const fileName = path.basename(pngPath);
    let found = false;

    for (const baseDir of IMAGE_DIRS) {
      const absPath = path.join(baseDir, fileName);
      if (fs.existsSync(absPath)) {
        const webpPath = absPath.replace(/\.png$/, '.webp');

        // 백업 위치 유지
        const relativeDir = path.relative(PROJECT_ROOT, path.dirname(absPath));
        const backupPath = path.join(BACKUP_DIR, relativeDir, fileName);

        try {
          await fs.ensureDir(path.dirname(backupPath));
          await fs.copyFile(absPath, backupPath);
          console.log(`백업됨: ${backupPath}`);

          await sharp(absPath).toFile(webpPath);
          console.log(`변환 완료: ${webpPath}`);

          fs.unlinkSync(absPath);
          console.log(`PNG 삭제됨: ${absPath}`);

          found = true;
          break;
        } catch (err) {
          console.warn(`변환 실패: ${absPath}`);
          console.error(err);
        }
      }
    }

    if (!found) {
      console.warn(`PNG 파일을 찾을 수 없음: ${pngPath}`);
    }
  }

  // 4. 코드 내 .png -> .webp 치환
  for (const filePath of TARGET_FILES) {
    let content = await fs.readFile(filePath, 'utf-8');
    const updated = content.replace(/(\.png)(['"])/g, '.webp$2');
    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf-8');
      console.log(`경로 수정 완료: ${filePath}`);
    }
  }

  console.log('\n 이미지 변환 + 백업 + 코드 수정 + PNG 삭제 완료');
}

convertPngToWebpWithBackup().catch(console.error);
