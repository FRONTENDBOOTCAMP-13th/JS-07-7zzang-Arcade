import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';
import { globby } from 'globby';

// 초기 설치 : npm install -D tsx
// 명령어 : npm run convert:webp (package.json 단축어 작성)

/**
 * 프로젝트 루트 경로 및 디렉토리 설정
 */
const PROJECT_ROOT = process.cwd();
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backup');
const LOG_FILE = path.join(BACKUP_DIR, 'webp-convert.log');

/**
 * 로그를 터미널과 파일에 동시에 기록
 * @param message 출력할 메시지
 */
async function log(message: string): Promise<void> {
  console.log(message);
  await fs.appendFile(LOG_FILE, `${message}\n`);
}

/**
 * 변환 대상 코드 파일 경로 패턴
 */
const FILE_PATTERNS = ['index.html', 'src/**/*.ts', 'src/**/*.html', 'src/**/*.css'];

/**
 * PNG => WebP 변환 및 코드 내 경로 수정
 */
async function convertPngToWebpWithBackup(): Promise<void> {
  // 백업 디렉토리 및 로그 초기화
  await fs.ensureDir(BACKUP_DIR);
  await fs.writeFile(LOG_FILE, `실행 시각: ${new Date().toLocaleString()}\n\n`);

  // 이미지가 위치한 디렉토리 목록 직접 지정
  const IMAGE_DIRS = [path.join(PROJECT_ROOT, 'src/assets/images'), path.join(PROJECT_ROOT, 'src/assets/icons'), path.join(PROJECT_ROOT, 'public/images')];

  // 코드 파일들 수집
  const TARGET_FILES = await globby(FILE_PATTERNS);
  const pngPaths = new Set<string>();

  // 코드 내 .png 경로 수집
  for (const filePath of TARGET_FILES) {
    const content = await fs.readFile(filePath, 'utf-8');
    const matches = content.match(/['"]([^'"]+\.png)['"]/g);
    if (!matches) continue;

    matches.forEach(match => {
      const cleaned = match.replace(/['"]/g, '');
      pngPaths.add(cleaned);
    });
  }

  // PNG => WebP 변환 및 백업 수행
  for (const pngPath of pngPaths) {
    const fileName = path.basename(pngPath);
    let found = false;

    for (const dir of IMAGE_DIRS) {
      const absPngPath = path.join(dir, fileName);
      const webpPath = absPngPath.replace(/\.png$/, '.webp');

      if (fs.existsSync(absPngPath)) {
        if (fs.existsSync(webpPath)) {
          await log(`이미 변환됨: ${webpPath}`);
          found = true;
          break;
        }

        try {
          const backupPath = path.join(BACKUP_DIR, fileName);
          await fs.copyFile(absPngPath, backupPath);
          await log(`백업 완료: ${backupPath}`);

          await sharp(absPngPath).toFile(webpPath);
          await log(`변환 완료: ${webpPath}`);

          await fs.remove(absPngPath);
          await log(`PNG 삭제됨: ${absPngPath}`);

          found = true;
          break;
        } catch (err) {
          await log(`변환 실패: ${absPngPath}`);
          await log(err instanceof Error ? err.message : String(err));
        }
      }
    }

    if (!found) {
      await log(`PNG 파일을 찾을 수 없음: ${pngPath}`);
    }
  }

  // 코드 내 .png => .webp 경로 수정
  for (const filePath of TARGET_FILES) {
    let content = await fs.readFile(filePath, 'utf-8');
    const updated = content.replace(/(\.png)(?=['"])/g, '.webp');
    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf-8');
      await log(`경로 수정 완료: ${filePath}`);
    }
  }

  await log(`\n변환 및 경로 수정이 완료되었습니다.`);
}

// 예외 처리 포함 실행
convertPngToWebpWithBackup().catch(async err => {
  await fs.ensureDir(BACKUP_DIR);
  await fs.appendFile(LOG_FILE, `예외 발생: ${err instanceof Error ? err.message : String(err)}\n`);
  console.error(err);
});
